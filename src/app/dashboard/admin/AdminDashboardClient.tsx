"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, formatCurrency, getDaysOverdue } from "@/lib/utils";

const GRADIENTS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

/* ── tiny inline chart helpers ─────────────────────────────── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", flex: 1 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
        </div>
    );
}

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
    const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
    let acc = 0;
    const r = 54, cx = 64, cy = 64;
    const paths = slices.map(sl => {
        const pct = sl.value / total;
        const startA = acc * 2 * Math.PI - Math.PI / 2;
        acc += pct;
        const endA = acc * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
        const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
        return { ...sl, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${pct > 0.5 ? 1 : 0},1 ${x2},${y2} Z` };
    });
    return (
        <svg width="128" height="128" viewBox="0 0 128 128">
            {paths.map(p => <path key={p.label} d={p.d} fill={p.color} />)}
            <circle cx={cx} cy={cy} r={32} fill="var(--background)" />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text-primary)">{total}</text>
            <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9" fill="var(--text-muted)">users</text>
        </svg>
    );
}

export default function AdminDashboardClient({ stats, recentBorrows, recentReturns, mostBorrowed, monthlyBorrows }: any) {
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

    async function sendOverdueReminders() {
        setSending(true);
        const res = await fetch("/api/dashboard/reminders/overdue", { method: "POST" });
        const d = await res.json();
        if (res.ok) showToast(`Sent ${d.count} overdue reminder(s).`, "success");
        else showToast("Failed.", "error");
        setSending(false);
    }

    async function sendDueSoonReminders() {
        setSending(true);
        const res = await fetch("/api/dashboard/reminders/due-soon", { method: "POST" });
        const d = await res.json();
        if (res.ok) showToast(`Sent ${d.count} due-soon reminder(s).`, "success");
        else showToast("Failed.", "error");
        setSending(false);
    }

    async function recalcOverdue() {
        const res = await fetch("/api/dashboard/update-overdue", { method: "POST" });
        const d = await res.json();
        if (res.ok) { showToast(`Updated ${d.count} overdue record(s).`, "success"); router.refresh(); }
        else showToast("Failed.", "error");
    }

    async function createBackup() {
        const ok = await showConfirm("Download a full database backup?", "warning");
        if (ok) window.location.href = "/api/dashboard/backup/create";
    }

    /* ── KPI stat cards ── */
    const kpis = [
        { label: "Total Books", value: stats.totalBooks, sub: `${stats.availableBooks} available`, color: "#10b981", icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>, href: "/books", gradient: "linear-gradient(135deg,#10b981,#059669)" },
        { label: "Total Users", value: stats.totalUsers, sub: `${stats.activeUsers} active`, color: "#0ea5e9", icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" /></>, href: "/users/list", gradient: "linear-gradient(135deg,#0ea5e9,#0284c7)" },
        { label: "Active Borrows", value: stats.activeBorrows, sub: `${stats.totalBorrows} total`, color: "#8b5cf6", icon: <><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></>, href: "/borrow/all-records", gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
        { label: "Overdue Books", value: stats.overdueBooks, sub: stats.overdueBooks > 0 ? "Needs attention" : "All clear ✓", color: stats.overdueBooks > 0 ? "#ef4444" : "#22c55e", icon: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>, href: "/borrow/overdue", gradient: stats.overdueBooks > 0 ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#22c55e,#16a34a)" },
        { label: "Pending Requests", value: stats.pendingRequests, sub: "Awaiting approval", color: "#f59e0b", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, href: "/borrow/pending-requests", gradient: "linear-gradient(135deg,#f59e0b,#d97706)" },
        { label: "Unpaid Fines (ETB)", value: formatCurrency(stats.unpaidFines), sub: `${formatCurrency(stats.totalFines)} total`, color: "#ef4444", icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>, href: "/borrow/overdue", gradient: "linear-gradient(135deg,#f43f5e,#e11d48)" },
    ];

    return (
        <div className="adm-dash">
            {/* ── Welcome Banner ─────────────────────────── */}
            <div className="adm-welcome">
                <div className="adm-welcome-bg" />
                <div className="adm-welcome-content">
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                            <h1 className="adm-welcome-title" style={{ fontSize: "1.95rem", fontWeight: 800, margin: "0 0 6px 0", color: "white", lineHeight: 1.2 }}>
                                Admin Dashboard
                            </h1>
                            <p className="adm-welcome-sub" style={{ fontSize: "0.95rem", opacity: 0.9, margin: 0, color: "white" }}>
                                Library system overview &amp; management
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

            {/* ── KPI Cards ─────────────────────────────── */}
            <div className="adm-kpi-grid">
                {kpis.map(({ label, value, sub, color, icon, href, gradient }) => (
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

            {/* ── Quick Actions ─────────────────────────── */}
            <div className="adm-section">
                <div className="adm-section-header">
                    <span className="adm-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                        Quick Actions
                    </span>
                </div>
                <div className="adm-qa-grid">
                    {[
                        { label: "Add Book", href: "/books/create", grad: "gradient-1", icon: <path d="M12 5v14M5 12h14" /> },
                        { label: "Manage Books", href: "/books/manage", grad: "gradient-4", icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></> },
                        { label: "Create User", href: "/users/create", grad: "gradient-2", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></> },
                        { label: `Pending (${stats.pendingRequests})`, href: "/borrow/pending-requests", grad: "gradient-3", badge: stats.pendingRequests > 0, icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                        { label: "Reports", href: "/dashboard/reports", grad: "gradient-4", icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> },
                        { label: `Overdue (${stats.overdueBooks})`, href: "/borrow/overdue", grad: "gradient-5", badge: stats.overdueBooks > 0, icon: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></> },
                        { label: "Manage Stock", href: "/books/manage-stock", grad: "gradient-6", icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></> },
                        { label: "Notification Center", href: "/dashboard/notification-center", grad: "gradient-2", icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
                        { label: "Analytics", href: "/dashboard/analytics", grad: "gradient-3", icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /> },
                        { label: "Activity Log", href: "/dashboard/activity-log", grad: "gradient-1", icon: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></> },
                        { label: "Bulk Import Books", href: "/books/bulk-import", grad: "gradient-4", icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></> },
                        { label: "Bulk Email Users", href: "/users/bulk-email", grad: "gradient-5", icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></> },
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

            {/* ── Main 3-col grid ───────────────────────── */}
            <div className="adm-main-grid">

                {/* User Breakdown */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" /></svg>User Breakdown</h3>
                        <Link href="/users/list" className="adm-card-link">View All</Link>
                    </div>
                    <div className="adm-card-body">
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, padding: "10px 0" }}>
                            <DonutChart slices={[
                                { label: "Students", value: stats.studentCount, color: "#10b981" },
                                { label: "Librarians", value: stats.librarianCount, color: "#0ea5e9" },
                                { label: "Admins", value: stats.adminCount, color: "#f59e0b" },
                            ]} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                                { label: "Students", val: stats.studentCount, color: "#10b981" },
                                { label: "Librarians", val: stats.librarianCount, color: "#0ea5e9" },
                                { label: "Admins", val: stats.adminCount, color: "#f59e0b" },
                            ].map(({ label, val, color }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", minWidth: 80 }}>{label}</span>
                                    <div style={{ flex: 1, padding: "0 10px" }}>
                                        <MiniBar value={val} max={stats.totalUsers} color={color} />
                                    </div>
                                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>{val}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                            <Link href="/users/list" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center", borderRadius: 8, fontWeight: 700 }}>Manage Users</Link>
                            <Link href="/users/create" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center", borderRadius: 8, fontWeight: 700 }}>Add New</Link>
                        </div>
                    </div>
                </div>

                {/* Book Stock Overview */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>Book Stock</h3>
                        <Link href="/books/manage-stock" className="adm-card-link">Manage</Link>
                    </div>
                    <div className="adm-card-body">
                        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                            {[
                                { label: "Available Copies", val: stats.availableCopies, max: stats.totalCopies, color: "#22c55e" },
                                { label: "Currently Borrowed", val: stats.activeBorrows, max: stats.totalCopies, color: "#0ea5e9" },
                                { label: "Out-of-Stock Titles", val: stats.unavailableBooks, max: stats.totalBooks, color: "#ef4444" },
                            ].map(({ label, val, max, color }) => (
                                <div key={label}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
                                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>{val}</span>
                                    </div>
                                    <MiniBar value={val} max={max || 1} color={color} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 28, background: "var(--surface-hover)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Copies</span>
                                <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--text-primary)", marginTop: 4 }}>{stats.totalCopies}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Unique</span>
                                <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--text-primary)", marginTop: 4 }}>{stats.totalBooks}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--error)", textTransform: "uppercase", letterSpacing: 0.5 }}>Fines</span>
                                <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--error)", marginTop: 4 }}>${formatCurrency(stats.unpaidFines)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Most Borrowed */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>Most Borrowed</h3>
                        <Link href="/dashboard/reports" className="adm-card-link">Full Report</Link>
                    </div>
                    <div className="adm-card-body">
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {mostBorrowed.length === 0
                                ? <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No data yet</p>
                                : mostBorrowed.map((book: any, i: number) => (
                                    <Link key={book.id} href={`/books/${book.id}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, color: "var(--text-secondary)", flexShrink: 0 }}>
                                            {i + 1}
                                        </div>
                                        <div className={`adm-borrow-cover ${GRADIENTS[i % 6]}`} style={{ width: 40, height: 56, borderRadius: 6, flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</span>
                                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.author}</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                                            <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--primary)" }}>{book.timesBorrowed}</span>
                                            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Borrows</span>
                                        </div>
                                    </Link>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Monthly Trend ────────────────────────── */}
            {monthlyBorrows && monthlyBorrows.length > 0 && (
                <div className="adm-card" style={{ marginBottom: 24 }}>
                    <div className="adm-card-header">
                        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>Borrow Trend (Last 30 Days)</h3>
                        <Link href="/dashboard/analytics" className="adm-card-link">Full Analytics</Link>
                    </div>
                    <div className="adm-card-body">
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, paddingTop: 16 }}>
                            {monthlyBorrows.map((d: any, i: number) => {
                                const max = Math.max(...monthlyBorrows.map((x: any) => x._count.id), 1);
                                const h = Math.max((d._count.id / max) * 100, 4);
                                return (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", group: "true", position: "relative" }}>
                                        <div title={`${new Date(d.borrowDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${d._count.id} borrows`}
                                            style={{ width: "100%", height: `${h}%`, background: "linear-gradient(to top, var(--primary), var(--secondary))", borderRadius: "4px 4px 0 0", cursor: "pointer", transition: "all 0.2s ease" }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; (e.currentTarget as HTMLElement).style.transform = "scaleY(1.05)"; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "scaleY(1)"; }} />
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>30 Days Ago</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>Today</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Wide row: Recent Borrows + Alerts ───── */}
            <div className="adm-wide-grid">

                {/* Recent Borrows */}
                <div className="adm-card adm-span-2">
                    <div className="adm-card-header">
                        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>Recent Borrows</h3>
                        <Link href="/borrow/all-records" className="adm-card-link">View All</Link>
                    </div>
                    <div className="adm-card-body" style={{ padding: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", padding: "12px 16px" }}>
                            {recentBorrows.length === 0
                                ? <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>No recent borrow activity</div>
                                : recentBorrows.map((r: any, i: number) => (
                                    <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: i < recentBorrows.length - 1 ? "1px solid var(--border)" : "none" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
                                            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, color: "var(--primary-dark)", flexShrink: 0 }} className={GRADIENTS[i % 6]}>
                                                {(r.user.firstName?.[0] || r.user.username[0]).toUpperCase()}
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                                                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {r.user.firstName ? `${r.user.firstName} ${r.user.lastName || ""}`.trim() : r.user.username}
                                                </span>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", background: "var(--surface)", padding: "2px 6px", borderRadius: 4 }}>{r.user.role}</span>
                                                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>borrowed</span>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.book.title}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 16 }}>
                                            <span className={`adm-status adm-status-${r.status}`} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: 20 }}>{r.status}</span>
                                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>{formatDate(r.borrowDate)}</span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>

                {/* Alerts & System Panel */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>System Panel</h3>
                    </div>
                    <div className="adm-card-body">
                        {/* Alert numbers */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {[
                                { label: "Borrow Requests", val: stats.pendingRequests, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", href: "/borrow/pending-requests" },
                                { label: "Overdue Books", val: stats.overdueBooks, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", href: "/borrow/overdue" },
                                { label: "Active Users", val: stats.activeUsers, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", href: "/users/list" },
                                { label: "Unpaid Fines", val: `ETB ${formatCurrency(stats.unpaidFines)}`, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", href: "/borrow/overdue" },
                            ].map(({ label, val, color, bg, href }) => (
                                <Link key={label} href={href} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "14px", background: bg, borderRadius: 12, border: "1px solid var(--border)", transition: "transform 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}>
                                    <span style={{ fontSize: "1.2rem", fontWeight: 900, color }}>{val}</span>
                                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>{label}</span>
                                </Link>
                            ))}
                        </div>
                        {/* System actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Operations</div>
                            
                            <button className="btn btn-secondary btn-sm" onClick={sendDueSoonReminders} disabled={sending} style={{ justifyContent: "flex-start", padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: "var(--primary)" }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" /><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>
                                Send Due-Soon Reminders
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={sendOverdueReminders} disabled={sending} style={{ justifyContent: "flex-start", padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: "var(--error)" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /></svg>
                                Send Overdue Reminders
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={recalcOverdue} style={{ justifyContent: "flex-start", padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: "var(--secondary)" }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>
                                Recalculate Overdue
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={createBackup} style={{ justifyContent: "flex-start", padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: "#0ea5e9" }}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                                Download Backup
                            </button>
                            
                            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                                <Link href="/dashboard/system" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center", borderRadius: 8, padding: "10px" }}>
                                    Administration
                                </Link>
                                <Link href="/dashboard/settings" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center", borderRadius: 8, padding: "10px" }}>
                                    Settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
