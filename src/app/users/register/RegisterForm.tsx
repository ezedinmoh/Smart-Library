"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { showToast, ToastContainer } from "@/components/ui/ToastNotifications";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function RegisterForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        username: "", email: "",
        password: "", confirmPassword: "",
        firstName: "", lastName: "",
        phone: "", address: "",
        role: "student", // always student — admin/librarian created via dashboard
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const [showPw, setShowPw] = useState(false);
    const [showCPw, setShowCPw] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [pwStrength, setPwStrength] = useState(0);

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

    function set(field: string, value: string) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
        if (field === "password") calcStrength(value);
    }

    function calcStrength(pw: string) {
        let s = 0;
        if (pw.length >= 8) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9]/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        setPwStrength(s);
    }

    const strengthColors = ["#e2e8f0", "#ef4444", "#f59e0b", "#22c55e", "#10b981"];
    const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

    async function checkUsername(v: string) {
        if (!v || v.length < 3) return;
        setUsernameStatus("checking");
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(v)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
        if (!data.available) setErrors(e => ({ ...e, username: "This username is already taken." }));
    }

    async function checkEmail(v: string) {
        if (!v || !v.includes("@")) return;
        setEmailStatus("checking");
        const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(v)}`);
        const data = await res.json();
        setEmailStatus(data.available ? "available" : "taken");
        if (!data.available) setErrors(e => ({ ...e, email: "This email is already registered." }));
    }

    function validateStep1() {
        const e: Record<string, string> = {};
        if (!form.username || form.username.length < 3) e.username = "Username must be at least 3 characters.";
        if (!form.email || !form.email.includes("@")) e.email = "Enter a valid email address.";
        if (usernameStatus === "taken") e.username = "This username is already taken.";
        if (emailStatus === "taken") e.email = "This email is already registered.";
        return e;
    }

    function validateStep2() {
        const e: Record<string, string> = {};
        if (!form.password || form.password.length < 8) e.password = "Password must be at least 8 characters.";
        if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
        return e;
    }

    function handleNext(e: React.FormEvent) {
        e.preventDefault();
        const errs = validateStep1();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setStep(2);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs = validateStep2();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        try {
            const res = await fetch("/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.errors) setErrors(data.errors);
                else showToast(data.error || "Registration failed.", "error");
            } else {
                router.push(`/users/verification-sent?email=${encodeURIComponent(form.email)}`);
            }
        } catch {
            showToast("Network error. Please try again.", "error");
        } finally { setLoading(false); }
    }

    const ThemeToggle = () => (
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
    );

    return (
        <div className="auth-page">
            <ToastContainer /><ConfirmModal />

            {/* Back to Home + theme toggle */}
            <div className="back-to-home">
                <Link href="/">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Back to Home
                </Link>
                <ThemeToggle />
            </div>

            <div className="auth-container">
                {/* Left panel */}
                <div className="auth-left">
                    <div className="auth-left-content">
                        <Link href="/" className="logo">
                            <div className="logo-icon white"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg></div>
                            <span>SmartLibrary</span>
                        </Link>
                        <div className="auth-left-text">
                            <h1>Join Our Reading Community</h1>
                            <p>Create your account and start your journey through thousands of amazing books.</p>
                            <div className="auth-features">
                                {[
                                    { icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>, title: "Instant Access", desc: "Start borrowing immediately" },
                                    { icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, title: "Free Forever", desc: "No hidden fees or charges" },
                                    { icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, title: "Secure & Private", desc: "Your data is protected" }
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
                    <div className="auth-decorations"><div className="decoration-circle circle-1" /><div className="decoration-circle circle-2" /><div className="decoration-circle circle-3" /></div>
                </div>

                {/* Right panel */}
                <div className="auth-right">
                    <div className="auth-form-container">
                        <div className="auth-form">
                            <div className="auth-form-header">
                                <h2>Create Account</h2>
                                <p>{step === 1 ? "Join our community of readers" : "Set your password & optional details"}</p>
                            </div>

                            {/* Step indicator dots */}
                            <div className="step-indicator">
                                <div className={`step-dot${step === 1 ? " active" : ""}`} />
                                <div className={`step-dot${step === 2 ? " active" : ""}`} />
                            </div>

                            {/* ─── STEP 1: Account details ─── */}
                            <div className={`form-step${step === 1 ? " active" : ""}`}>
                                {/* Social sign-up */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                    <button className="btn-social" type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
                                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                        Google
                                    </button>
                                    <button className="btn-social" type="button" onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                                        GitHub
                                    </button>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                                    <span style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>or continue with email</span>
                                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                                </div>

                                <form onSubmit={handleNext}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>First Name</label>
                                            <div className="input-wrapper">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                <input type="text" placeholder="First name" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name</label>
                                            <div className="input-wrapper">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                <input type="text" placeholder="Last name" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Username *</label>
                                        <div className="input-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                            <input type="text" placeholder="Choose a unique username" value={form.username} onChange={e => set("username", e.target.value)} onBlur={e => checkUsername(e.target.value)} className={errors.username ? "invalid" : usernameStatus === "available" ? "valid" : ""} required />
                                        </div>
                                        {errors.username && <span className="error-message">{errors.username}</span>}
                                        {!errors.username && usernameStatus === "available" && <span style={{ fontSize: "0.813rem", color: "var(--success)" }}>✓ Username available</span>}
                                        {usernameStatus === "checking" && <span style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>Checking availability…</span>}
                                    </div>

                                    <div className="form-group">
                                        <label>Email Address *</label>
                                        <div className="input-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                            <input type="email" placeholder="Enter your email address" value={form.email} onChange={e => set("email", e.target.value)} onBlur={e => checkEmail(e.target.value)} className={errors.email ? "invalid" : emailStatus === "available" ? "valid" : ""} required />
                                        </div>
                                        {errors.email && <span className="error-message">{errors.email}</span>}
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
                                        Continue
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </button>
                                </form>

                                <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                    Already have an account?{" "}<Link href="/users/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Sign in</Link>
                                </p>
                            </div>

                            {/* ─── STEP 2: Password + optional details ─── */}
                            <div className={`form-step${step === 2 ? " active" : ""}`}>
                                <form onSubmit={handleSubmit}>
                                    {/* Password fields moved here */}
                                    <div className="form-group">
                                        <label>Password *</label>
                                        <div className="input-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                            <input type={showPw ? "text" : "password"} placeholder="At least 8 characters" value={form.password} onChange={e => set("password", e.target.value)} className={errors.password ? "invalid" : ""} required />
                                            <button type="button" className={`toggle-password${showPw ? " active" : ""}`} onClick={() => setShowPw(!showPw)}>
                                                <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                            </button>
                                        </div>
                                        {form.password.length > 0 && (
                                            <div className="password-strength">
                                                <div className="strength-bars">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="strength-bar" style={{ background: i <= pwStrength ? strengthColors[pwStrength] : undefined }} />
                                                    ))}
                                                </div>
                                                <span className="strength-label" style={{ color: strengthColors[pwStrength] }}>{strengthLabels[pwStrength]}</span>
                                            </div>
                                        )}
                                        {errors.password && <span className="error-message">{errors.password}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label>Confirm Password *</label>
                                        <div className="input-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                            <input type={showCPw ? "text" : "password"} placeholder="Repeat your password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} className={errors.confirmPassword ? "invalid" : form.confirmPassword && form.password === form.confirmPassword ? "valid" : ""} required />
                                            <button type="button" className={`toggle-password${showCPw ? " active" : ""}`} onClick={() => setShowCPw(!showCPw)}>
                                                <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                            </button>
                                        </div>
                                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                                    </div>

                                    {/* Optional fields */}
                                    <div className="form-group">
                                        <label>Phone Number <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                                        <div className="input-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2z" /></svg>
                                            <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Address <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                                        <div className="input-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            <input type="text" placeholder="Your address" value={form.address} onChange={e => set("address", e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="step-buttons" style={{ marginTop: 20 }}>
                                        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                            Back
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            {loading ? "Creating…" : "Create Account"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
