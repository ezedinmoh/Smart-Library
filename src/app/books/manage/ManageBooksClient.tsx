"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate } from "@/lib/utils";
import BookCoverImage from "@/components/BookCoverImage";

const STAT_CARDS = [
    { key: "totalBooks", label: "Total Books", gradFrom: "#0ea5e9", gradTo: "#0284c7", icon: "book" },
    { key: "totalCopies", label: "Total Copies", gradFrom: "#8b5cf6", gradTo: "#7c3aed", icon: "box" },
    { key: "totalAvailable", label: "Available", gradFrom: "#10b981", gradTo: "#059669", icon: "check" },
    { key: "totalBorrowed", label: "Borrowed", gradFrom: "#14b8a6", gradTo: "#0d9488", icon: "clock" },
    { key: "lowStock", label: "Low Stock", gradFrom: "#f59e0b", gradTo: "#d97706", icon: "warn" },
    { key: "outOfStock", label: "Out of Stock", gradFrom: "#ef4444", gradTo: "#dc2626", icon: "x" },
];

function StatIcon({ type }: { type: string }) {
    const p = { viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2", style: { width: 20, height: 20 } };
    if (type === "book") return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
    if (type === "box") return <svg {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>;
    if (type === "check") return <svg {...p}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    if (type === "clock") return <svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    if (type === "warn") return <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    return <svg {...p}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
    return (
        <div style={{ minWidth: 155 }}>
            <label style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{label}</label>
            <div style={{ position: "relative" }}>
                <select value={value} onChange={e => onChange(e.target.value)}
                    style={{ width: "100%", padding: "9px 30px 9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", appearance: "none", fontWeight: 500, fontSize: "0.875rem", cursor: "pointer" }}>
                    {children}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, pointerEvents: "none", color: "var(--text-muted)" }}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>
        </div>
    );
}

function ActionBtn({ href, color, title, onClick, children }: { href?: string; color: string; title: string; onClick?: () => void; children: React.ReactNode }) {
    const base: React.CSSProperties = { width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "none", cursor: "pointer", transition: "all 0.18s", background: `${color}18`, color, textDecoration: "none", flexShrink: 0 };
    const enter = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = color; (e.currentTarget as HTMLElement).style.color = "white"; };
    const leave = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = `${color}18`; (e.currentTarget as HTMLElement).style.color = color; };
    if (href) return <Link href={href} title={title} style={base} onMouseEnter={enter} onMouseLeave={leave}>{children}</Link>;
    return <button title={title} style={base} onMouseEnter={enter} onMouseLeave={leave} onClick={onClick}>{children}</button>;
}

