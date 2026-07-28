"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
    pending: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", dot: "var(--warning)" },
    ready: { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9", dot: "var(--primary-blue)" },
    fulfilled: { bg: "rgba(16,185,129,0.1)", color: "#10b981", dot: "var(--success)" },
    cancelled: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", dot: "#6b7280" },
    rejected: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", dot: "var(--error)" }
};

export default function ReservationsClient({ requests, stats, initialSearch, initialStatus }: any) {
    const router = useRouter();
    const [q, setQ] = useState(initialSearch || "");
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    function handleFilter(statusFilter?: string) {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (statusFilter) params.set("status", statusFilter);
        else if (initialStatus) params.set("status", initialStatus);
        router.push(`/dashboard/reservations?${params.toString()}`);
    }

    function clearFilter() {
        setQ("");
        router.push(`/dashboard/reservations`);
    }

    async function approve(id: number) {
        const ok = await showConfirm("Approve and issue this book?", "success");
        if (!ok) return;
        const res = await fetch(`/api/borrow/requests/${id}/approve`, { method: "POST" });
        const d = await res.json();
        if (res.ok) { showToast("Book issued successfully!", "success"); router.refresh(); }
        else showToast(d.error || "Failed.", "error");
    }

    async function reject(id: number) {
        if (!rejectReason.trim()) { showToast("Enter a reason.", "warning"); return; }
        const res = await fetch(`/api/borrow/requests/${id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: rejectReason }) });
        if (res.ok) { showToast("Rejected.", "success"); setRejectId(null); setRejectReason(""); router.refresh(); }
        else showToast("Failed.", "error");
    }

    const statCards = [
        { key: "all", label: "All Requests", val: stats.all, color: "var(--text-primary)" },
        { key: "pending", label: "Pending", val: stats.pending, color: "#f59e0b" },
        { key: "ready", label: "Ready", val: stats.ready, color: "#0ea5e9" },
        { key: "fulfilled", label: "Fulfilled", val: stats.fulfilled, color: "#10b981" },
        { key: "cancelled", label: "Cancelled", val: stats.cancelled, color: "#6b7280" },
        { key: "rejected", label: "Rejected", val: stats.rejected, color: "#ef4444" }
    ];

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 1400 }}>
            <div style={{ marginBottom: 32 }}>
                <nav className="breadcrumb">
                    <Link href="/dashboard">Dashboard</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <span>Reservation Management</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                    <h1 className="page-title-gradient">Manage Reservations</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Review, approve, or reject book requests</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                {statCards.map((card) => {
                    const isActive = (!initialStatus && card.key === "all") || initialStatus === card.key;
                    return (
                        <button key={card.key} onClick={() => handleFilter(card.key === "all" ? "" : card.key)} 
                            style={{ background: "var(--surface)", border: `2px solid ${isActive ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: 20, textAlign: "center", boxShadow: isActive ? "0 0 0 3px rgba(16,185,129,0.15)" : "var(--shadow-sm)", transition: "all 0.2s", cursor: "pointer", display: "block", width: "100%" }} 
                            onMouseEnter={e => { if(!isActive) e.currentTarget.style.transform = "translateY(-2px)"; }} 
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: card.color, margin: "0 auto 8px" }} />
                            <div style={{ fontSize: "2rem", fontWeight: 800, color: card.color, lineHeight: 1, marginBottom: 6 }}>{card.val}</div>
                            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</div>
                        </button>
                    )
                })}
            </div>

            {/* Filter Bar */}
            <form onSubmit={e => { e.preventDefault(); handleFilter(); }} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow-sm)", display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "1", minWidth: 240 }}>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Search Reservations</label>
                    <div style={{ position: "relative" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "var(--text-muted)" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search by book title, username..." value={q} onChange={e => setQ(e.target.value)} style={{ width: "100%", padding: "12px 16px 12px 44px", fontFamily: "'Inter', sans-serif", fontSize: "0.9375rem", color: "var(--text-primary)", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", outline: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                    </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 8, display: "inline-block", verticalAlign: "middle" }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg> Filter</button>
                    {(q || initialStatus) && <button type="button" onClick={clearFilter} className="btn btn-outline" style={{ padding: "12px 24px" }}>Clear</button>}
                </div>
            </form>

            {/* List */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "var(--primary)" }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                        <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{initialStatus ? initialStatus.charAt(0).toUpperCase() + initialStatus.slice(1) : "All"} Requests</h2>
                    </div>
                    <div style={{ background: "rgba(16,185,129,0.1)", color: "var(--primary)", padding: "4px 12px", borderRadius: 9999, fontSize: "0.8125rem", fontWeight: 700 }}>
                        {requests.length} results
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                                <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>User</th>
                                <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Book</th>
                                <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Status</th>
                                <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Date</th>
                                <th style={{ textAlign: "right", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => {
                                const style = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                                return (
                                    <tr key={req.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--background)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ padding: "16px 24px" }}>
                                            <div style={{ fontWeight: 600, color: "var(--primary)", marginBottom: 2 }}>{req.user.username}</div>
                                            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{req.user.email}</div>
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{req.book.title}</div>
                                            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                                {req.book.author}
                                                <span style={{ color: req.book.availableCopies > 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>• {req.book.availableCopies} available</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, background: style.bg, color: style.color, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: style.color }} />
                                                {req.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 24px", fontSize: "0.8125rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                                            {formatDate(req.requestDate)}
                                        </td>
                                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                            {req.status === "pending" && (
                                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                    <button onClick={() => approve(req.id)} disabled={req.book.availableCopies === 0} style={{ padding: "6px 12px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1.5px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", fontWeight: 600, cursor: req.book.availableCopies > 0 ? "pointer" : "not-allowed", opacity: req.book.availableCopies > 0 ? 1 : 0.5 }}>Approve</button>
                                                    <button onClick={() => setRejectId(req.id)} style={{ padding: "6px 12px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>Reject</button>
                                                </div>
                                            )}
                                            {rejectId === req.id && (
                                                <div style={{ position: "absolute", right: 24, background: "var(--surface)", border: "1px solid var(--error)", padding: 16, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", zIndex: 10, width: 280, textAlign: "left", transform: "translateY(-100%)" }}>
                                                    <p style={{ margin: "0 0 8px 0", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>Rejection Reason</p>
                                                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} style={{ width: "100%", padding: 8, fontSize: "0.875rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", outline: "none", marginBottom: 12, resize: "none" }} />
                                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { setRejectId(null); setRejectReason(""); }} style={{ padding: "4px 10px" }}>Cancel</button>
                                                        <button className="btn btn-sm" style={{ background: "var(--error)", color: "white", border: "none", padding: "4px 10px" }} onClick={() => reject(req.id)}>Confirm</button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "64px 24px" }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48, color: "var(--text-muted)", opacity: 0.5, margin: "0 auto 16px" }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                                        <h4 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>No reservations found</h4>
                                        <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>No requests match the current filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
