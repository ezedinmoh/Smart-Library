"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function PendingRequestsClient({ requests }: { requests: any[] }) {
    const router = useRouter();
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    async function approve(requestId: number) {
        const ok = await showConfirm("Approve this request and issue the book?", "success");
        if (!ok) return;
        const res = await fetch(`/api/borrow/requests/${requestId}/approve`, { method: "POST" });
        const data = await res.json();
        if (res.ok) { showToast("Book approved and issued!", "success"); router.refresh(); }
        else showToast(data.error || "Failed to approve.", "error");
    }

    async function reject(requestId: number) {
        if (!rejectReason.trim()) { showToast("Please enter a rejection reason.", "warning"); return; }
        const res = await fetch(`/api/borrow/requests/${requestId}/reject`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: rejectReason }),
        });
        if (res.ok) { showToast("Request rejected.", "success"); setRejectId(null); setRejectReason(""); router.refresh(); }
        else showToast("Failed to reject.", "error");
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <nav className="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        <span>Pending Requests</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <h1 className="page-title-gradient">Pending Requests</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Review and manage student book requests</p>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1.5px solid rgba(245,158,11,0.3)", borderRadius: 9999, fontWeight: 700, fontSize: "1rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                    {requests.length} pending
                </div>
            </div>

            {requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64, opacity: 0.2, margin: "0 auto 16px", display: "block" }}><polyline points="20 6 9 17 4 12" /></svg>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>No pending requests</h3>
                    <p style={{ color: "var(--text-muted)" }}>All student requests have been processed.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(400px,1fr))", gap: 24 }}>
                    {requests.map((req: any) => (
                        <div key={req.id} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: 24, boxShadow: "var(--shadow-sm)", transition: "all 0.2s", display: "flex", flexDirection: "column" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px -8px rgba(0,0,0,0.1)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}>
                            {rejectId === req.id ? (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    <p style={{ marginBottom: 12, fontWeight: 600, color: "var(--text-primary)" }}>Rejection reason for "{req.book.title}":</p>
                                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this request is rejected..." rows={4} style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", fontSize: "0.875rem", resize: "none", flex: 1, marginBottom: 16 }} autoFocus />
                                    <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                                        <button className="btn btn-sm" style={{ flex: 1, background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)" }} onClick={() => reject(req.id)}>Confirm Reject</button>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setRejectId(null); setRejectReason(""); }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                                        <div style={{ width: 64, height: 90, borderRadius: 8, overflow: "hidden", background: "var(--border)", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                                            {req.book.coverImage ? <img src={req.book.coverImage} alt={req.book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg></div>}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.3 }}>{req.book.title}</h3>
                                            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 8 }}>by {req.book.author}</p>
                                            <span style={{ padding: "4px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: req.book.availableCopies > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: req.book.availableCopies > 0 ? "var(--primary)" : "var(--error)", border: `1px solid ${req.book.availableCopies > 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                                                {req.book.availableCopies > 0 ? `${req.book.availableCopies} in stock` : "Out of stock"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: "var(--background)", borderRadius: 8, padding: 16, marginBottom: 20, border: "1px solid var(--border-light)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: "1px dashed var(--border)" }}>
                                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem" }}>
                                                {req.user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)" }}>{req.user.username}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{req.user.email}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: "0.813rem" }}>
                                            <div>
                                                <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>Borrow Quota</div>
                                                <strong style={{ color: "var(--text-primary)" }}>{req.user.profile?.currentlyBorrowed ?? 0} / {req.user.profile?.maxBooksAllowed ?? 7}</strong>
                                            </div>
                                            <div>
                                                <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>Requested On</div>
                                                <strong style={{ color: "var(--text-primary)" }}>{formatDateTime(req.requestDate).split(',')[0]}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
                                        <button className="btn btn-primary" style={{ flex: 1, padding: "10px 16px", display: "flex", justifyContent: "center" }} onClick={() => approve(req.id)} disabled={req.book.availableCopies === 0}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}><path d="M20 6L9 17l-5-5"/></svg>
                                            Approve
                                        </button>
                                        <button className="btn" style={{ padding: "10px 16px", background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", justifyContent: "center" }} onClick={() => setRejectId(req.id)} title="Reject Request">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
