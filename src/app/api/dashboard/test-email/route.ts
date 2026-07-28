import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/mail";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

    // Determine which provider is configured
    const smtpUser = process.env.BREVO_SMTP_USER || process.env.EMAIL_HOST_USER;
    const isGmail = smtpUser?.includes("@gmail.com");
    const provider = process.env.RESEND_API_KEY
        ? "Resend"
        : isGmail
        ? "Gmail SMTP"
        : smtpUser
        ? "Brevo SMTP"
        : "None (console log)";

    try {
        await sendEmail({
            to: email,
            subject: "Smart Library – Test Email",
            html: `<div style="font-family:Inter,sans-serif;padding:32px;background:#f8fafc">
      <div style="background:#fff;max-width:480px;margin:0 auto;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <h2 style="color:#10b981;margin:0 0 16px">✅ Email Configuration Working</h2>
        <p style="color:#64748b;line-height:1.6">This is a test email from your Smart Library system.</p>
        <p style="color:#64748b">If you received this, your <strong>${provider}</strong> email configuration is working correctly.</p>
        <p style="font-size:.875rem;color:#94a3b8;margin-top:24px">Sent by: ${u.username} (${u.email})</p>
      </div>
    </div>`,
        });
        return NextResponse.json({ success: true, provider });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Test Email] Failed:", message);
        return NextResponse.json({ error: `Failed to send email via ${provider}: ${message}` }, { status: 500 });
    }
}

