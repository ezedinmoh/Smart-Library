import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, passwordResetTemplate } from "@/lib/mail";
import { getSiteName, getSiteUrl } from "@/lib/env";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const { email } = await req.json();
    // Always return 200 for security (don't reveal if email exists)
    if (!email) return NextResponse.json({ success: true });

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!user) return NextResponse.json({ success: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600_000); // 1 hour

    // Store token as a verification token
    await prisma.verificationToken.upsert({
        where: { identifier_token: { identifier: user.email, token } },
        create: { identifier: user.email, token, expires },
        update: { expires },
    });

    const siteUrl = getSiteUrl();
    const resetUrl = `${siteUrl}/users/password-reset-confirm?token=${token}&email=${encodeURIComponent(user.email)}`;
    const siteName = getSiteName();

    sendEmail({ to: user.email, subject: `Reset your ${siteName} password`, html: passwordResetTemplate({ username: user.username, resetUrl, siteName }) }).catch(console.error);

    return NextResponse.json({ success: true });
}
