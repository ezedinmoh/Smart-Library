"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const saved = (localStorage.getItem("theme") as "light" | "dark") || "light";
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
    }, []);

    function toggleTheme() {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        localStorage.setItem("theme", next);
        document.documentElement.setAttribute("data-theme", next);
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background,#fff)", padding: "20px", fontFamily: "Inter,sans-serif", transition: "background 0.3s ease" }}>
            {/* Theme toggle */}
            <button onClick={toggleTheme} style={{ position: "fixed", top: 24, right: 24, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface,#f8fafc)", border: "1px solid var(--border,#e2e8f0)", borderRadius: 12, cursor: "pointer" }} aria-label="Toggle theme">
                <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "#64748b" }}>
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                </svg>
                <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "#64748b" }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </button>

            <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
                {/* Logo */}
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 40, textDecoration: "none", color: "var(--text-primary,#0f172a)" }}>
                    <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#10b981,#059669)", borderRadius: 12 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    </div>
                    <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>SmartLibrary</span>
                </Link>

                {/* Error code */}
                <div style={{ fontSize: "8rem", fontWeight: 800, color: "#ef4444", lineHeight: 1, marginBottom: 24 }}>500</div>

                {/* Illustration */}
                <div style={{ marginBottom: 32 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 160, height: 160, opacity: 0.4 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16, color: "var(--text-primary,#0f172a)" }}>Something Went Wrong</h1>
                <p style={{ fontSize: "1.125rem", color: "#64748b", marginBottom: 32, lineHeight: 1.6 }}>
                    {error?.message || "An unexpected error occurred. Our team has been notified."}
                </p>

                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", borderRadius: 12, fontWeight: 600, border: "none", cursor: "pointer", fontSize: "1rem", boxShadow: "0 4px 14px rgba(16,185,129,0.4)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>
                        Try Again
                    </button>
                    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "var(--surface,#f8fafc)", color: "var(--text-primary,#0f172a)", border: "1px solid var(--border,#e2e8f0)", borderRadius: 12, fontWeight: 600, textDecoration: "none", fontSize: "1rem" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
