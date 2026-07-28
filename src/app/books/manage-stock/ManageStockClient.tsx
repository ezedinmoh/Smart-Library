"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/ToastNotifications";

export default function ManageStockClient({ books, stats }: any) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const filtered = books.filter((b: any) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

    async function adjustStock(bookId: number, action: string, amount: number) {
        const res = await fetch(`/api/books/${bookId}/stock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, amount }) });
        const data = await res.json();
        if (res.ok) { showToast(data.message || "Stock updated.", "success"); router.refresh(); }
        else showToast(data.error || "Failed.", "error");
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <h1 className="page-title-gradient">Manage Stock</h1>
                <Link href="/books/create" className="btn btn-primary">Add New Book</Link>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20, marginBottom: 32 }}>
                {[
                    ["Total Books", stats.totalBooks, "#10b981", "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))"],
                    ["Total Copies", stats.totalCopies, "#0ea5e9", "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(14,165,233,0.02))"],
                    ["Available", stats.totalAvailable, "#22c55e", "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.02))"],
                    ["Out of Stock", stats.outOfStock, "#ef4444", "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))"],
                    ["Low Stock (≤2)", stats.lowStock, "#f59e0b", "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))"],
                ].map(([l, v, c, bg]) => (
                    <div key={l as string} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: bg as string, pointerEvents: "none" }} />
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: c as string, marginBottom: 4, letterSpacing: "-0.02em" }}>{v}</div>
                            <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>{l}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ flex: "1 1 240px" }}>
                    <div className="search-box" style={{ borderRadius: "var(--radius)", background: "var(--background)", border: "1px solid var(--border)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input type="text" placeholder="Search books by title or author..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%" }} />
                    </div>
                </div>
                {search && <button className="btn btn-secondary" style={{ padding: "10px 16px" }} onClick={() => setSearch("")}>Clear</button>}
            </div>

            {/* Table */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                                {["Book", "Category", "Total", "Available", "Borrowed", "Actions"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--text-secondary)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)", fontSize: "1.1rem" }}>No books matching your search</td></tr>
                            ) : filtered.map((b: any) => {
                                const borrowed = b.totalCopies - b.availableCopies;
                                const isLow = b.availableCopies > 0 && b.availableCopies <= 2;
                                const isOut = b.availableCopies === 0;
                                return (
                                    <tr key={b.id} style={{ borderBottom: "1px solid var(--border-light)", background: isOut ? "rgba(239,68,68,0.03)" : isLow ? "rgba(245,158,11,0.03)" : "transparent", transition: "background 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = isOut ? "rgba(239,68,68,0.06)" : isLow ? "rgba(245,158,11,0.06)" : "var(--surface-hover)"; }} onMouseLeave={e => { e.currentTarget.style.background = isOut ? "rgba(239,68,68,0.03)" : isLow ? "rgba(245,158,11,0.03)" : "transparent"; }}>
                                        <td style={{ padding: "16px 20px" }}>
                                            <Link href={`/books/${b.id}`} style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", fontSize: "0.9375rem", marginBottom: 2 }}>{b.title}</Link>
                                            <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>{b.author} · ISBN: {b.isbn}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{b.category?.name ?? "—"}</td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{b.totalCopies}</td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: isOut ? "rgba(239,68,68,0.1)" : isLow ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)", color: isOut ? "var(--error)" : isLow ? "#f59e0b" : "#22c55e", border: `1px solid ${isOut ? "rgba(239,68,68,0.2)" : isLow ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)"}` }}>
                                                {b.availableCopies} {isLow && !isOut ? " (Low)" : isOut ? " (Out)" : ""}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 20px", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>{borrowed}</td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <StockActions book={b} onAdjust={adjustStock} />
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

function StockActions({ book, onAdjust }: { book: any; onAdjust: (id: number, action: string, amount: number) => void }) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(1);
    return (
        <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "nowrap", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", width: "max-content" }}>
            <button className="btn btn-sm" style={{ padding: "8px 12px", background: "var(--surface)", border: "none", borderRight: "1px solid var(--border)", borderRadius: 0, fontWeight: 700, color: "var(--text-primary)" }} onClick={() => onAdjust(book.id, "add_copies", 1)} title="Add 1 copy" onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"} onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}>+1</button>
            <button className="btn btn-sm" style={{ padding: "8px 12px", background: "var(--surface)", border: "none", borderRight: open ? "1px solid var(--border)" : "none", borderRadius: 0, fontWeight: 700, color: "var(--text-primary)" }} onClick={() => onAdjust(book.id, "remove_copies", 1)} title="Remove 1 copy" disabled={book.availableCopies < 1} onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"} onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}>−1</button>
            {open ? (
                <div style={{ display: "flex", gap: 0, alignItems: "stretch", background: "var(--surface)" }}>
                    <input type="number" min={1} max={100} value={amount} onChange={e => setAmount(parseInt(e.target.value) || 1)} style={{ width: 60, padding: "4px 8px", border: "none", background: "var(--background)", fontSize: "0.813rem", textAlign: "center", borderRight: "1px solid var(--border)" }} />
                    <button className="btn btn-sm" style={{ padding: "8px 12px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "none", borderRight: "1px solid var(--border)", borderRadius: 0, fontWeight: 600 }} onClick={() => { onAdjust(book.id, "add_copies", amount); setOpen(false); }}>Add</button>
                    <button className="btn btn-sm" style={{ padding: "8px 12px", background: "var(--surface)", border: "none", borderRadius: 0, color: "var(--text-muted)" }} onClick={() => setOpen(false)}>✕</button>
                </div>
            ) : (
                <button className="btn btn-sm" style={{ padding: "8px 12px", background: "var(--background)", border: "none", borderLeft: "1px solid var(--border)", borderRadius: 0, color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }} onClick={() => setOpen(true)} onMouseEnter={e => e.currentTarget.style.background = "var(--border-light)"} onMouseLeave={e => e.currentTarget.style.background = "var(--background)"}>Bulk</button>
            )}
        </div>
    );
}
