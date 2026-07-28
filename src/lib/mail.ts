/**
 * Email sending utility
 * Priority order:
 *   1. Resend API  (RESEND_API_KEY)
 *   2. Gmail SMTP  (BREVO_SMTP_USER ending in @gmail.com + BREVO_SMTP_PASSWORD = App Password)
 *   3. Brevo SMTP  (BREVO_SMTP_USER + BREVO_SMTP_PASSWORD)
 *   4. Console log (development only — no credentials set)
 *
 * Gmail setup: enable 2FA → generate an App Password at https://myaccount.google.com/apppasswords
 * Use the 16-char App Password as BREVO_SMTP_PASSWORD, and your Gmail as BREVO_SMTP_USER.
 */

import nodemailer from "nodemailer";

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
}

async function sendViaResend(options: SendEmailOptions): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return false;

    try {
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);
        await resend.emails.send({
            from: options.from ?? process.env.DEFAULT_FROM_EMAIL ?? "noreply@smartlibrary.com",
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        return true;
    } catch (err) {
        console.error("[Mail] Resend failed:", err);
        return false;
    }
}

async function sendViaSMTP(options: SendEmailOptions): Promise<boolean> {
    const user = process.env.BREVO_SMTP_USER || process.env.EMAIL_HOST_USER;
    const pass = process.env.BREVO_SMTP_PASSWORD || process.env.EMAIL_HOST_PASSWORD;
    if (!user || !pass) return false;

    // Detect if we should route via Gmail SMTP or Brevo SMTP relay
    const isGmail = user.includes("@gmail.com");
    const provider = isGmail ? "Gmail" : "Brevo";
    const host = isGmail ? "smtp.gmail.com" : "smtp-relay.brevo.com";
    const port = isGmail ? 465 : 587;
    const secure = isGmail; // SSL on 465 for Gmail; STARTTLS on 587 for Brevo

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        });

        // Verify connection before sending so we get a clear error if credentials are wrong
        await transporter.verify();

        const from = options.from ?? process.env.DEFAULT_FROM_EMAIL ?? `noreply@smartlibrary.com`;
        const info = await transporter.sendMail({
            from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        console.log(`[Mail] Sent via ${provider} to ${options.to} — messageId: ${info.messageId}`);
        return true;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Mail] ${provider} SMTP failed: ${message}`);
        return false;
    }
}

/** Send email — tries Resend, then SMTP (Gmail/Brevo), then logs to console in dev */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
    const smtpUser = process.env.BREVO_SMTP_USER || process.env.EMAIL_HOST_USER;
    if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY && !smtpUser) {
        console.log(`[Mail DEV] To: ${options.to} | Subject: ${options.subject}`);
        if (options.html) {
            const urlMatch = options.html.match(/href="([^"]+)"/);
            if (urlMatch) {
                console.log(`[Mail DEV] Link: ${urlMatch[1]}`);
            }
        }
        return;
    }

    const sent = await sendViaResend(options);
    if (!sent) await sendViaSMTP(options);
}

// ── Email templates (mirrors Django templates) ────────────────────────────────

export function emailVerificationTemplate(ctx: {
    username: string;
    activateUrl: string;
    siteName: string;
}): string {
    return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;}
  .card{background:#fff;border-radius:16px;max-width:480px;margin:0 auto;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:32px;}
  .logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#10b981,#0ea9d2);border-radius:10px;}
  h1{font-size:1.5rem;font-weight:700;color:#0f172a;margin:0 0 8px;}
  p{color:#64748b;line-height:1.6;margin:0 0 16px;}
  .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#0ea9d2);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;margin:8px 0;}
  .url{word-break:break-all;color:#10b981;font-size:.875rem;}
  .footer{margin-top:32px;font-size:.75rem;color:#94a3b8;text-align:center;}
</style></head><body>
<div class="card">
  <div class="logo">
    <div class="logo-icon"></div>
    <strong style="font-size:1.1rem;color:#0f172a">${ctx.siteName}</strong>
  </div>
  <h1>Verify your email address</h1>
  <p>Hi <strong>${ctx.username}</strong>,</p>
  <p>Thanks for registering! Please verify your email address to activate your account.</p>
  <a href="${ctx.activateUrl}" class="btn">Verify Email</a>
  <p>Or copy this link:</p>
  <p class="url">${ctx.activateUrl}</p>
  <p>This link expires in 3 days. If you didn't create an account, ignore this email.</p>
  <div class="footer">&copy; ${new Date().getFullYear()} ${ctx.siteName}</div>
</div>
</body></html>`;
}

