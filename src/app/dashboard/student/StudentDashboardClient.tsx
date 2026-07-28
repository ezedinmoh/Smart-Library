"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDate, getDaysRemaining } from "@/lib/utils";

const GRADIENTS = [
    "gradient-1",
    "gradient-2",
    "gradient-3",
    "gradient-4",
    "gradient-5",
    "gradient-6",
];

function getRelativeTime(dateString: string | Date) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
}

export default function StudentDashboardClient({
    borrowedBooks = [],
    borrowHistory = [],
    overdueBooks = [],
    pendingRequests = [],
    readyRequests = [],
    dueSoonBooks = [],
    recommendedBooks = [],
    activityLogs = [],
    profile,
    userInfo,
    stats,
    username,
}: any) {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [showLibraryCard, setShowLibraryCard] = useState(false);
    const [renewingId, setRenewingId] = useState<number | null>(null);
    const [renewSuccessMsg, setRenewSuccessMsg] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentDate(
            new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })
        );
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

    const handleQuickRenew = async (recordId: number) => {
        setRenewingId(recordId);
        try {
            const res = await fetch(`/api/borrow/${recordId}/renew`, {
                method: "POST",
            });
            if (res.ok) {
                setRenewSuccessMsg("Renewal request submitted successfully!");
                setTimeout(() => setRenewSuccessMsg(null), 4000);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to renew book.");
            }
        } catch {
            alert("An error occurred while renewing.");
        } finally {
            setRenewingId(null);
        }
    };

    // Synthesize activity timeline combining ActivityLog + BorrowHistory + PendingRequests
    const combinedActivities = [
        ...activityLogs.map((log: any) => ({
            id: `log-${log.id}`,
            title: log.action || "System Action",
            description: log.description || "",
            timestamp: log.createdAt,
            type: "log",
            icon: "activity",
        })),
        ...borrowedBooks.map((b: any) => ({
            id: `borrow-${b.id}`,
            title: `Currently Borrowed: "${b.book?.title || 'Book'}"`,
            description: b.status === "overdue" ? `Overdue since ${formatDate(b.dueDate)}` : `Due date: ${formatDate(b.dueDate)}`,
            timestamp: b.borrowDate,
            type: b.status === "overdue" ? "overdue" : "borrow",
            icon: "book",
        })),
        ...pendingRequests.map((r: any) => ({
            id: `req-${r.id}`,
            title: `Requested: "${r.book?.title || 'Book'}"`,
            description: "Status: Pending Librarian Approval",
            timestamp: r.requestDate,
            type: "request",
            icon: "clock",
        })),
    ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

    const maxBooks = stats?.maxLimit || 7;
    const currentBorrowedCount = stats?.currentBorrowed || borrowedBooks.length;
    const remainingSlots = Math.max(0, maxBooks - currentBorrowedCount);
    const capacityPercent = Math.min(100, Math.round((currentBorrowedCount / maxBooks) * 100));

    // Reading badge label & icon
    const totalRead = stats?.totalBooksRead || stats?.booksReturned || 0;
    let badgeTitle = "Reader Scholar";
    if (totalRead >= 20) {
        badgeTitle = "Master Bibliophile 🏆";
    } else if (totalRead >= 10) {
        badgeTitle = "Gold Bookworm 🏅";
    } else if (totalRead >= 5) {
        badgeTitle = "Silver Reader 🥈";
    }

    return (
        <div className="adm-dash" style={{ paddingTop: 20, paddingBottom: 48 }}>
            {renewSuccessMsg && (
                <div className="adm-alert-banner adm-alert-success" style={{ marginBottom: 20 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{renewSuccessMsg}</span>
                </div>
            )}

            {/* Non-overlapping Hero Banner */}
            <div className="adm-welcome" style={{ padding: "32px", position: "relative", marginBottom: 24 }}>
                <div className="adm-welcome-bg" />
                <div className="adm-welcome-content">
                    {/* Top Row: Reading Level Badge */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,0.22)", borderRadius: 20, fontSize: "0.85rem", fontWeight: 700, color: "white", backdropFilter: "blur(8px)" }}>
                            <span>{badgeTitle}</span>
                            <span style={{ opacity: 0.85 }}>• {totalRead} books completed</span>
                        </div>
                    </div>

                    {/* Middle Row: Title & Interactive Search Bar */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                            <h1 className="adm-welcome-title" style={{ fontSize: "1.95rem", fontWeight: 800, margin: "0 0 6px 0", color: "white", lineHeight: 1.2 }}>
                                Welcome back, <span>{username}</span>!
                            </h1>
                            <p className="adm-welcome-sub" style={{ fontSize: "0.95rem", opacity: 0.9, margin: 0, color: "white" }}>
                                Track your reading journey, manage loans, and discover top titles.
                            </p>
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
                                            {b.coverImage ? (
                                                <img src={b.coverImage} alt={b.title} style={{ width: 28, height: 38, borderRadius: 4, objectFit: "cover" }} />
                                            ) : (
                                                <div style={{ width: 28, height: 38, borderRadius: 4, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 700 }}>
                                                    BOOK
                                                </div>
                                            )}
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
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

                    {/* Bottom Row: Actions */}
                    <div className="adm-welcome-actions" style={{ marginTop: 24 }}>
                        <div className="adm-date-chip">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>{currentDate}</span>
                        </div>
                        <Link href="/books" className="btn btn-sm" style={{ background: "white", color: "var(--primary-dark)", fontWeight: 700, border: "none" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            Browse Catalog
                        </Link>
                        <button
                            onClick={() => setShowLibraryCard(true)}
                            className="btn btn-sm"
                            style={{ background: "rgba(255,255,255,0.18)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.35)", fontWeight: 600 }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                            Digital Pass / Card
                        </button>
                    </div>
                </div>
            </div>

            {/* Alert Banners (Redirecting to /borrow/unpaid-fines) */}
            {overdueBooks.length > 0 && (
                <div className="adm-alert-banner adm-alert-danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>
                        You have <strong>{overdueBooks.length} overdue book{overdueBooks.length > 1 ? "s" : ""}</strong>! Please return them promptly or settle fines.{" "}
                        <Link href="/borrow/unpaid-fines" style={{ textDecoration: "underline", fontWeight: 700 }}>View Overdue Books & Pay Fines →</Link>
                    </span>
                </div>
            )}
            {stats?.unpaidFines > 0 && (
                <div className="adm-alert-banner adm-alert-warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                        Outstanding fine balance: <strong>ETB {stats.unpaidFines.toFixed(2)}</strong>.{" "}
                        <Link href="/borrow/unpaid-fines" style={{ textDecoration: "underline", fontWeight: 700 }}>Pay Now →</Link>
                    </span>
                </div>
            )}
            {readyRequests.length > 0 && (
                <div className="adm-alert-banner adm-alert-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>
                        🎉 <strong>{readyRequests.length} book request{readyRequests.length > 1 ? "s" : ""} ready for pickup</strong> at the library counter!{" "}
                        <Link href="/borrow/my-books" style={{ textDecoration: "underline", fontWeight: 700 }}>View Pickup Details →</Link>
                    </span>
                </div>
            )}

            {/* KPI Cards Grid */}
            <div className="adm-kpi-grid" style={{ marginTop: 24 }}>
                {[
                    {
                        label: "Currently Borrowed",
                        value: currentBorrowedCount,
                        sub: `${remainingSlots} slots remaining of ${maxBooks}`,
                        color: "#10b981",
                        href: "/borrow/my-books",
                        gradient: "linear-gradient(135deg,#10b981,#059669)",
                        icon: (
                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        ),
                    },
                    {
                        label: "Books Returned",
                        value: stats?.booksReturned || 0,
                        sub: "Total completed loans",
                        color: "#0ea5e9",
                        href: "/borrow/history",
                        gradient: "linear-gradient(135deg,#4facfe,#00f2fe)",
                        icon: (
                            <>
                                <polyline points="9 11 12 14 22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </>
                        ),
                    },
                    {
                        label: "Due Soon / Overdue",
                        value: dueSoonBooks.length + overdueBooks.length,
                        sub: dueSoonBooks.length + overdueBooks.length > 0 ? "Requires attention" : "No urgent due dates",
                        color: dueSoonBooks.length + overdueBooks.length > 0 ? "#ef4444" : "#22c55e",
                        href: dueSoonBooks.length + overdueBooks.length > 0 ? "/borrow/unpaid-fines" : "/borrow/my-books",
                        gradient: dueSoonBooks.length + overdueBooks.length > 0 ? "linear-gradient(135deg,#fa709a,#fee140)" : "linear-gradient(135deg,#43e97b,#38f9d7)",
                        icon: (
                            <>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </>
                        ),
                    },
                    {
                        label: "Pending Requests",
                        value: pendingRequests.length,
                        sub: "Awaiting librarian review",
                        color: "#8b5cf6",
                        href: "/borrow/request-list",
                        gradient: "linear-gradient(135deg,#a18cd1,#fbc2eb)",
                        icon: <path d="M12 4v16m8-8H4" />,
                    },
                ].map(({ label, value, sub, color, href, gradient, icon }) => (
                    <Link key={label} href={href} className="adm-kpi-card">
                        <div className="adm-kpi-icon" style={{ background: gradient }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 26, height: 26 }}>
                                {icon}
                            </svg>
                        </div>
                        <div className="adm-kpi-info">
                            <div className="adm-kpi-value" style={{ color }}>
                                {value}
                            </div>
                            <div className="adm-kpi-label">{label}</div>
                            <div className="adm-kpi-sub">{sub}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Capacity Gauge & Reading Goal Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, margin: "24px 0" }}>
                {/* Borrowing Capacity Gauge */}
                <div className="adm-card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: 20, height: 20 }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M7 7h10M7 12h10M7 17h6" />
                            </svg>
                            <h4 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>Borrowing Allowance</h4>
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: capacityPercent > 80 ? "var(--warning)" : "var(--primary)" }}>
                            {currentBorrowedCount} / {maxBooks} Books
                        </span>
                    </div>

                    <div style={{ height: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", marginBottom: 8 }}>
                        <div
                            style={{
                                height: "100%",
                                width: `${capacityPercent}%`,
                                background: capacityPercent > 80 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, #10b981, #0ea5e9)",
                                borderRadius: 20,
                                transition: "width 0.5s ease",
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        <span>{remainingSlots} available slot{remainingSlots !== 1 ? "s" : ""}</span>
                        <span>{capacityPercent}% limit reached</span>
                    </div>
                </div>

                {/* Monthly Reading Goal Card */}
                <div className="adm-card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ width: 20, height: 20 }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <h4 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>This Month's Reading</h4>
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8b5cf6" }}>
                            {stats?.booksThisMonth || 0} Books Read
                        </span>
                    </div>
                    <div style={{ height: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", marginBottom: 8 }}>
                        <div
                            style={{
                                height: "100%",
                                width: `${Math.min(100, ((stats?.booksThisMonth || 0) / 4) * 100)}%`,
                                background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                                borderRadius: 20,
                                transition: "width 0.5s ease",
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        <span>Monthly Goal Target: 4 Books</span>
                        <span>{stats?.booksThisMonth >= 4 ? "🎯 Target Reached!" : `${Math.max(0, 4 - (stats?.booksThisMonth || 0))} more to reach goal`}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Section */}
            <div className="adm-section" style={{ marginBottom: 28 }}>
                <div className="adm-section-header">
                    <span className="adm-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 16 16 12 12 8" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        Quick Navigation & Actions
                    </span>
                </div>
                <div className="adm-qa-grid">
                    {[
                        { label: "Browse Catalog", href: "/books", grad: "gradient-1", icon: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></> },
                        { label: "My Loans", href: "/borrow/my-books", grad: "gradient-3", icon: <><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></> },
                        { label: "Unpaid Fines", href: "/borrow/unpaid-fines", grad: "gradient-2", icon: <><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></> },
                        { label: "My Requests", href: "/borrow/request-list", grad: "gradient-2", icon: <path d="M12 4v16m8-8H4" /> },
                        { label: "Borrow History", href: "/borrow/history", grad: "gradient-4", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                        { label: "My Profile", href: "/users/profile", grad: "gradient-5", icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
                        { label: "Due Dates Calendar", href: "/dashboard/calendar", grad: "gradient-6", icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
                        { label: "Library Card", action: () => setShowLibraryCard(true), grad: "gradient-1", icon: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></> },
                    ].map(({ label, href, action, grad, icon }: any) => {
                        const content = (
                            <>
                                <div className={`adm-qa-icon ${grad}`}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 22, height: 22 }}>{icon}</svg>
                                </div>
                                <span className="adm-qa-label">{label}</span>
                            </>
                        );
                        if (action) {
                            return (
                                <button key={label} onClick={action} className="adm-qa-card" style={{ background: "transparent", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
                                    {content}
                                </button>
                            );
                        }
                        return (
                            <Link key={label} href={href} className="adm-qa-card">
                                {content}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Currently Borrowed Books Section */}
            <div className="adm-card" style={{ marginBottom: 28 }}>
                <div className="adm-card-header">
                    <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        Active Books Borrowed ({borrowedBooks.length})
                    </h3>
                    <Link href="/borrow/my-books" className="adm-card-link">View All Loans →</Link>
                </div>
                <div className="adm-card-body">
                    {borrowedBooks.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 56, height: 56, margin: "0 auto 16px", opacity: 0.4 }}>
                                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
                            </svg>
                            <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No active book loans</p>
                            <p style={{ fontSize: "0.875rem", marginBottom: 20 }}>You have not borrowed any books yet. Explore the digital library catalog to request your next read.</p>
                            <Link href="/books" className="btn btn-primary btn-sm">
                                Explore Books Catalog
                            </Link>
                        </div>
                    ) : (
                        <div className="stu-books-grid">
                            {borrowedBooks.map((record: any, i: number) => {
                                const isOverdue = record.status === "overdue";
                                const daysLeft = getDaysRemaining(record.dueDate);
                                const isDueSoon = !isOverdue && daysLeft <= 3;

                                return (
                                    <div 
                                        key={record.id} 
                                        className={`stu-book-card${isOverdue ? " stu-book-overdue" : ""}`}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('a, button')) return;
                                            router.push(`/books/${record.book?.id}`);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className={`stu-book-cover ${GRADIENTS[i % 6]}`}>
                                            {record.book?.coverImage ? (
                                                <img src={record.book.coverImage} alt={record.book.title} />
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 44, height: 44 }}>
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                            )}
                                            <span className={`stu-book-badge ${isOverdue ? "badge-overdue" : isDueSoon ? "badge-warning" : "badge-borrowed"}`}>
                                                {isOverdue ? "⚠ Overdue" : isDueSoon ? `⚠ Due in ${daysLeft} days` : `Due ${formatDate(record.dueDate)}`}
                                            </span>
                                        </div>
                                        <div className="stu-book-info">
                                            <h4 className="stu-book-title">{record.book?.title}</h4>
                                            <p className="stu-book-author">by {record.book?.author}</p>
                                            <div style={{ marginTop: 8, marginBottom: 12 }}>
                                                {isOverdue ? (
                                                    <p className="stu-book-days" style={{ color: "var(--error)", fontWeight: 700 }}>
                                                        Action required: Overdue
                                                    </p>
                                                ) : (
                                                    <p className="stu-book-days">
                                                        {daysLeft === 0 ? "Due today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="stu-book-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                <Link href={`/books/${record.book?.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                                                    Details
                                                </Link>
                                                {record.book?.pdfFile && (
                                                    <Link href={`/books/${record.book.id}/read`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center", background: "#8b5cf6", border: "none" }}>
                                                        Read PDF
                                                    </Link>
                                                )}
                                                {!isOverdue && (
                                                    <button
                                                        onClick={() => handleQuickRenew(record.id)}
                                                        disabled={renewingId === record.id}
                                                        className="btn btn-sm"
                                                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                                                    >
                                                        {renewingId === record.id ? "Renewing..." : "Renew"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Dashboard 2-Column Section: Recent Activity Timeline & Recommended Books */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24, marginBottom: 28 }}>
                {/* Recent Activity Timeline Section */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <h3>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            Recent Library Activity
                        </h3>
                    </div>
                    <div className="adm-card-body">
                        {combinedActivities.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 42, height: 42, margin: "0 auto 12px", opacity: 0.4 }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <p style={{ fontSize: "0.9rem" }}>No recent activity records</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {combinedActivities.map((act: any) => (
                                    <div key={act.id} style={{ display: "flex", gap: 14, padding: "12px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                                        <div
                                            style={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: "50%",
                                                background: act.type === "overdue" ? "rgba(239, 68, 68, 0.15)" : act.type === "request" ? "rgba(139, 92, 246, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke={act.type === "overdue" ? "var(--error)" : act.type === "request" ? "#8b5cf6" : "var(--primary)"} strokeWidth="2" style={{ width: 18, height: 18 }}>
                                                {act.icon === "book" && <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />}
                                                {act.icon === "clock" && <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
                                                {act.icon === "activity" && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />}
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h5 style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {act.title}
                                            </h5>
                                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>{act.description}</p>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                            {getRelativeTime(act.timestamp)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommended Books Section */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <h3>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            Recommended for You
                        </h3>
                        <Link href="/books" className="adm-card-link">Browse All →</Link>
                    </div>
                    <div className="adm-card-body">
                        {recommendedBooks.length === 0 ? (
                            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>No recommendations currently available.</p>
                        ) : (
                            <div className="stu-rec-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                                {recommendedBooks.slice(0, 4).map((book: any, i: number) => {
                                    const ratingVal = book.rating ? parseFloat(book.rating.toString()).toFixed(1) : "4.5";

                                    return (
                                        <Link key={book.id} href={`/books/${book.id}`} className="stu-rec-card">
                                            <div className={`stu-rec-cover ${GRADIENTS[i % 6]}`}>
                                                {book.coverImage ? (
                                                    <img src={book.coverImage} alt={book.title} />
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 36, height: 36 }}>
                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                    </svg>
                                                )}
                                                <span className={`stu-rec-avail ${book.availableCopies > 0 ? "badge-borrowed" : "badge-overdue"}`}>
                                                    {book.availableCopies > 0 ? "Available" : "Unavailable"}
                                                </span>
                                            </div>
                                            <div className="stu-rec-info">
                                                <h4 className="stu-rec-title">{book.title}</h4>
                                                <p className="stu-rec-author">{book.author}</p>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                                                    <span className="stu-rec-cat">{book.category?.name || "General"}</span>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.78rem", fontWeight: 700, color: "#f59e0b" }}>
                                                        <svg viewBox="0 0 24 24" fill="#f59e0b" style={{ width: 13, height: 13 }}>
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                        </svg>
                                                        <span>{ratingVal}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Digital Library Card Modal */}
            {showLibraryCard && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.65)",
                        backdropFilter: "blur(6px)",
                        zIndex: 2000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                    }}
                    onClick={() => setShowLibraryCard(false)}
                >
                    <div
                        style={{
                            background: "linear-gradient(135deg, #0f172a, #1e293b)",
                            color: "white",
                            width: "100%",
                            maxWidth: 480,
                            borderRadius: 24,
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                            padding: 28,
                            position: "relative",
                            overflow: "hidden",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(0,0,0,0) 70%)", borderRadius: "50%" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #10b981, #0ea5e9)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 20, height: 20 }}>
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 800, fontSize: "1.1rem", margin: 0, color: "white" }}>SMART LIBRARY</h3>
                                    <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Digital Library Pass</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowLibraryCard(false)}
                                style={{ background: "rgba(255, 255, 255, 0.1)", border: "none", color: "white", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 16, padding: 20, marginBottom: 20, position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <div>
                                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Cardholder Name</span>
                                    <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "white" }}>{username}</span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Status</span>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", padding: "2px 8px", borderRadius: 10, display: "inline-block" }}>
                                        ACTIVE STUDENT
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: 14 }}>
                                <div>
                                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block" }}>Member ID</span>
                                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0" }}>#{userInfo?.id ? String(userInfo.id).padStart(5, '0') : "10042"}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block" }}>Max Book Limit</span>
                                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0" }}>{maxBooks} Books</span>
                                </div>
                            </div>

                            <div style={{ background: "white", padding: "10px 16px", borderRadius: 8, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: 3, height: 36, alignItems: "center", marginBottom: 4 }}>
                                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2].map((w, idx) => (
                                        <div key={idx} style={{ width: w * 1.5, height: "100%", background: "#0f172a" }} />
                                    ))}
                                </div>
                                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#334155", letterSpacing: 2, fontWeight: 700 }}>
                                    LIB-STU-{userInfo?.id || "10042"}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
                            <button
                                onClick={() => window.print()}
                                className="btn btn-sm"
                                style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
                            >
                                Print Pass
                            </button>
                            <button
                                onClick={() => setShowLibraryCard(false)}
                                className="btn btn-sm"
                                style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", fontWeight: 700 }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
