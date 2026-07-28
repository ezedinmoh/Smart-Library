import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Verification Sent - Smart Library" };

export default async function VerificationSentPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
    const params = await searchParams;
    const email = params.email ?? "";
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", padding: "40px 20px" }}>
            <div style={{ background: "var(--background)", borderRadius: 16, maxWidth: 520, width: "100%", padding: 48, boxShadow: "var(--shadow-xl)", textAlign: "center" }}>
                <div style={{ width: 80, height: 80, background: "rgba(16,185,129,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 40, height: 40 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 12 }}>Check Your Email</h1>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
                    We've sent a verification email to <strong>{email}</strong>.<br />
                    Please click the link in the email to activate your account.
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 32 }}>Didn't receive the email? Check your spam folder.</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/users/resend-verification" className="btn btn-secondary">Resend Email</Link>
                    <Link href="/users/login" className="btn btn-primary">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