export function passwordResetTemplate(ctx: {
    username: string;
    resetUrl: string;
    siteName: string;
}): string {
    return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;}
  .card{background:#fff;border-radius:16px;max-width:480px;margin:0 auto;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  h1{font-size:1.5rem;font-weight:700;color:#0f172a;margin:0 0 8px;}
  p{color:#64748b;line-height:1.6;margin:0 0 16px;}
  .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#0ea9d2);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;}
  .footer{margin-top:32px;font-size:.75rem;color:#94a3b8;text-align:center;}
</style></head><body>
<div class="card">
  <h1>Reset your password</h1>
  <p>Hi <strong>${ctx.username}</strong>,</p>
  <p>We received a request to reset your password. Click the button below:</p>
  <a href="${ctx.resetUrl}" class="btn">Reset Password</a>
  <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  <div class="footer">&copy; ${new Date().getFullYear()} ${ctx.siteName}</div>
</div>
</body></html>`;
}

export function bookRequestApprovedTemplate(ctx: {
    username: string;
    bookTitle: string;
    dueDate: string;
    siteName: string;
    siteUrl: string;
}): string {
    return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;}
  .card{background:#fff;border-radius:16px;max-width:480px;margin:0 auto;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  h1{font-size:1.5rem;font-weight:700;color:#10b981;margin:0 0 8px;}
  p{color:#64748b;line-height:1.6;margin:0 0 16px;}
  .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#0ea9d2);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;}
  .info{background:#f0fdf4;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:16px 0;}
</style></head><body>
<div class="card">
  <h1>✅ Book Request Approved</h1>
  <p>Hi <strong>${ctx.username}</strong>,</p>
  <p>Your request for <strong>"${ctx.bookTitle}"</strong> has been approved!</p>
  <div class="info">
    <p style="margin:0"><strong>Due Date:</strong> ${ctx.dueDate}</p>
  </div>
  <p>Log in to your account to access your borrowed books.</p>
  <a href="${ctx.siteUrl}/borrow/my-books/" class="btn">View My Books</a>
  <p style="font-size:.75rem;color:#94a3b8;margin-top:32px;text-align:center">&copy; ${new Date().getFullYear()} ${ctx.siteName}</p>
</div>
</body></html>`;
}

export function bookRequestRejectedTemplate(ctx: {
    username: string;
    bookTitle: string;
    reason: string;
    siteName: string;
}): string {
    return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;}
  .card{background:#fff;border-radius:16px;max-width:480px;margin:0 auto;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  h1{font-size:1.5rem;font-weight:700;color:#ef4444;margin:0 0 8px;}
  p{color:#64748b;line-height:1.6;margin:0 0 16px;}
  .reason{background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:8px;}
</style></head><body>
<div class="card">
  <h1>❌ Book Request Rejected</h1>
  <p>Hi <strong>${ctx.username}</strong>,</p>
  <p>Your request for <strong>"${ctx.bookTitle}"</strong> has been rejected.</p>
  <div class="reason"><p style="margin:0"><strong>Reason:</strong> ${ctx.reason}</p></div>
  <p style="font-size:.75rem;color:#94a3b8;margin-top:32px;text-align:center">&copy; ${new Date().getFullYear()} ${ctx.siteName}</p>
</div>
</body></html>`;
}

export function paymentSuccessTemplate(ctx: {
    username: string;
    amount: string;
    currency: string;
    bookTitle: string;
    transactionId: string;
    siteName: string;
}): string {
    return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;}
  .card{background:#fff;border-radius:16px;max-width:480px;margin:0 auto;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  h1{font-size:1.5rem;font-weight:700;color:#10b981;margin:0 0 8px;}
  p{color:#64748b;line-height:1.6;margin:0 0 12px;}
  .info{background:#f0fdf4;border-radius:8px;padding:20px;margin:16px 0;}
  .row{display:flex;justify-content:space-between;margin-bottom:8px;}
</style></head><body>
<div class="card">
  <h1>✅ Payment Successful</h1>
  <p>Hi <strong>${ctx.username}</strong>, your fine payment was successful.</p>
  <div class="info">
    <div class="row"><span>Book:</span><strong>${ctx.bookTitle}</strong></div>
    <div class="row"><span>Amount Paid:</span><strong>${ctx.currency} ${ctx.amount}</strong></div>
    <div class="row"><span>Transaction ID:</span><code>${ctx.transactionId}</code></div>
  </div>
  <p style="font-size:.75rem;color:#94a3b8;margin-top:32px;text-align:center">&copy; ${new Date().getFullYear()} ${ctx.siteName}</p>
</div>
</body></html>`;
}
