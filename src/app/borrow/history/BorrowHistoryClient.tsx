"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { formatDate } from "@/lib/utils";

const ST: Record<string, { bg: string; color: string }> = {
    borrowed: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
    returned: { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
    overdue: { bg: "rgba(239,68,68,0.1)", color: "var(--error)" },
};

export default function BorrowHistoryClient({ records, total, page, pageSize, searchParams }: any) {
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
            {/* Header with breadcrumb — matches Django borrow_history.html */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <h1 className="page-title-gradient">Borrow History</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>View your complete borrowing history — {total} record{total !== 1 ? "s" : ""}</p>
                </div>
                <Link href="/borrow/my-books" className="btn btn-secondary btn-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    My Books
                </Link>
            </div>

            {/* Filters */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24 }}>
                <div style={{ flex: "1 1 200px" }}>
                    <div className="search-box" style={{ borderRadius: "var(--radius)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input type="text" placeholder="Search by book title…" defaultValue={searchParams.search ?? ""} onChange={e => update({ search: e.target.value })} style={{ width: "100%" }} />
                    </div>
                </div>
                <select value={searchParams.status ?? ""} onChange={e => update({ status: e.target.value })} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)" }}>
                    <option value="">All Status</option>
                    <option value="borrowed">Borrowed</option>
                    <option value="returned">Returned</option>
                    <option value="overdue">Overdue</option>
                </select>
                {(searchParams.search || searchParams.status) && <button className="btn btn-secondary btn-sm" onClick={() => router.push(pathname)}>Clear</button>}
            </div>

            {records.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64, color: "var(--text-muted)", margin: "0 auto 16px", display: "block" }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>No borrow history</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>You haven't borrowed any books yet.</p>
                    <Link href="/borrow/request-list" className="btn btn-primary">Browse Books</Link>
                </div>
            ) : (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr style={{ background: "var(--background)", borderBottom: "2px solid var(--border)" }}>
                                {["Book", "Borrow Date", "Due Date", "Return Date", "Status", "Fine", ""].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "0.813rem", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {records.map((r: any) => {
                                    const s = ST[r.status] ?? ST.borrowed;
                                    const fine = parseFloat(r.fineAmount.toString());
                                    return (
                                        <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                            <td style={{ padding: "12px 16px" }}>
                                                <Link href={`/books/${r.bookId}`} style={{ fontWeight: 500, color: "var(--primary)" }}>{r.book.title}</Link>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.book.author}</div>
                                            </td>
                                            <td style={{ padding: "12px 16px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{formatDate(r.borrowDate)}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{formatDate(r.dueDate)}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{r.returnDate ? formatDate(r.returnDate) : "—"}</td>
                                            <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: s.bg, color: s.color }}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
                                            <td style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
                                                {fine > 0 ? <span style={{ color: r.finePaid ? "#22c55e" : "var(--error)", fontWeight: 600 }}>ETB {fine.toFixed(2)}{r.finePaid ? " ✓" : ""}</span> : "—"}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {fine > 0 && !r.finePaid && <Link href={`/payments/select-method/${r.id}`} className="btn btn-primary btn-sm">Pay Fine</Link>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
