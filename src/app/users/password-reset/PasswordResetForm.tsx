"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { showToast, ToastContainer } from "@/components/ui/ToastNotifications";

export default function PasswordResetForm() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const saved = (localStorage.getItem("theme") as "light" | "dark" | null) || "light";
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
    }, []);

    function toggleTheme() {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        localStorage.setItem("theme", next);
        document.documentElement.setAttribute("data-theme", next);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); setLoading(true);
        await fetch("/api/users/password-reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        setSent(true); setLoading(false);
    }

    return (
        <div className="auth-page"><ToastContainer />

            {/* Back to Home + theme toggle */}
            <div className="back-to-home">
                <Link href="/">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Back to Home
                </Link>
                <button className="theme-toggle-auth" onClick={toggleTheme} aria-label="Toggle theme">
                    <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                </button>
            </div>

            <div className="auth-container">
                <div className="auth-left">
                    <div className="auth-left-content">
                        <Link href="/" className="logo">
                            <div className="logo-icon white"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg></div>
                            <span>SmartLibrary</span>
                        </Link>
                        <div className="auth-left-text">
                            <h1>Reset Your Password</h1>
                            <p>Enter your email and we&apos;ll send you a secure link to reset your password.</p>
                            <div className="auth-features">
                                {[
                                    { icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>, title: "Check Your Email", desc: "Reset link sent instantly" },
                                    { icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, title: "Secure Reset", desc: "Link expires in 24 hours" },
                                ].map(({ icon, title, desc }) => (
                                    <div key={title} className="auth-feature">
                                        <div className="auth-feature-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">{icon}</svg>
                                        </div>
                                        <div><h4>{title}</h4><p>{desc}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="auth-decorations"><div className="decoration-circle circle-1" /><div className="decoration-circle circle-2" /></div>
                </div>

                <div className="auth-right">
                    <div className="auth-form-container">
                        {sent ? (
                            <div style={{ textAlign: "center" }}>
                                <div style={{ width: 80, height: 80, background: "rgba(16,185,129,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 40, height: 40 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                </div>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>Check Your Email</h2>
                                <p style={{ color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.7 }}>
                                    If an account with <strong>{email}</strong> exists, we&apos;ve sent a password reset link. Check your inbox and spam folder.
                                </p>
                                <Link href="/users/login" className="btn btn-primary">Back to Login</Link>
                            </div>
                        ) : (
                            <div className="auth-form">
                                <div className="auth-form-header">
                                    <h2>Forgot Password</h2>
                                    <p>We&apos;ll send a reset link to your email</p>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="reset-email">Email Address</label>
                                        <div className="input-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                            <input id="reset-email" type="email" placeholder="Enter your email address" value={email} onChange={e => setEmail(e.target.value)} required />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                        {loading ? "Sending…" : "Send Reset Link"}
                                    </button>
                                </form>
                                <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                    Remember your password? <Link href="/users/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Sign in</Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
