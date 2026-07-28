"use client";
import Link from "next/link";
import { useState } from "react";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { format } from "date-fns";

export default function SystemAdminClient({ settings, recentLogs, totalLogs }: any) {
    const [testEmailAddr, setTestEmailAddr] = useState("");
    const [sending, setSending] = useState(false);
    const [regeneratingQR, setRegeneratingQR] = useState(false);

    async function sendTestEmail() {
        if (!testEmailAddr) { showToast("Enter an email address.", "warning"); return; }
        setSending(true);
        const res = await fetch("/api/dashboard/test-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: testEmailAddr }) });
        if (res.ok) showToast("Test email sent!", "success");
        else showToast("Failed to send email.", "error");
        setSending(false);
    }

    async function regenerateQRCodes() {
        const ok = await showConfirm("Regenerate and upload QR codes for all books that are missing them? This may take a while.", "warning");
        if (!ok) return;
        setRegeneratingQR(true);
        try {
            const res = await fetch("/api/books/regenerate-qr", { method: "POST" });
            const d = await res.json();
            if (res.ok) showToast(d.message, "success");
            else showToast(d.error || "Failed to regenerate QR codes.", "error");
        } catch {
            showToast("Network error.", "error");
        }
        setRegeneratingQR(false);
    }

    async function createBackup() {
        const ok = await showConfirm("Download a full database backup in JSON format?", "warning");
        if (!ok) return;
        window.location.href = "/api/dashboard/backup/create";
    }

    async function updateOverdue() {
        const ok = await showConfirm("Recalculate all overdue books?", "warning");
        if (!ok) return;
        const res = await fetch("/api/dashboard/update-overdue", { method: "POST" });
        const d = await res.json();
        if (res.ok) showToast(`Updated ${d.count} overdue record(s).`, "success");
        else showToast("Failed.", "error");
    }

    const actionColors: Record<string, string> = {
        book_added: "#10b981", book_updated: "#10b981", book_deleted: "#ef4444",
        book_borrowed: "#0ea5e9", book_issued: "#0ea5e9", book_returned: "#8b5cf6",
        user_login: "#10b981", user_registered: "#10b981", user_logout: "#6b7280"
    };
    const actionBgs: Record<string, string> = {
        book_added: "rgba(16,185,129,0.1)", book_updated: "rgba(16,185,129,0.1)", book_deleted: "rgba(239,68,68,0.1)",
        book_borrowed: "rgba(14,165,233,0.1)", book_issued: "rgba(14,165,233,0.1)", book_returned: "rgba(139,92,246,0.1)",
        user_login: "rgba(16,185,129,0.1)", user_registered: "rgba(16,185,129,0.1)", user_logout: "rgba(107,114,128,0.1)"
    };

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 1000 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <nav className="breadcrumb">
                    <Link href="/dashboard">Dashboard</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <span>System Administration</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1" /></svg>
                    <h1 className="page-title-gradient">System Administration</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>System maintenance, backups, and administrative tools</p>
            </div>

            {/* General Quick Links */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 32 }}>
                {[
                    { label: "System Settings", href: "/dashboard/settings" },
                    { label: "Activity Log", href: "/dashboard/activity-log" },
                    { label: "Analytics", href: "/dashboard/analytics" },
                    { label: "Reports", href: "/dashboard/reports" },
                ].map(({ label, href }) => (
                    <Link key={label} href={href} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "16px 20px", border: "1px solid var(--border)", textAlign: "center", textDecoration: "none", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", display: "block", transition: "all 0.2s", boxShadow: "var(--shadow-sm)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(16,185,129,0.12)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}>
                        {label}
                    </Link>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>

                {/* System Information - NEW */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "var(--primary)" }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                        <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0 }}>System Information</h2>
                    </div>
                    <div style={{ padding: 24 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                            <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", textAlign: "center" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>Currency</div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>ETB</div>
                            </div>
                            <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", textAlign: "center" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>Fine Rate</div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>ETB {settings?.finePerDay}/day</div>
                            </div>
                            <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", textAlign: "center" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>Borrow Duration</div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{settings?.maxBorrowDays} days</div>
                            </div>
                            <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", textAlign: "center" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>Max Borrow Limit</div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{settings?.defaultBorrowLimit} books</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity - NEW */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "var(--primary)" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0 }}>Recent Activity</h2>
                        </div>
                        <Link href="/dashboard/activity-log" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: 6 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            View All ({totalLogs})
                        </Link>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "var(--background)", borderBottom: "2px solid var(--border)" }}>
                                    <th style={{ padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", textAlign: "left" }}>Time</th>
                                    <th style={{ padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", textAlign: "left" }}>User</th>
                                    <th style={{ padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", textAlign: "left" }}>Action</th>
                                    <th style={{ padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", textAlign: "left" }}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs?.length > 0 ? recentLogs.map((log: any) => {
                                    const actionLabel = log.action.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                                    const color = actionColors[log.action] || "#6b7280";
                                    const bg = actionBgs[log.action] || "rgba(107,114,128,0.1)";
                                    return (
                                        <tr key={log.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--background)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                            <td style={{ padding: "14px 24px" }}><span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", whiteSpace: "nowrap", fontFamily: "monospace" }}>{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm")}</span></td>
                                            <td style={{ padding: "14px 24px" }}>
                                                {log.user ? <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{log.user.username}</span> : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>System</span>}
                                            </td>
                                            <td style={{ padding: "14px 24px" }}>
                                                <span style={{ display: "inline-flex", padding: "4px 12px", fontSize: "0.8125rem", fontWeight: 700, borderRadius: 9999, background: bg, color: color, whiteSpace: "nowrap" }}>{actionLabel}</span>
                                            </td>
                                            <td style={{ padding: "14px 24px", color: "var(--text-secondary)", fontSize: "0.9375rem" }}>{log.description}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>No recent activity recorded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bulk Operations Hub */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        Bulk Operations
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        <Link href="/books/bulk-import" style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20, textDecoration: "none", transition: "all 0.2s" }} className="category-card-hover" onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                </div>
                                <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Import Books</h3>
                            </div>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, paddingLeft: 52 }}>Import multiple books simultaneously using CSV, Excel, or ZIP files.</p>
                        </Link>

                        <Link href="/users/bulk-import" style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20, textDecoration: "none", transition: "all 0.2s" }} className="category-card-hover" onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0ea5e9"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </div>
                                <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Import Users</h3>
                            </div>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, paddingLeft: 52 }}>Register a large batch of students or staff members instantly.</p>
                        </Link>

                        <Link href="/dashboard/notification-center" style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20, textDecoration: "none", transition: "all 0.2s" }} className="category-card-hover" onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#8b5cf6"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(139,92,246,0.1)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                </div>
                                <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Bulk Email Users</h3>
                            </div>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, paddingLeft: 52 }}>Compose and send templated emails to users by role or specific selection.</p>
                        </Link>
                    </div>
                </div>

                {/* Database Management */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ width: 22, height: 22 }}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                        Database Management
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                        <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Database Backup</h4>
                                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16 }}>Download a comprehensive JSON dump containing all users, books, records, and settings.</p>
                            </div>
                            <button className="btn btn-primary" onClick={createBackup} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", border: "none", boxShadow: "0 4px 12px rgba(14,165,233,0.3)", width: "fit-content" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: "middle", display: "inline-block" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Download Backup
                            </button>
                        </div>

                        <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Recalculate Status</h4>
                                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16 }}>Force a manual sweep of all borrowed books to update overdue statuses and fines immediately.</p>
                            </div>
                            <button className="btn btn-secondary" onClick={updateOverdue} style={{ padding: "10px 20px", width: "fit-content" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: "middle", display: "inline-block" }}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.44l5.67-5.67" /></svg>
                                Run Recalculation
                            </button>
                        </div>

                        <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Regenerate QR Codes</h4>
                                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16 }}>Upload missing or broken QR codes to Cloudinary for all books. Safe to run multiple times.</p>
                            </div>
                            <button className="btn btn-secondary" onClick={regenerateQRCodes} disabled={regeneratingQR} style={{ padding: "10px 20px", width: "fit-content" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: "middle", display: "inline-block" }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                                {regeneratingQR ? "Regenerating…" : "Regenerate QR Codes"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Email Server Diagnostics */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        Email Server Diagnostics
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                        Test your SMTP/Resend connection by sending a diagnostic email.
                    </p>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <input type="email" placeholder="Enter recipient email..." value={testEmailAddr} onChange={e => setTestEmailAddr(e.target.value)} style={{ flex: "1 1 240px", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--background)", color: "var(--text-primary)", fontSize: "0.9375rem", outline: "none" }} />
                        <button className="btn btn-primary" onClick={sendTestEmail} disabled={sending} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "none", boxShadow: "0 4px 12px rgba(139,92,246,0.3)" }}>
                            {sending ? "Sending…" : "Send Test Email"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
