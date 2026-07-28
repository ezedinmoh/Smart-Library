"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/ToastNotifications";
import { formatDate } from "@/lib/utils";

const GRADIENTS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

export default function LibrarianDashboardClient({ stats, todayStats, recentBorrows, recentRequests, overdueRecords, lowStockBooks, username }: any) {
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [currentDate, setCurrentDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    }, []);

    // Live search query effect
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/books?search=${encodeURIComponent(searchQuery.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    const books = Array.isArray(data) ? data : data.books || [];
                    setSearchResults(books.slice(0, 5));
                    setShowSearchDropdown(true);
                }
            } catch {
                // ignore
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close search dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSearchDropdown(false);
            router.push(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    async function sendOverdue() {
        setSending(true);
        const res = await fetch("/api/dashboard/reminders/overdue", { method: "POST" });
        const d = await res.json();
        if (res.ok) showToast(`Sent ${d.count} overdue reminder(s).`, "success");
        else showToast("Failed.", "error");
        setSending(false);
    }

    async function sendDueSoon() {
        setSending(true);
        const res = await fetch("/api/dashboard/reminders/due-soon", { method: "POST" });
        const d = await res.json();
        if (res.ok) showToast(`Sent ${d.count} due-soon reminder(s).`, "success");
        else showToast("Failed.", "error");
        setSending(false);
    }

    return (
        <div className="adm-dash">
            {/* Welcome Banner */}
            <div className="adm-welcome">
                <div className="adm-welcome-bg" />
                <div className="adm-welcome-content">
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                            <h1 className="adm-welcome-title" style={{ fontSize: "1.95rem", fontWeight: 800, margin: "0 0 6px 0", color: "white", lineHeight: 1.2 }}>
                                Welcome back, <span style={{ fontWeight: 800 }}>{username}</span>!
                            </h1>
                            <p className="adm-welcome-sub" style={{ fontSize: "0.95rem", opacity: 0.9, margin: 0, color: "white" }}>
                                Manage library operations and assist students with their reading journey.
                            </p>
                            
                            <div className="adm-welcome-actions" style={{ marginTop: 16 }}>
                                <div className="adm-date-chip">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    <span>{currentDate}</span>
                                </div>
                                <Link href="/users/profile" className="btn btn-sm" style={{ background: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                    My Library Card
                                </Link>
                            </div>
                        </div>

                        {/* Functional Search Bar with Live Dropdown */}
                        <div ref={searchRef} style={{ position: "relative", minWidth: 280, maxWidth: 360, width: "100%" }}>
                            <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.25)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 30, padding: "6px 14px", width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ width: 18, height: 18, opacity: 0.9, marginRight: 8, flexShrink: 0 }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search catalog by title/author..."
                                    style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: "0.9rem", width: "100%", fontWeight: 500 }}
                                />
                                <button type="submit" className="btn btn-sm" style={{ background: "white", color: "var(--primary-dark)", borderRadius: 20, padding: "6px 14px", fontSize: "0.78rem", fontWeight: 800, marginLeft: 6, border: "none", cursor: "pointer", flexShrink: 0 }}>
                                    {isSearching ? "..." : "Search"}
                                </button>
                            </form>

                            {/* Live Search Suggestions Dropdown */}
                            {showSearchDropdown && searchResults.length > 0 && (
                                <div style={{ position: "absolute", top: "115%", left: 0, right: 0, background: "var(--background)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 15px 30px rgba(0,0,0,0.2)", overflow: "hidden", zIndex: 100, padding: "8px 0" }}>
                                    <div style={{ padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Matching Books</div>
                                    {searchResults.map((b: any) => (
                                        <div
                                            key={b.id}
                                            onClick={() => {
                                                setShowSearchDropdown(false);
                                                router.push(`/books/${b.id}`);
                                            }}
                                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", transition: "background 0.2s" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <div style={{ width: 32, height: 44, borderRadius: 4, overflow: "hidden", background: "var(--surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {b.coverImage ? <img src={b.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "var(--text-muted)" }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.author}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div
                                        onClick={handleSearchSubmit}
                                        style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", cursor: "pointer" }}
                                    >
                                        View all search results →
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="adm-kpi-grid">
                {[
                    { label: "Total Books", value: stats.totalBooks, sub: `${stats.availableBooks} available`, color: "#10b981", href: "/books", gradient: "linear-gradient(135deg,#10b981,#059669)", icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
                    { label: "Active Borrows", value: stats.activeBorrows, sub: "currently out", color: "#0ea5e9", href: "/borrow/all-records", gradient: "linear-gradient(135deg,#0ea5e9,#0284c7)", icon: <><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></> },
                    { label: "Overdue Books", value: stats.overdueBooks, sub: stats.overdueBooks > 0 ? "Needs attention" : "All clear ✓", color: stats.overdueBooks > 0 ? "#ef4444" : "#22c55e", href: "/borrow/overdue", gradient: stats.overdueBooks > 0 ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#22c55e,#16a34a)", icon: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94" /><line x1="12" y1="9" x2="12" y2="13" /></> },
                    { label: "Pending Requests", value: stats.pendingRequests, sub: "Awaiting approval", color: "#f59e0b", href: "/borrow/pending-requests", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                    { label: "Unpaid Fines (ETB)", value: parseFloat(stats.unpaidFines).toFixed(2), sub: "outstanding", color: "#ef4444", href: "/borrow/overdue", gradient: "linear-gradient(135deg,#f43f5e,#e11d48)", icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></> },
                    { label: "Low Stock Titles", value: stats.lowStockCount, sub: "≤ 2 copies left", color: "#f59e0b", href: "/books/manage-stock", gradient: "linear-gradient(135deg,#a18cd1,#fbc2eb)", icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0z" /></> },
                ].map(({ label, value, sub, color, href, gradient, icon }) => (
                    <Link key={label} href={href} className="adm-kpi-card">
                        <div className="adm-kpi-icon" style={{ background: gradient }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 26, height: 26 }}>{icon}</svg>
                        </div>
                        <div className="adm-kpi-info">
                            <div className="adm-kpi-value" style={{ color }}>{value}</div>
                            <div className="adm-kpi-label">{label}</div>
                            <div className="adm-kpi-sub">{sub}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Today's Activity */}
            <div className="adm-card" style={{ marginBottom: 24 }}>
                <div className="adm-card-header">
                    <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>Today's Activity</h3>
                </div>
                <div className="adm-card-body">
                    <div className="adm-today-grid">
                        {[
                            { label: "Books Issued", val: todayStats.borrows, color: "#667eea" },
                            { label: "Books Returned", val: todayStats.returns, color: "#11998e" },
                            { label: "New Requests", val: todayStats.requests, color: "#f59e0b" },
                        ].map(({ label, val, color }) => (
                            <div key={label} className="adm-today-card">
                                <div className="adm-today-val" style={{ color }}>{val}</div>
                                <div className="adm-today-label">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="adm-section">
                <div className="adm-section-header">
                    <span className="adm-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                        Quick Actions
                    </span>
                </div>
                <div className="adm-qa-grid">
                    {[
                        { label: `Pending (${stats.pendingRequests})`, href: "/borrow/pending-requests", grad: "gradient-5", badge: stats.pendingRequests > 0, icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                        { label: "Issue & Return", href: "/borrow/issue-return", grad: "gradient-3", icon: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></> },
                        { label: `Overdue (${stats.overdueBooks})`, href: "/borrow/overdue", grad: "gradient-2", badge: stats.overdueBooks > 0, icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></> },
                        { label: "Manage Stock", href: "/books/manage-stock", grad: "gradient-4", badge: stats.lowStockCount > 0, icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0z" /></> },
                        { label: "Add New Book", href: "/books/create", grad: "gradient-1", icon: <path d="M12 4v16m8-8H4" /> },
                        { label: "All Records", href: "/borrow/all-records", grad: "gradient-6", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></> },
                        { label: "Due Dates Calendar", href: "/dashboard/calendar", grad: "gradient-3", icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
                        { label: "Notification Center", href: "/dashboard/notification-center", grad: "gradient-2", icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
                        { label: "Categories", href: "/books/categories", grad: "gradient-5", icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></> },
                    ].map(({ label, href, grad, badge, icon }) => (
                        <Link key={label} href={href} className="adm-qa-card">
                            <div className={`adm-qa-icon ${grad}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 22, height: 22 }}>{icon}</svg>
                            </div>
                            <span className="adm-qa-label">{label}</span>
                            {badge && <span className="adm-qa-badge" />}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main grid */}
            <div className="adm-wide-grid">
                {/* Recent Borrow Activity */}
                <div className="adm-card adm-span-2">
                    <div className="adm-card-header">
                        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>Recent Borrow Activity</h3>
                        <Link href="/borrow/all-records" className="adm-card-link">View All</Link>
                    </div>
                    <div className="adm-card-body" style={{ padding: 0 }}>
                        <div style={{ overflowX: "auto" }}>
                            <table className="adm-table">
                                <thead><tr><th>Student</th><th>Book</th><th>Date</th><th>Status</th></tr></thead>
                                <tbody>
                                    {recentBorrows.length === 0
                                        ? <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0" }}>No recent activity</td></tr>
                                        : recentBorrows.map((r: any, i: number) => (
                                            <tr key={r.id}>
                                                <td><div className="adm-user-cell"><div className={`adm-avatar ${GRADIENTS[i % 6]}`}>{(r.user.firstName?.[0] || r.user.username[0]).toUpperCase()}</div><div><div className="adm-user-name">{r.user.firstName ? `${r.user.firstName} ${r.user.lastName || ""}`.trim() : r.user.username}</div><div className="adm-user-role">{r.user.role}</div></div></div></td>
                                                <td><div className="adm-book-title">{r.book.title}</div><div className="adm-book-author">{r.book.author}</div></td>
                                                <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{formatDate(r.borrowDate)}</td>
                                                <td><span className={`adm-status adm-status-${r.status}`}>{r.status}</span></td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right panel: Pending + Low Stock + Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Pending Requests */}
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>Pending Requests</h3>
                            <Link href="/borrow/pending-requests" className="adm-card-link">View All</Link>
                        </div>
                        <div className="adm-card-body">
                            {recentRequests.length === 0
                                ? <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No pending requests ✓</p>
                                : recentRequests.slice(0, 5).map((req: any) => (
                                    <div key={req.id} className="adm-req-row">
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="adm-book-title">{req.book.title}</div>
                                            <div className="adm-book-author">{req.user.username} · {formatDate(req.requestDate)}</div>
                                        </div>
                                        <span style={{ padding: "3px 8px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: req.book.availableCopies > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: req.book.availableCopies > 0 ? "#22c55e" : "var(--error)", flexShrink: 0 }}>
                                            {req.book.availableCopies > 0 ? `${req.book.availableCopies} avail.` : "Out of stock"}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    {lowStockBooks.length > 0 && (
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>Low Stock Alert</h3>
                                <Link href="/books/manage-stock" className="adm-card-link">Manage</Link>
                            </div>
                            <div className="adm-card-body">
                                {lowStockBooks.slice(0, 5).map((b: any) => (
                                    <div key={b.id} className="adm-req-row">
                                        <div style={{ flex: 1, minWidth: 0 }}><div className="adm-book-title">{b.title}</div><div className="adm-book-author">{b.author}</div></div>
                                        <span style={{ padding: "3px 8px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: b.availableCopies === 0 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: b.availableCopies === 0 ? "var(--error)" : "var(--warning)", flexShrink: 0 }}>
                                            {b.availableCopies === 0 ? "Out" : `${b.availableCopies} left`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Email reminders */}
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>Email Reminders</h3>
                        </div>
                        <div className="adm-card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={sendDueSoon} disabled={sending} style={{ justifyContent: "flex-start" }}>Send Due-Soon Reminders</button>
                            <button className="btn btn-secondary btn-sm" onClick={sendOverdue} disabled={sending} style={{ justifyContent: "flex-start" }}>Send Overdue Reminders</button>
                            <Link href="/dashboard/notification-center" className="btn btn-primary btn-sm" style={{ justifyContent: "flex-start" }}>Notification Center</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
