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
    const { recipientType = "all", subject = "", body: emailBody = "", specificUserIds = [] } = body;

    if (!subject.trim() || !emailBody.trim()) {
        return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
    }

    const whereClause: any = { isActive: true };
    if (recipientType === "students") whereClause.role = "student";
    else if (recipientType === "librarians") whereClause.role = "librarian";
    else if (recipientType === "specific" && specificUserIds.length > 0) whereClause.id = { in: specificUserIds };

    const users = await prisma.user.findMany({
        where: whereClause,
    });

    let count = 0;
    for (const user of users) {
        if (!user.email) continue;
        
        const fullName = user.firstName ? `${user.firstName} ${user.lastName}` : user.username;
        const personalizedBody = emailBody
            .replace(/{name}/g, fullName)
            .replace(/{username}/g, user.username)
            .replace(/\n/g, "<br>"); // Convert newlines to HTML breaks

        const htmlContent = `
            <h2>${subject}</h2>
            <p>${personalizedBody}</p>
        `;

        await sendEmail({
            to: user.email,
            subject: subject,
            html: buildHtmlEmail(subject, htmlContent),
        }).catch(console.error);
        count++;
    }

    return NextResponse.json({ success: true, count });
}
