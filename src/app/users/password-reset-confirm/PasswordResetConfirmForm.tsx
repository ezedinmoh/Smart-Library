"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast, ToastContainer } from "@/components/ui/ToastNotifications";

export default function PasswordResetConfirmForm({ token, email }: { token: string; email: string }) {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showCPw, setShowCPw] = useState(false);
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
        e.preventDefault();
        if (password !== confirm) { showToast("Passwords do not match.", "error"); return; }
        if (password.length < 8) { showToast("Password must be at least 8 characters.", "error"); return; }
        setLoading(true);
        const res = await fetch("/api/users/password-reset-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, email, password }),
        });
        const data = await res.json();
        if (res.ok) { showToast("Password changed! Please log in.", "success"); router.push("/users/login"); }
        else showToast(data.error || "Failed. Link may have expired.", "error");
        setLoading(false);
    }

    if (!token || !email) return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-right" style={{ gridColumn: "1 / -1" }}>
                    <div className="auth-form-container">
                        <div style={{ textAlign: "center" }}>
                            <div style={{ width: 72, height: 72, background: "rgba(239,68,68,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 36, height: 36 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            </div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>Invalid Reset Link</h2>
                            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>This link is invalid or has expired.</p>
                            <Link href="/users/password-reset" className="btn btn-primary">Request New Link</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

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
                            <h1>Create New Password</h1>
                            <p>Choose a strong, unique password that you don&apos;t use elsewhere.</p>
                            <div className="auth-features">
                                {[
                                    { icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, title: "Strong Password", desc: "At least 8 characters" },
                                    { icon: <><polyline points="20 6 9 17 4 12" /></>, title: "Instant Login", desc: "Login right after reset" },
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
                        <div className="auth-form">
                            <div className="auth-form-header"><h2>New Password</h2><p>Enter and confirm your new password</p></div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="input-wrapper">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        <input type={showPw ? "text" : "password"} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                                        <button type="button" className={`toggle-password${showPw ? " active" : ""}`} onClick={() => setShowPw(!showPw)}>
                                            <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                            <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <div className="input-wrapper">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        <input type={showCPw ? "text" : "password"} placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} className={confirm && password === confirm ? "valid" : confirm ? "invalid" : ""} required />
                                        <button type="button" className={`toggle-password${showCPw ? " active" : ""}`} onClick={() => setShowCPw(!showCPw)}>
                                            <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                            <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? "Saving…" : "Set New Password"}</button>
                            </form>
                            <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                <Link href="/users/login" style={{ color: "var(--primary)", fontWeight: 600 }}>← Back to login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
