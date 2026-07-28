"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "@/components/ui/ToastNotifications";

const GRADIENTS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

export default function RequestListClient({
    books = [],
    total = 0,
    page = 1,
    pageSize = 30,
    categories = [],
    searchParams = {},
    alreadyRequested = new Set(),
    alreadyBorrowed = new Set(),
    currentBorrowed = 0,
    pendingCount = 0,
    maxLimit = 7,
    canRequestMore = true
}: any) {
    const router = useRouter();
    const pathname = usePathname();
    const [, start] = useTransition();
    const [searchInput, setSearchInput] = useState(searchParams.search ?? "");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const totalPages = Math.ceil(total / pageSize);
    const requestedSet = alreadyRequested instanceof Set ? alreadyRequested : new Set(alreadyRequested);
    const borrowedSet = alreadyBorrowed instanceof Set ? alreadyBorrowed : new Set(alreadyBorrowed);

    function updateSearch(params: Record<string, string>) {
        const sp = new URLSearchParams(searchParams);
        Object.entries(params).forEach(([k, v]) => {
            if (v) sp.set(k, v);
            else sp.delete(k);
        });
        sp.delete("page");
        start(() => router.push(`${pathname}?${sp.toString()}`));
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        updateSearch({ search: searchInput });
    }

    function getPageUrl(targetPage: number) {
        const sp = new URLSearchParams(searchParams);
        sp.set("page", String(targetPage));
        return `${pathname}?${sp.toString()}`;
    }

    async function requestBook(bookId: number, bookTitle: string) {
        const res = await fetch("/api/borrow/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookId })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`Borrow request for "${bookTitle}" submitted successfully!`, "success");
            router.refresh();
        } else {
            showToast(data.error || "Failed to submit borrow request.", "error");
        }
    }

    const availableSlots = Math.max(0, maxLimit - (currentBorrowed + pendingCount));
    const usedSlots = currentBorrowed + pendingCount;
    const usagePercent = Math.min(100, Math.round((usedSlots / maxLimit) * 100));

    return (
        <div className="page-content" style={{ paddingTop: 140 }}>
            <div className="container">

                {/* Back to Home & Links */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== "undefined" && window.history.length > 1) {
                                router.back();
                            } else {
                                router.push("/books");
                            }
                        }}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            padding: "8px 18px",
                            borderRadius: 9999,
                            color: "var(--text-primary)",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "var(--primary)" }}>
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Catalog
                    </button>

                    <Link href="/borrow/my-books" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}>
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        View My Books ({currentBorrowed})
                    </Link>
                </div>

                {/* Page Header */}
                <div className="page-header" style={{ marginBottom: 32 }}>
                    <div className="page-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        <h1>Browse &amp; <span className="gradient-text">Request Books</span></h1>
                    </div>
                    <p className="page-description">Search our library catalog and request books to borrow</p>
                </div>

                {/* Status Card & Slot Meter */}
                <div className="status-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 32 }}>
                    <div className="status-header" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                        <div className="status-icon" style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: canRequestMore ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke={canRequestMore ? "#10b981" : "#ef4444"} strokeWidth="2" style={{ width: 24, height: 24 }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="status-title" style={{ flex: 1 }}>
                            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>
                                Borrowing Allowance &amp; Status
                            </h3>
                            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                                {canRequestMore ? `You have ${availableSlots} available request slot(s) remaining.` : "You have reached your maximum borrowing allowance limit."}
                            </p>
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, padding: "6px 14px", borderRadius: 9999, background: canRequestMore ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: canRequestMore ? "#10b981" : "#ef4444" }}>
                            {availableSlots} Slot(s) Left
                        </span>
                    </div>

                    {/* Slot Progress Meter */}
                    <div style={{ background: "var(--background)", borderRadius: "var(--radius)", padding: 16, border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.875rem" }}>
                            <span style={{ color: "var(--text-secondary)" }}>Used Slots (Borrowed + Pending Requests):</span>
                            <span style={{ fontWeight: 600 }}>{usedSlots} of {maxLimit}</span>
                        </div>
                        <div style={{ width: "100%", height: 8, background: "var(--border)", borderRadius: 9999, overflow: "hidden" }}>
                            <div style={{ width: `${usagePercent}%`, height: "100%", background: canRequestMore ? "linear-gradient(90deg, #10b981, #0ea9d2)" : "#ef4444", borderRadius: 9999 }} />
                        </div>
                    </div>
                </div>

                {/* Search & Filter Section */}
                <div className="search-filter-section" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 32 }}>
                    <form onSubmit={handleSearchSubmit}>
                        <div className="search-container" style={{ marginBottom: 20 }}>
                            <div className="search-box" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "var(--background)", border: "2px solid var(--border)", borderRadius: 9999 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "var(--text-muted)" }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by title, author, ISBN, or genre..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: "1rem", color: "var(--text-primary)" }}
                                />
                                <button type="submit" className="search-btn" style={{ padding: "8px 20px", background: "var(--primary)", color: "white", border: "none", borderRadius: 9999, fontWeight: 600, cursor: "pointer" }}>
                                    Search
                                </button>
                            </div>
                        </div>

                        <div className="filter-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                            <div className="filter-group">
                                <label className="filter-label" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>Category</label>
                                <select
                                    className="filter-select"
                                    value={searchParams.category ?? ""}
                                    onChange={(e) => updateSearch({ category: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontSize: "0.875rem" }}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>Availability</label>
                                <select
                                    className="filter-select"
                                    value={searchParams.availability ?? ""}
                                    onChange={(e) => updateSearch({ availability: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontSize: "0.875rem" }}
                                >
                                    <option value="">All Books</option>
                                    <option value="available">Available Only</option>
                                </select>
                            </div>

                            {(searchParams.search || searchParams.category || searchParams.availability) && (
                                <div style={{ display: "flex", alignItems: "flex-end" }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => { setSearchInput(""); router.push(pathname); }}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Results Info & View Toggle */}
                <div className="results-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.938rem" }}>
                        Showing <strong style={{ color: "var(--text-primary)" }}>{books.length}</strong> of <strong style={{ color: "var(--text-primary)" }}>{total}</strong> book(s)
                    </p>

                    <div className="view-toggle">
                        <button type="button" className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Grid View">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                        </button>
                        <button type="button" className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="List View">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                        </button>
                    </div>
                </div>

                {/* Books Catalog Grid / List */}
                {books.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        <h3>No Books Match Your Search</h3>
                        <p>Try searching for a different title, author, or reset your filters.</p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => { setSearchInput(""); router.push(pathname); }}
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === "grid" ? "books-catalog-grid" : "books-catalog-list"}>
                        {books.map((book: any, i: number) => {
                            const isBorrowed = borrowedSet.has(book.id);
                            const isRequested = requestedSet.has(book.id);
                            const canReq = canRequestMore && !isBorrowed && !isRequested;

                            return (
                                <div key={book.id} className="book-catalog-card">
                                    <div className={`book-catalog-cover ${GRADIENTS[i % 6]}`}>
                                        {book.coverImage ? (
                                            <img src={book.coverImage} alt={book.title} className="book-cover-image" />
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 64, height: 64, opacity: 0.5, margin: "auto" }}>
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        )}
                                        <div className={`book-badge ${isBorrowed ? "badge-borrowed" : isRequested ? "badge-requested" : book.availableCopies > 0 ? "badge-available" : "badge-unavailable"}`}>
                                            {isBorrowed ? "Borrowed" : isRequested ? "Requested" : book.availableCopies > 0 ? `${book.availableCopies} available` : "Unavailable"}
                                        </div>
                                    </div>

                                    <div className="book-catalog-info">
                                        {book.category && (
                                            <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600, display: "block", marginBottom: 4 }}>
                                                {book.category.name}
                                            </span>
                                        )}
                                        <h3 className="book-title">{book.title}</h3>
                                        <p className="book-author">by {book.author}</p>

                                        <div className="book-actions">
                                            <Link href={`/books/${book.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none", justifyContent: "center" }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                View Details
                                            </Link>

                                            {isBorrowed ? (
                                                <span style={{ fontSize: "0.813rem", color: "#10b981", fontWeight: 700, textAlign: "center", padding: "6px 0", display: "block" }}>
                                                    ✓ Currently Borrowed
                                                </span>
                                            ) : isRequested ? (
                                                <span style={{ fontSize: "0.813rem", color: "#f59e0b", fontWeight: 700, textAlign: "center", padding: "6px 0", display: "block" }}>
                                                    ⏳ Request Pending
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${canReq ? "btn-primary" : "btn-secondary"}`}
                                                    style={{ width: "100%", justifyContent: "center" }}
                                                    disabled={!canReq}
                                                    onClick={() => requestBook(book.id, book.title)}
                                                >
                                                    {!canRequestMore ? "Limit Reached" : book.availableCopies > 0 ? "Request Book" : "Join Waitlist"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination" style={{ marginTop: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
                        {page > 1 && (
                            <Link href={getPageUrl(page - 1)} className="pagination-btn" style={{ textDecoration: "none" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                                Previous
                            </Link>
                        )}
                        <span className="pagination-info">Page {page} of {totalPages}</span>
                        {page < totalPages && (
                            <Link href={getPageUrl(page + 1)} className="pagination-btn" style={{ textDecoration: "none" }}>
                                Next
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </Link>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
