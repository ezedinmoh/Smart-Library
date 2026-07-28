"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, getDaysRemaining, getDaysOverdue } from "@/lib/utils";

export default function IssueReturnClient({ records, total, page, pageSize, searchParams }: any) {
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

    async function returnBook(id: number, title: string) {
        const ok = await showConfirm(`Return "${title}"?`, "warning");
        if (!ok) return;
        const res = await fetch(`/api/borrow/records/${id}/return`, { method: "POST" });
        const d = await res.json();
        if (res.ok) { showToast(`"${title}" returned.${d.fineAmount > 0 ? ` Fine: ETB ${d.fineAmount.toFixed(2)}` : ""}`, "success"); router.refresh(); }
        else showToast(d.error || "Failed.", "error");
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <nav className="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        <span>Issue &amp; Return</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                        <h1 className="page-title-gradient">Issue &amp; Return Books</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>{total} active borrow{total !== 1 ? "s" : ""}</p>
                </div>
                <Link href="/borrow/pending-requests" className="btn btn-primary btn-sm">Pending Requests</Link>
            </div>

            {/* Filters */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24 }}>
                <div style={{ flex: "1 1 200px" }}>
                    <div className="search-box" style={{ borderRadius: "var(--radius)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input type="text" placeholder="Search user or book…" defaultValue={searchParams.search ?? ""} onChange={e => update({ search: e.target.value })} style={{ width: "100%" }} />
                    </div>
                </div>
                <select value={searchParams.status ?? ""} onChange={e => update({ status: e.target.value })} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)" }}>
                    <option value="">All Active</option>
                    <option value="borrowed">Borrowed</option>
                    <option value="overdue">Overdue</option>
                </select>
                {(searchParams.search || searchParams.status) && <button className="btn btn-secondary btn-sm" onClick={() => router.push(pathname)}>Clear</button>}
            </div>

            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--background)", borderBottom: "2px solid var(--border)" }}>
                                {["User", "Book", "Borrow Date", "Due Date", "Status", "Fine", "Action"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "0.813rem", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No active borrows</td></tr>
                            ) : records.map((r: any) => {
                                const isOverdue = r.status === "overdue";
                                const daysLeft = getDaysRemaining(r.dueDate);
                                const daysOver = getDaysOverdue(r.dueDate);
                                return (
                                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)", background: isOverdue ? "rgba(239,68,68,0.03)" : "transparent" }}>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ fontWeight: 500 }}>{r.user.username}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.user.email}</div>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <Link href={`/books/${r.bookId}`} style={{ fontWeight: 500, color: "var(--text-primary)" }}>{r.book.title}</Link>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{formatDate(r.borrowDate)}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                                            <span style={{ color: isOverdue ? "var(--error)" : daysLeft <= 3 ? "#f59e0b" : "var(--text-primary)" }}>
                                                {formatDate(r.dueDate)}
                                                {isOverdue && <span style={{ display: "block", fontSize: "0.75rem" }}>{daysOver}d overdue</span>}
                                                {!isOverdue && daysLeft <= 3 && <span style={{ display: "block", fontSize: "0.75rem" }}>{daysLeft}d left</span>}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{
                                                padding: "3px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600,
                                                background: isOverdue ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                                                color: isOverdue ? "var(--error)" : "#10b981"
                                            }}>{isOverdue ? "Overdue" : "Borrowed"}</span>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                                            {parseFloat(r.fineAmount) > 0 ? <span style={{ color: r.finePaid ? "#22c55e" : "var(--error)", fontWeight: 600 }}>ETB {parseFloat(r.fineAmount).toFixed(2)}</span> : "—"}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <button className="btn btn-primary btn-sm" onClick={() => returnBook(r.id, r.book.title)}>Return</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

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
