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

    const whereClause: any = { status: "overdue", finePaid: false };
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
            <h2 style="color:#ef4444">Overdue Book Reminder</h2>
            <p>Hi <strong>${r.user.username}</strong>,</p>
            <p>Your borrowed book <strong>"${r.book.title}"</strong> is currently overdue.</p>
            <div class="highlight-box" style="border-left-color: #ef4444; background-color: #fef2f2;">
                <p style="color: #991b1b; font-weight: 600;">Outstanding Fine: ETB ${fine.toFixed(2)}</p>
                <p style="color: #991b1b; margin-top: 4px; font-size: 14px;">Please return the book and pay your fine as soon as possible to avoid further charges.</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/borrow" class="button" style="background-color: #ef4444;">Review My Account</a>
        `;

        await sendEmail({
            to: r.user.email,
            subject: `⚠ Overdue Book: ${r.book.title}`,
            html: buildHtmlEmail(`⚠ Overdue Book: ${r.book.title}`, htmlContent),
        }).catch(console.error);
        count++;
    }

    return NextResponse.json({ success: true, count });
}
