import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { buildHtmlEmail } from "@/lib/email-templates";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { subject, message, targetRole, specificUserIds = [] } = await req.json();
    if (!subject?.trim() || !message?.trim()) return NextResponse.json({ error: "Subject and message required." }, { status: 400 });

    const whereClause: any = { isActive: true };
    if (targetRole === "specific" && specificUserIds.length > 0) {
        whereClause.id = { in: specificUserIds };
    } else if (targetRole && targetRole !== "all" && targetRole !== "specific") {
        whereClause.role = targetRole;
    }

    const users = await prisma.user.findMany({ where: whereClause, select: { id: true, email: true, username: true, firstName: true, lastName: true } });
    let count = 0;

    for (const user of users) {
        if (!user.email) continue;
        
        const fullName = user.firstName ? `${user.firstName} ${user.lastName}` : user.username;
        const personalizedBody = message
            .replace(/{name}/g, fullName)
            .replace(/{username}/g, user.username)
            .replace(/\n/g, "<br>");

        const htmlContent = `
            <h2>${subject}</h2>
            <p>${personalizedBody}</p>
        `;

        await sendEmail({
            to: user.email,
            subject,
            html: buildHtmlEmail(subject, htmlContent),
        }).catch(() => { });
        count++;
    }

    return NextResponse.json({ success: true, count });
}
