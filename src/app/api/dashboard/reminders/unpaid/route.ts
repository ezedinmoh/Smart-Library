import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { buildHtmlEmail } from "@/lib/email-templates";
import type { SessionUser } from "@/types";

export async function POST(req: Request) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let body: any = {};
    try { body = await req.json(); } catch(e) {}
    const { recordIds = [], sendAll = true } = body;

    const whereClause: any = { fineAmount: { gt: 0 }, finePaid: false };
    if (!sendAll && recordIds.length > 0) {
        whereClause.id = { in: recordIds };
    }

    const records = await prisma.borrowRecord.findMany({
        where: whereClause,
        include: { user: true, book: true },
    });

    let count = 0;
    for (const r of records) {
        if (!r.user.email) continue;
        const fine = parseFloat(r.fineAmount.toString());

        const htmlContent = `
            <h2 style="color:#0ea5e9">Unpaid Fine Notice</h2>
            <p>Hi <strong>${r.user.username}</strong>,</p>
            <p>You have an unpaid fine of <strong style="color:#0ea5e9; font-size: 18px;">ETB ${fine.toFixed(2)}</strong> for the book <strong>"${r.book.title}"</strong>.</p>
            <div class="highlight-box" style="border-left-color: #0ea5e9; background-color: #f0f9ff;">
                <p style="color: #0369a1;">Please log in to your account and complete the payment to avoid restrictions.</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/borrow/fines" class="button" style="background-color: #0ea5e9;">Pay Fine Now</a>
        `;

        await sendEmail({
            to: r.user.email,
            subject: `💰 Unpaid Library Fine Notice: ${r.book.title}`,
            html: buildHtmlEmail(`💰 Unpaid Library Fine Notice: ${r.book.title}`, htmlContent),
        }).catch(console.error);
        count++;
    }

    return NextResponse.json({ success: true, count });
}
