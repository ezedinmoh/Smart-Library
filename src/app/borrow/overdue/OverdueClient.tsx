"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, getDaysOverdue } from "@/lib/utils";

export default function OverdueClient({ records, totalFines, unpaidFines, paidFines, unpaidCount, etbToUsd }: any) {
    const router = useRouter();

    async function returnRecord(id: number, bookTitle: string) {
        const ok = await showConfirm(`Return "${bookTitle}"?`, "warning");
        if (!ok) return;
        const res = await fetch(`/api/borrow/records/${id}/return`, { method: "POST" });
        const d = await res.json();
        if (res.ok) { showToast(`Returned. ${d.fineAmount > 0 ? `Fine: ETB ${d.fineAmount.toFixed(2)}` : ""}`, "success"); router.refresh(); }
        else showToast(d.error || "Failed.", "error");
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            <div style={{ marginBottom: 32 }}>
                <nav className="breadcrumb">
                    <a href="/dashboard">Dashboard</a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <span>Overdue &amp; Fines</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 28, height: 28 }}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    <h1 className="page-title-gradient" style={{ background: "linear-gradient(135deg,#ef4444,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Overdue &amp; Fines Management</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Manage overdue books and fine collection</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20, marginBottom: 32 }}>
                {[
                    { label: "Total Fines", etb: totalFines, color: "#ef4444", bg: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))" },
                    { label: "Unpaid Fines", etb: unpaidFines, color: "#f59e0b", bg: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))" },
                    { label: "Collected Fines", etb: paidFines, color: "#10b981", bg: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))" },
                ].map(({ label, etb, color, bg }) => (
                    <div key={label} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: bg, pointerEvents: "none" }} />
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ fontSize: "1.75rem", fontWeight: 800, color, marginBottom: 4, letterSpacing: "-0.02em" }}>ETB {etb.toFixed(2)}</div>
                            <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", fontWeight: 500 }}>≈ ${(etb * etbToUsd).toFixed(2)} USD</div>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                        </div>
                    </div>
                ))}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))", pointerEvents: "none" }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ef4444", marginBottom: 4, letterSpacing: "-0.02em" }}>{unpaidCount}</div>
                        <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", fontWeight: 500, visibility: "hidden" }}>Spacer</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Unpaid Records</div>
                    </div>
                </div>
            </div>

            {/* Export actions */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                <a href="/api/dashboard/export/overdue/csv" className="btn btn-secondary btn-sm" style={{ padding: "8px 16px" }}>Export CSV</a>
                <a href="/api/dashboard/export/overdue/pdf" className="btn btn-secondary btn-sm" style={{ padding: "8px 16px" }}>Export PDF</a>
                <Link href="/dashboard/reminders/overdue" className="btn btn-primary btn-sm" style={{ padding: "8px 16px", background: "linear-gradient(135deg, #ef4444, #f59e0b)", border: "none", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Send Overdue Reminders
                </Link>
            </div>

            {/* Records Table */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                                {["User", "Book", "Due Date", "Days Overdue", "Fine (ETB)", "Status", "Actions"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)", fontSize: "1.1rem" }}>No overdue records</td></tr>
                            ) : records.map((r: any) => {
                                const daysOver = r.status === "overdue" ? getDaysOverdue(r.dueDate) : 0;
                                return (
                                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)", background: r.status === "overdue" && !r.finePaid ? "rgba(239,68,68,0.03)" : "transparent", transition: "background 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = r.status === "overdue" && !r.finePaid ? "rgba(239,68,68,0.06)" : "var(--surface-hover)"; }} onMouseLeave={e => { e.currentTarget.style.background = r.status === "overdue" && !r.finePaid ? "rgba(239,68,68,0.03)" : "transparent"; }}>
                                        <td style={{ padding: "16px 20px" }}>
                                            <Link href={`/users/${r.userId}/detail`} style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", fontSize: "0.9375rem", marginBottom: 2 }}>{r.user.username}</Link>
                                            <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>{r.user.email}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <Link href={`/books/${r.bookId}`} style={{ fontWeight: 600, color: "var(--primary)", display: "block", fontSize: "0.9375rem", marginBottom: 2 }}>{r.book.title}</Link>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatDate(r.dueDate)}</td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem" }}>
                                            {daysOver > 0 ? <span style={{ color: "var(--error)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {daysOver} days</span> : r.returnDate ? formatDate(r.returnDate) : "—"}
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem" }}>
                                            {parseFloat(r.fineAmount) > 0 ? (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: r.finePaid ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: r.finePaid ? "#22c55e" : "var(--error)", fontWeight: 700, border: `1px solid ${r.finePaid ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                                                    {parseFloat(r.fineAmount).toFixed(2)} {r.finePaid ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                                                </span>
                                            ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{
                                                padding: "4px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                                                background: r.finePaid ? "rgba(34,197,94,0.1)" : r.status === "overdue" ? "rgba(239,68,68,0.1)" : "rgba(14,165,233,0.1)",
                                                color: r.finePaid ? "#22c55e" : r.status === "overdue" ? "var(--error)" : "#0ea5e9",
                                                border: `1px solid ${r.finePaid ? "rgba(34,197,94,0.3)" : r.status === "overdue" ? "rgba(239,68,68,0.3)" : "rgba(14,165,233,0.3)"}`
                                            }}>
                                                {r.finePaid ? "Paid" : r.status === "overdue" ? "Overdue" : "Returned"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            {r.status === "overdue" && (
                                                <button className="btn btn-sm" style={{ padding: "6px 12px", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.3)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }} onClick={() => returnRecord(r.id, r.book.title)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
                                                    Return
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
