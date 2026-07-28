"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";
import { ToastContainer } from "@/components/ui/ToastNotifications";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Props { nextUrl?: string; errorParam?: string; }

export default function LoginForm({ nextUrl, errorParam }: Props) {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showResend, setShowResend] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const saved = (localStorage.getItem("theme") as "light" | "dark" | null) || "light";
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
        // Restore remembered username
        const remembered = localStorage.getItem("rememberedUsername");
        if (remembered) { setUsername(remembered); setRememberMe(true); }
    }, []);

    function toggleTheme() {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        localStorage.setItem("theme", next);
        document.documentElement.setAttribute("data-theme", next);
    }

    useEffect(() => {
        if (errorParam === "OAuthAccountNotLinked") {
            setError("This email is already registered. Please log in with your password.");
        } else if (errorParam === "CredentialsSignin") {
            setError("Invalid username or password. Please try again.");
        } else if (errorParam) {
            setError("An error occurred. Please try again.");
        }
    }, [errorParam]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await signIn("credentials", { username, password, redirect: false });
            if (res?.error === "EMAIL_NOT_VERIFIED") {
                setError("Please verify your email address before logging in.");
                setShowResend(true);
            } else if (res?.error) {
                setError("Invalid username or password. Please try again.");
            } else {
                if (rememberMe) {
                    localStorage.setItem("rememberedUsername", username);
                } else {
                    localStorage.removeItem("rememberedUsername");
                }
                showToast(`Welcome back, ${username}! You have successfully signed in.`, "success");
                setTimeout(() => {
                    router.push(nextUrl || "/dashboard");
                    router.refresh();
                }, 500);
            }
        } finally { setLoading(false); }
    }

    return (
        <div className="auth-page">
            <ToastContainer />
            <ConfirmModal />

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
                    {/* Full 8-ray sun icon */}
                    <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                </button>
            </div>

            <div className="auth-container">
                {/* Left panel */}
                <div className="auth-left">
                    <div className="auth-left-content">
                        <Link href="/" className="logo">
                            <div className="logo-icon white">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                            </div>
                            <span>SmartLibrary</span>
                        </Link>
                        <div className="auth-left-text">
                            <h1>Welcome to Your Digital Library</h1>
                            <p>Access thousands of books, manage your reading journey, and connect with a community of passionate readers.</p>
                            <div className="auth-features">
                                {[
                                    { icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>, title: "50,000+ Books", desc: "Vast collection across all genres" },
                                    { icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, title: "24/7 Access", desc: "Browse and borrow anytime" },
                                    { icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, title: "Secure System", desc: "Role-based access control" },
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
                    <div className="auth-decorations">
                        <div className="decoration-circle circle-1" />
                        <div className="decoration-circle circle-2" />
                        <div className="decoration-circle circle-3" />
                    </div>
                </div>

                {/* Right panel */}
                <div className="auth-right">
                    <div className="auth-form-container">
                        <div className="auth-form">
                            <div className="auth-form-header">
                                <h2>Welcome Back</h2>
                                <p>Sign in to continue to your library</p>
                            </div>

                            {error && (
                                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 20, color: "var(--error)", fontSize: "0.875rem" }}>
                                    {error}
                                    {showResend && (
                                        <> <Link href="/users/resend-verification" style={{ color: "#10b981", textDecoration: "underline", fontWeight: 600 }}>Resend verification email</Link></>
                                    )}
                                </div>
                            )}

                            {/* Social login — matching Django */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <button className="btn-social" onClick={() => signIn("google", { callbackUrl: nextUrl || "/dashboard" })}>
                                    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    Google
                                </button>
                                <button className="btn-social" onClick={() => signIn("github", { callbackUrl: nextUrl || "/dashboard" })}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                                    GitHub
                                </button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>or sign in with</span>
                                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="login-username">Username or Email</label>
                                    <div className="input-wrapper">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        <input id="login-username" type="text" placeholder="Enter your username or email" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="login-password">Password</label>
                                    <div className="input-wrapper">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        <input id="login-password" type={showPw ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                                        <button type="button" className={`toggle-password${showPw ? " active" : ""}`} onClick={() => setShowPw(!showPw)}>
                                            <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                            <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="form-options">
                                    {/* Functional remember me with custom checkmark */}
                                    <label className="checkbox-wrapper" htmlFor="remember-me">
                                        <input
                                            id="remember-me"
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={e => setRememberMe(e.target.checked)}
                                        />
                                        <span className="checkmark" />
                                        Remember me
                                    </label>
                                    <Link href="/users/password-reset" style={{ fontSize: "0.875rem", color: "var(--primary)" }}>Forgot password?</Link>
                                </div>

                                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                    {loading ? "Signing in…" : "Sign In"}
                                </button>
                            </form>

                            <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                Don&apos;t have an account?{" "}
                                <Link href="/users/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Sign up</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
