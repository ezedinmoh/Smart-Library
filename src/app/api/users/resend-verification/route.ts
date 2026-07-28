import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailVerificationTemplate } from "@/lib/mail";
import { getSiteName, getSiteUrl } from "@/lib/env";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: true });

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, isActive: false } });
    if (!user) return NextResponse.json({ success: true }); // Don't reveal

    // Create new key
    const key = crypto.randomBytes(48).toString("hex");
    await prisma.emailAddress.upsert({
        where: { userId_email: { userId: user.id, email: user.email } },
        create: { userId: user.id, email: user.email, verified: false, primary: true, key },
        update: { key, verified: false },
    });

    const siteUrl = getSiteUrl();
    const siteName = getSiteName();
    const activateUrl = `${siteUrl}/users/verify-email/${key}`;

    sendEmail({ to: user.email, subject: `Verify your ${siteName} email`, html: emailVerificationTemplate({ username: user.username, activateUrl, siteName }) }).catch(console.error);
    return NextResponse.json({ success: true });
}