export default function ManageBooksClient({ books, total, page, pageSize, categories, searchParams, stats }: any) {
    const router = useRouter();
    const pathname = usePathname();
    const [, start] = useTransition();
    const totalPages = Math.ceil(total / pageSize);

    // Controlled + debounced search — fixes stale defaultValue bug
    const [searchVal, setSearchVal] = useState<string>(searchParams.search ?? "");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => { setSearchVal(searchParams.search ?? ""); }, [searchParams.search]);

    function handleSearchChange(val: string) {
        setSearchVal(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => update({ search: val }), 400);
    }

    function update(p: Record<string, string>) {
        const sp = new URLSearchParams(searchParams);
        Object.entries(p).forEach(([k, v]) => v ? sp.set(k, v) : sp.delete(k));
        sp.delete("page");
        start(() => router.push(`${pathname}?${sp.toString()}`));
    }

    async function deleteBook(id: number, title: string) {
        const ok = await showConfirm(`Permanently delete "${title}"?`, "danger");
        if (!ok) return;
        const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
        if (res.ok) { showToast(`"${title}" deleted.`, "success"); router.refresh(); }
        else showToast("Failed to delete.", "error");
    }

    const hasFilters = searchParams.search || searchParams.category || searchParams.availability || searchParams.sort;

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

            {/* Page Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <nav className="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        <span>Manage Books</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <h1 className="page-title-gradient">Manage Books</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
                        Edit, delete, manage stock — {total} book{total !== 1 ? "s" : ""} in catalog
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/books/create" className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14m-7-7h14" /></svg>
                        Add Book
                    </Link>
                    <Link href="/books/bulk-import" className="btn btn-secondary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        Bulk Import
                    </Link>
                    <a href="/api/books/export/csv" className="btn btn-secondary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Export CSV
                    </a>
                </div>
            </div>

            {/* Stat Cards — 6 cols desktop, 3 tablet, 2 mobile via .manage-stats-grid */}
            <div className="manage-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 24 }}>
                {STAT_CARDS.map(card => (
                    <div key={card.key}
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${card.gradFrom}, ${card.gradTo})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <StatIcon type={card.icon} />
                        </div>
                        <div>
                            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{stats?.[card.key] ?? 0}</div>
                            <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)", marginTop: 3, fontWeight: 500 }}>{card.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Bar — stacks vertically on mobile via .manage-filters-bar */}
            <div className="manage-filters-bar" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ flex: "1 1 220px", minWidth: 180 }}>
                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Search</label>
                    <div className="search-box" style={{ borderRadius: "var(--radius)", background: "var(--background)", border: "1px solid var(--border)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input
                            type="text"
                            placeholder="Title, author, ISBN…"
                            value={searchVal}
                            onChange={e => handleSearchChange(e.target.value)}
                            style={{ width: "100%" }}
                        />
                    </div>
                </div>
                <FilterSelect label="Category" value={searchParams.category ?? ""} onChange={v => update({ category: v })}>
                    <option value="">All Categories</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </FilterSelect>
                <FilterSelect label="Availability" value={searchParams.availability ?? ""} onChange={v => update({ availability: v })}>
                    <option value="">All</option>
                    <option value="available">Available</option>
                    <option value="low_stock">Low Stock (≤2)</option>
                    <option value="unavailable">Out of Stock</option>
                </FilterSelect>
                <FilterSelect label="Sort By" value={searchParams.sort ?? "-created_at"} onChange={v => update({ sort: v })}>
                    <option value="-created_at">Newest First</option>
                    <option value="created_at">Oldest First</option>
                    <option value="title">Title A–Z</option>
                    <option value="-title">Title Z–A</option>
                    <option value="author">Author A–Z</option>
                    <option value="available_copies">Least Available</option>
                    <option value="-available_copies">Most Available</option>
                </FilterSelect>
                {hasFilters && (
                    <button className="btn btn-secondary" onClick={() => router.push(pathname)}
                        style={{ padding: "9px 16px", fontSize: "0.875rem", alignSelf: "flex-end" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        Clear
                    </button>
                )}
            </div>

            {/* Table Card */}
            <div className="books-table-card" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>

                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 18, height: 18 }}>
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Books</span>
                        <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 700, fontSize: "0.8125rem", padding: "2px 10px", borderRadius: 9999 }}>{total}</span>
                    </div>
                </div>

                {/* Scrollable table */}
                <div className="table-scroll-wrapper" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                        <thead>
                            <tr style={{ background: "var(--background)", borderBottom: "2px solid var(--border)" }}>
                                {["Cover", "Title", "Author", "Category", "ISBN", "Copies", "Stock", "Rating", "Added", "Actions"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {books.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ padding: "64px", textAlign: "center" }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48, opacity: 0.2, display: "block", margin: "0 auto 12px" }}>
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                        <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>No books found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : books.map((b: any) => {
                                const pct = b.totalCopies > 0 ? Math.round((b.availableCopies / b.totalCopies) * 100) : 0;
                                const sc = b.availableCopies === 0 ? "#ef4444" : b.availableCopies <= 2 ? "#f59e0b" : "#10b981";
                                const sl = b.availableCopies === 0 ? "Out" : b.availableCopies <= 2 ? "Low" : "OK";
                                return (
                                    <tr key={b.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ width: 38, height: 52, borderRadius: 5, overflow: "hidden", background: "var(--background)", border: "1px solid var(--border)", flexShrink: 0 }}>
                                                {b.coverImage
                                                    ? <BookCoverImage src={b.coverImage} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} fallback={<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg></div>} />
                                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                                    </div>
                                                }
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 14px", maxWidth: 200 }}>
                                            <Link href={`/books/${b.id}`} style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9375rem", marginBottom: 2 }}>{b.title}</Link>
                                            {b.language && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{b.language}</span>}
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{b.author}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            {b.category
                                                ? <span style={{ fontSize: "0.8125rem", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", padding: "3px 10px", borderRadius: 9999, fontWeight: 600, whiteSpace: "nowrap" }}>{b.category.name}</span>
                                                : <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>—</span>}
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>{b.isbn}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                                                    {b.availableCopies}<span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.8125rem" }}>/{b.totalCopies}</span>
                                                </span>
                                                <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: 9999, textTransform: "uppercase", background: `${sc}18`, color: sc, border: `1px solid ${sc}44` }}>{sl}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 14px", minWidth: 90 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 9999, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: `${pct}%`, background: sc, borderRadius: 9999 }} />
                                                </div>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{pct}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 600, fontSize: "0.875rem" }}>
                                                <svg viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" style={{ width: 13, height: 13 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                {parseFloat(b.rating?.toString() ?? "0").toFixed(1)}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatDate(b.createdAt)}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", gap: 5 }}>
                                                <ActionBtn href={`/books/${b.id}`} color="#10b981" title="View">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                </ActionBtn>
                                                <ActionBtn href={`/books/${b.id}/edit`} color="#0ea5e9" title="Edit">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </ActionBtn>
                                                <ActionBtn color="#ef4444" title="Delete" onClick={() => deleteBook(b.id, b.title)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                </ActionBtn>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} books
                        </span>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {page > 1 && (
                                <Link href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34, padding: "0 12px", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-secondary)" }}>
                                    ← Prev
                                </Link>
                            )}
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                                <Link key={p} href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 34, padding: "0 8px", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", border: "1px solid var(--border)", background: p === page ? "#10b981" : "var(--background)", color: p === page ? "white" : "var(--text-secondary)", transition: "all 0.2s" }}>
                                    {p}
                                </Link>
                            ))}
                            {page < totalPages && (
                                <Link href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34, padding: "0 12px", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-secondary)" }}>
                                    Next →
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
