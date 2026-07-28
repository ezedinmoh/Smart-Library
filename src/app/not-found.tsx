"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Metadata } from "next";

export default function NotFound() {
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
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", padding: "20px", fontFamily: "Inter,sans-serif", transition: "background 0.3s ease" }}>
            {/* Theme toggle */}
            <button onClick={toggleTheme} style={{ position: "fixed", top: 24, right: 24, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, cursor: "pointer", transition: "all 0.3s ease" }} aria-label="Toggle theme">
                <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "var(--text-secondary)" }}>
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "var(--text-secondary)" }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </button>

            <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
                {/* Logo */}
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 40, textDecoration: "none", color: "var(--text-primary)" }}>
                    <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#10b981,#059669)", borderRadius: 12 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    </div>
                    <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>SmartLibrary</span>
                </Link>

                {/* Error code */}
                <div style={{ fontSize: "8rem", fontWeight: 800, background: "linear-gradient(135deg,#10b981,#0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1, marginBottom: 24 }}>404</div>

                {/* Illustration */}
                <div style={{ marginBottom: 32 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 200, height: 200, color: "var(--text-muted)", opacity: 0.5 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="15" x2="16" y2="15" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                </div>

                <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>Page Not Found</h1>
                <p style={{ fontSize: "1.125rem", color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
                    Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or never existed.
                </p>

                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", borderRadius: 12, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 14px rgba(16,185,129,0.4)", fontSize: "1rem" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        Go Home
                    </Link>
                    <button onClick={() => window.history.back()} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: "1rem" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
