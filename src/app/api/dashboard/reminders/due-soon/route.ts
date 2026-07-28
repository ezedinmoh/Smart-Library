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

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const threeDays = new Date(today); threeDays.setDate(threeDays.getDate() + 3);

    const whereClause: any = { status: "borrowed", dueDate: { gte: today, lte: threeDays } };
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
        const daysLeft = Math.ceil((new Date(r.dueDate).getTime() - today.getTime()) / 86400000);
        
        const htmlContent = `
            <h2 style="color:#f59e0b">Book Due Soon</h2>
            <p>Hi <strong>${r.user.username}</strong>,</p>
            <p>Your book <strong>"${r.book.title}"</strong> is due in <strong style="color:#f59e0b">${daysLeft} day(s)</strong>.</p>
            <div class="highlight-box">
                <p>Please return it on time to avoid fines.</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/borrow" class="button">View My Books</a>
        `;

        await sendEmail({
            to: r.user.email,
            subject: `📚 Book Due Soon: ${r.book.title}`,
            html: buildHtmlEmail(`📚 Book Due Soon: ${r.book.title}`, htmlContent),
        }).catch(console.error);
        count++;
    }

    return NextResponse.json({ success: true, count });
}
