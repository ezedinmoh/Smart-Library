"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    borrowed: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
    returned: { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
    overdue: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
};

export default function AllRecordsClient({ records, total, page, pageSize, searchParams }: any) {
    const router = useRouter();
    const pathname = usePathname();
    const [, start] = useTransition();
    const totalPages = Math.ceil(total / pageSize);

    function update(p: Record<string, string>) {
        const sp = new URLSearchParams(searchParams);
        Object.entries(p).forEach(([k, v]) => v ? sp.set(k, v) : sp.delete(k));
        sp.delete("page");
        start(() => router.push(`${pathname}?${sp.toString()}`));
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            {/* Page header with breadcrumb — matches Django all_borrow_records.html */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <nav className="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        <span>All Borrow Records</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                        <h1 className="page-title-gradient">All Borrow Records</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Complete history of all book borrows — {total} record{total !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <a href="/api/borrow/export/csv" className="btn btn-secondary btn-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        CSV
                    </a>
                    <a href="/api/borrow/export/excel" className="btn btn-secondary btn-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        Excel
                    </a>
                </div>
            </div>

            {/* Filters */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                    <div className="search-box" style={{ borderRadius: "var(--radius)", background: "var(--background)", border: "1px solid var(--border)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input type="text" placeholder="Search by user or book..." defaultValue={searchParams.search ?? ""} onChange={e => update({ search: e.target.value })} style={{ width: "100%" }} />
                    </div>
                </div>
                <div style={{ position: "relative", minWidth: 160 }}>
                    <select value={searchParams.status ?? ""} onChange={e => update({ status: e.target.value })} style={{ width: "100%", padding: "10px 36px 10px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", appearance: "none", cursor: "pointer", fontWeight: 500 }}>
                        <option value="">All Statuses</option>
                        <option value="borrowed">Borrowed</option>
                        <option value="returned">Returned</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, pointerEvents: "none", color: "var(--text-muted)" }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {(searchParams.search || searchParams.status) && (
                    <button className="btn btn-secondary" style={{ padding: "10px 16px" }} onClick={() => router.push(pathname)}>Clear Filters</button>
                )}
            </div>

            {/* Table */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                                {["User", "Book", "Borrow Date", "Due Date", "Return Date", "Status", "Fine (ETB)", "Actions"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)", fontSize: "1.1rem" }}>No borrow records found</td></tr>
                            ) : records.map((r: any) => {
                                const s = STATUS_STYLES[r.status] ?? STATUS_STYLES.borrowed;
                                return (
                                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                        <td style={{ padding: "16px 20px" }}>
                                            <Link href={`/users/${r.userId}/detail`} style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", fontSize: "0.9375rem", marginBottom: 2 }}>{r.user.username}</Link>
                                            <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>{r.user.email}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <Link href={`/books/${r.bookId}`} style={{ fontWeight: 600, color: "var(--primary)", display: "block", fontSize: "0.9375rem", marginBottom: 2 }}>{r.book.title}</Link>
                                            <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>{r.book.author}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatDate(r.borrowDate)}</td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatDate(r.dueDate)}</td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{r.returnDate ? formatDate(r.returnDate) : "—"}</td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{ padding: "4px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: s.bg, color: s.color, border: `1px solid ${s.color}33` }}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem" }}>
                                            {parseFloat(r.fineAmount) > 0 ? (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: r.finePaid ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: r.finePaid ? "#22c55e" : "var(--error)", fontWeight: 700, border: `1px solid ${r.finePaid ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                                                    {parseFloat(r.fineAmount).toFixed(2)} {r.finePaid ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                                                </span>
                                            ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            {r.status !== "returned" && (
                                                <ReturnBtn recordId={r.id} bookTitle={r.book.title} onDone={() => router.refresh()} />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32, flexWrap: "wrap" }}>
                    {page > 1 && <Link href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`} className="btn btn-secondary btn-sm">← Prev</Link>}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                        <Link key={p} href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(p) })}`} className={`btn btn-sm ${p === page ? "btn-primary" : "btn-secondary"}`}>{p}</Link>
                    ))}
                    {page < totalPages && <Link href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`} className="btn btn-secondary btn-sm">Next →</Link>}
                </div>
            )}
        </div>
    );
}

function ReturnBtn({ recordId, bookTitle, onDone }: any) {
    const { showConfirm } = require("@/components/ui/ConfirmModal");
    const { showToast } = require("@/components/ui/ToastNotifications");
    async function handle() {
        const ok = await showConfirm(`Return "${bookTitle}"?`, "warning");
        if (!ok) return;
        const res = await fetch(`/api/borrow/records/${recordId}/return`, { method: "POST" });
        const d = await res.json();
        if (res.ok) { showToast(`Returned. ${d.fineAmount > 0 ? `Fine: ETB ${d.fineAmount.toFixed(2)}` : ""}`, "success"); onDone(); }
        else showToast(d.error || "Failed.", "error");
    }
    return (
        <button className="btn btn-sm" style={{ padding: "6px 12px", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.3)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }} onClick={handle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
            Return
        </button>
    );
}
