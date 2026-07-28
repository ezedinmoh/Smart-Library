import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Email Verified - Smart Library" };

export default async function VerifyEmailPage({ params }: { params: Promise<{ key: string }> }) {
    const { key } = await params;

    const emailAddr = await prisma.emailAddress.findUnique({ where: { key }, include: { user: true } });

    let success = false;
    let alreadyVerified = false;

    if (emailAddr) {
        if (emailAddr.verified) {
            alreadyVerified = true;
            success = true;
        } else {
            // Activate the user and mark email verified
            await Promise.all([
                prisma.emailAddress.update({ where: { id: emailAddr.id }, data: { verified: true, key: null } }),
                prisma.user.update({ where: { id: emailAddr.userId }, data: { isActive: true } }),
            ]);
            success = true;
        }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", padding: "40px 20px" }}>
            <div style={{ background: "var(--background)", borderRadius: 16, maxWidth: 480, width: "100%", padding: 40, boxShadow: "var(--shadow-xl)", textAlign: "center" }}>
                {success ? (
                    <>
                        <div style={{ width: 80, height: 80, background: "rgba(16,185,129,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 40, height: 40 }}><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 8 }}>Email Verified!</h1>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
                            {alreadyVerified ? "Your email was already verified." : `Your email has been verified successfully. You can now log in to your account.`}
                        </p>
                        <Link href="/users/login" className="btn btn-primary">Sign In Now</Link>
                    </>
                ) : (
                    <>
                        <div style={{ width: 80, height: 80, background: "rgba(239,68,68,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 40, height: 40 }}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        </div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 8 }}>Invalid Link</h1>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>This verification link is invalid or has expired.</p>
                        <Link href="/users/resend-verification" className="btn btn-primary">Resend Verification Email</Link>
                    </>
                )}
            </div>
        </div>
    );
}
