"use client";
import { useState } from "react";
import Link from "next/link";
import { ToastContainer, showToast } from "@/components/ui/ToastNotifications";

export default function ResendVerificationForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); setLoading(true);
        const res = await fetch("/api/users/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        if (res.ok) setSent(true);
        else { const d = await res.json(); showToast(d.error || "Failed.", "error"); }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", padding: "40px 20px" }}>
            <ToastContainer />
            <div style={{ background: "var(--background)", borderRadius: 16, maxWidth: 480, width: "100%", padding: 40, boxShadow: "var(--shadow-xl)", textAlign: "center" }}>
                {sent ? (
                    <>
                        <div style={{ width: 72, height: 72, background: "rgba(16,185,129,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 36, height: 36 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        </div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>Email Sent!</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>If that email is registered and unverified, we've sent a new verification link.</p>
                        <Link href="/users/login" className="btn btn-primary">Back to Login</Link>
                    </>
                ) : (
                    <>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Resend Verification</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Enter your email to receive a new verification link.</p>
                        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? "Sending…" : "Resend Verification Email"}</button>
                        </form>
                        <p style={{ marginTop: 20, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            <Link href="/users/login" style={{ color: "var(--primary)" }}>Back to Login</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
