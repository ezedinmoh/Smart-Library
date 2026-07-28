"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useTransition } from "react";
import BookCoverImage from "@/components/BookCoverImage";
import type { SessionUser } from "@/types";

const GRADIENTS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];
const LANGUAGES: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    es: "Spanish",
    fr: "French",
    de: "German",
    other: "Other"
};

export default function BooksListClient({
    books,
    total,
    totalAllBooks,
    availableAllBooks,
    page,
    pageSize,
    categories,
    searchParams
}: any) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user as SessionUser | undefined;
    const [, startTransition] = useTransition();

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchInput, setSearchInput] = useState(searchParams.search ?? "");

    // Load saved view preference from localStorage on mount
    useEffect(() => {
        const savedView = localStorage.getItem("bookViewPreference") as "grid" | "list" | null;
        if (savedView === "list" || savedView === "grid") {
            setViewMode(savedView);
        }
    }, []);

    function toggleViewMode(mode: "grid" | "list") {
        setViewMode(mode);
        localStorage.setItem("bookViewPreference", mode);
    }

    const totalPages = Math.ceil(total / pageSize);

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        updateSearch({ search: searchInput });
    }

    function updateSearch(params: Record<string, string>) {
        const sp = new URLSearchParams();
        if (searchParams.search) sp.set("search", searchParams.search);
        if (searchParams.category) sp.set("category", searchParams.category);
        if (searchParams.language) sp.set("language", searchParams.language);
        if (searchParams.availability) sp.set("availability", searchParams.availability);

        Object.entries(params).forEach(([k, v]) => {
            if (v) sp.set(k, v);
            else sp.delete(k);
        });
        sp.delete("page");
        startTransition(() => router.push(`${pathname}?${sp.toString()}`));
    }

    function getPageUrl(targetPage: number) {
        const sp = new URLSearchParams();
        if (searchParams.search) sp.set("search", searchParams.search);
        if (searchParams.category) sp.set("category", searchParams.category);
        if (searchParams.language) sp.set("language", searchParams.language);
        if (searchParams.availability) sp.set("availability", searchParams.availability);
        sp.set("page", String(targetPage));
        return `${pathname}?${sp.toString()}`;
    }

    function handleClearFilters() {
        setSearchInput("");
        startTransition(() => router.push(pathname));
    }

    return (
        <main className="catalog-main">
            <div className="container">

                {/* Back to Home Button — Exactly matches Django's .back-to-home-catalog */}
                <div className="back-to-home-catalog">
                    <Link href="/">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </Link>
                </div>

                {/* Page Header — Matches Django HTML structure */}
                <div className="catalog-header">
                    <div className="catalog-title">
                        <h1>
                            Book <span className="gradient-text">Catalog</span>
                        </h1>
                        <p>Explore our comprehensive collection of books</p>

                        {(user?.role === "admin" || user?.role === "librarian") && (
                            <Link href="/books/create" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Book
                            </Link>
                        )}
                    </div>

                    {/* Catalog Stats Cards */}
                    <div className="catalog-stats">
                        <div className="stat-item">
                            <span className="stat-value">{totalAllBooks ?? total}</span>
                            <span className="stat-label">Total Books</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{books.length}</span>
                            <span className="stat-label">On This Page</span>
                        </div>
                    </div>
                </div>

                {/* Advanced Search & Filters — Matches Django HTML structure */}
                <div className="search-filters-section">
                    <form onSubmit={handleSearchSubmit}>
                        <div className="search-container">
                            <div className="advanced-search-box">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    name="search"
                                    id="searchInput"
                                    placeholder="Search by title, author, ISBN, or keyword..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <button type="submit" className="search-btn">
                                    Search
                                </button>
                            </div>
                        </div>

                        <div className="filters-container">
                            <div className="filter-group">
                                <label htmlFor="categoryFilter">Category</label>
                                <select
                                    name="category"
                                    id="categoryFilter"
                                    value={searchParams.category ?? ""}
                                    onChange={(e) => updateSearch({ category: e.target.value })}
                                >
                                    <option value="">All Categories</option>
                                    {categories?.map((category: any) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label htmlFor="availabilityFilter">Availability</label>
                                <select
                                    name="availability"
                                    id="availabilityFilter"
                                    value={searchParams.availability ?? ""}
                                    onChange={(e) => updateSearch({ availability: e.target.value })}
                                >
                                    <option value="">All Books</option>
                                    <option value="available">Available Only</option>
                                    <option value="unavailable">Unavailable Only</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label htmlFor="languageFilter">Language</label>
                                <select
                                    name="language"
                                    id="languageFilter"
                                    value={searchParams.language ?? ""}
                                    onChange={(e) => updateSearch({ language: e.target.value })}
                                >
                                    <option value="">All Languages</option>
                                    {Object.entries(LANGUAGES).map(([code, name]) => (
                                        <option key={code} value={code}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(searchParams.search || searchParams.category || searchParams.language || searchParams.availability) && (
                                <button type="button" className="clear-filters-btn" onClick={handleClearFilters}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Results Info & View Toggle Bar */}
                <div className="results-info">
                    <p>
                        <span id="resultsCount">{total}</span> book{total !== 1 ? "s" : ""} found
                    </p>

                    <div className="view-toggle">
                        <button
                            type="button"
                            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                            id="gridViewBtn"
                            title="Grid View"
                            onClick={() => toggleViewMode("grid")}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                            id="listViewBtn"
                            title="List View"
                            onClick={() => toggleViewMode("list")}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="8" y1="6" x2="21" y2="6" />
                                <line x1="8" y1="12" x2="21" y2="12" />
                                <line x1="8" y1="18" x2="21" y2="18" />
                                <line x1="3" y1="6" x2="3.01" y2="6" />
                                <line x1="3" y1="12" x2="3.01" y2="12" />
                                <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Books Display */}
                {books.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h3>No Books Found</h3>
                        <p>Try adjusting your search filters or <button type="button" onClick={handleClearFilters} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, cursor: "pointer", padding: 0 }}>clear all filters</button></p>
                        {(user?.role === "librarian" || user?.role === "admin") && (
                            <Link href="/books/create" className="btn btn-primary">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 4v16m8-8H4" />
                                </svg>
                                Add First Book
                            </Link>
                        )}
                    </div>
                ) : viewMode === "grid" ? (

                    /* ── GRID VIEW ── */
                    <div className="books-catalog-grid" id="booksGrid">
                        {books.map((book: any, i: number) => (
                            <div
                                key={book.id}
                                className="book-catalog-card"
                                onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('a, button')) return;
                                    router.push(`/books/${book.id}`);
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <div className={`book-catalog-cover ${GRADIENTS[i % 6]}`}>
                                    <BookCoverImage
                                        src={book.coverImage}
                                        alt={book.title}
                                        className="book-cover-image"
                                        fallback={
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 60, height: 60, opacity: 0.5 }}>
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        }
                                    />

                                    {/* Availability Badge */}
                                    <span className={`book-badge ${book.availableCopies > 0 ? "available" : "borrowed"}`}>
                                        {book.availableCopies > 0 ? "Available" : "Unavailable"}
                                    </span>

                                    {/* Quick View Hover Button */}
                                    <div className="book-actions">
                                        <Link href={`/books/${book.id}`} className="book-action-btn" title="Quick View">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>

                                <div className="book-catalog-info">
                                    <h3 className="book-title">{book.title}</h3>
                                    <p className="book-author">{book.author}</p>
                                    <p className="book-category">{book.category?.name ?? "Uncategorized"}</p>
                                    <p className="book-isbn">ISBN: {book.isbn || "N/A"}</p>

                                    {/* Rating */}
                                    <div className="book-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg key={star} viewBox="0 0 24 24" fill={star <= Math.round(book.rating || 0) ? "#fbbf24" : "none"} stroke={star <= Math.round(book.rating || 0) ? "#fbbf24" : "#d1d5db"}>
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        ))}
                                        <span style={{ marginLeft: 6 }}>
                                            {book.rating ? parseFloat(book.rating).toFixed(1) : "No reviews"}
                                        </span>
                                    </div>

                                    {/* Copies Availability */}
                                    <p style={{ fontSize: "0.75rem", color: book.availableCopies > 0 ? "var(--success)" : "var(--error)", fontWeight: 600, marginBottom: 10 }}>
                                        {book.availableCopies}/{book.totalCopies} copies available
                                    </p>

                                    <Link href={`/books/${book.id}`} className="btn btn-primary btn-sm" style={{ width: "100%", textDecoration: "none", justifyContent: "center" }}>
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (

                    /* ── LIST VIEW ── */
                    <div className="books-catalog-list" id="booksGrid">
                        {books.map((book: any, i: number) => (
                            <div
                                key={book.id}
                                className="book-catalog-card"
                                onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('a, button')) return;
                                    router.push(`/books/${book.id}`);
                                }}
                                style={{ display: "flex", flexDirection: "row", height: 160, cursor: "pointer" }}
                            >
                                <div className={`book-catalog-cover ${GRADIENTS[i % 6]}`} style={{ width: 120, height: 160, flexShrink: 0 }}>
                                    <BookCoverImage
                                        src={book.coverImage}
                                        alt={book.title}
                                        className="book-cover-image"
                                        fallback={
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 44, height: 44, opacity: 0.5 }}>
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        }
                                    />
                                </div>
                                <div className="book-catalog-info" style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                                        <div>
                                            <h3 className="book-title" style={{ fontSize: "1.1rem", marginBottom: 2 }}>{book.title}</h3>
                                            <p className="book-author" style={{ marginBottom: 2 }}>By {book.author}</p>
                                            <span className="book-category" style={{ fontSize: "0.8rem" }}>{book.category?.name ?? "Uncategorized"} • ISBN: {book.isbn || "N/A"}</span>
                                        </div>
                                        <span className={`book-badge ${book.availableCopies > 0 ? "available" : "borrowed"}`} style={{ position: "static" }}>
                                            {book.availableCopies > 0 ? "Available" : "Unavailable"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                        <p style={{ fontSize: "0.75rem", color: book.availableCopies > 0 ? "var(--success)" : "var(--error)", fontWeight: 600, margin: 0 }}>
                                            {book.availableCopies}/{book.totalCopies} copies available
                                        </p>
                                        <Link href={`/books/${book.id}`} className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination Controls — Matches Django HTML pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        {page > 1 && (
                            <>
                                <Link href={getPageUrl(1)} className="pagination-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="11 17 6 12 11 7" />
                                        <polyline points="18 17 13 12 18 7" />
                                    </svg>
                                    First
                                </Link>
                                <Link href={getPageUrl(page - 1)} className="pagination-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                    Previous
                                </Link>
                            </>
                        )}

                        <div className="pagination-numbers">
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                const p = totalPages <= 7 ? i + 1 : i === 0 ? 1 : i === 6 ? totalPages : page - 3 + i;
                                return (
                                    <Link
                                        key={p}
                                        href={getPageUrl(p)}
                                        className={`page-num ${p === page ? "active" : ""}`}
                                    >
                                        {p}
                                    </Link>
                                );
                            })}
                        </div>

                        {page < totalPages && (
                            <>
                                <Link href={getPageUrl(page + 1)} className="pagination-btn">
                                    Next
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </Link>
                                <Link href={getPageUrl(totalPages)} className="pagination-btn">
                                    Last
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="13 17 18 12 13 7" />
                                        <polyline points="6 17 11 12 6 7" />
                                    </svg>
                                </Link>
                            </>
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}
