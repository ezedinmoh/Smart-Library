"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, formatDateTime } from "@/lib/utils";
import BookCoverImage from "@/components/BookCoverImage";
import type { SessionUser } from "@/types";

const GRADIENTS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];
const LANG_MAP: Record<string, string> = { en: "English", hi: "Hindi", es: "Spanish", fr: "French", de: "German", am: "Amharic", other: "Other" };

const RATING_EMOJI: Record<number, string> = { 1: "😞", 2: "😕", 3: "😐", 4: "😊", 5: "🤩" };
const RATING_LABEL: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent" };

function StarRow({ rating, max = 5, size = 20, color = "#fbbf24" }: { rating: number; max?: number; size?: number; color?: string }) {
    return (
        <span style={{ display: "inline-flex", gap: 3 }}>
            {Array.from({ length: max }, (_, i) => (
                <svg key={i} viewBox="0 0 24 24" fill={i < Math.round(rating) ? color : "none"} stroke={i < Math.round(rating) ? color : "#d1d5db"} strokeWidth="2" style={{ width: size, height: size }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </span>
    );
}

export default function BookDetailClient({ book, avgRating, ratingDist, canReview, hasReviewed, hasBorrowedAndReturned, activeBorrowRecord, recommendations, user }: any) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const isStaff = user?.role === "admin" || user?.role === "librarian";
    const gradientClass = GRADIENTS[book.id % 6];

    async function handleDelete() {
        const ok = await showConfirm(`Permanently delete "${book.title}"? This cannot be undone.`, "danger");
        if (!ok) return;
        setDeleting(true);
        const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
        if (res.ok) { showToast(`"${book.title}" deleted.`, "success"); router.push("/books"); }
        else { showToast("Failed to delete book.", "error"); setDeleting(false); }
    }

    async function handleRequestBook() {
        const res = await fetch("/api/borrow/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: book.id }) });
        const data = await res.json();
        if (res.ok) { showToast(`Request for "${book.title}" submitted!`, "success"); router.refresh(); }
        else showToast(data.error || "Failed to submit request.", "error");
    }

    const isAvailable = book.availableCopies > 0;
    const isOverdue = activeBorrowRecord?.status === "overdue";

    return (
        <div className="book-detail-page">
            <div className="container">
                {/* Back link */}
                <Link href="/books" className="back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back to Catalog
                </Link>

                {/* ── Main 2-col grid ── */}
                <div className="book-detail-grid">
                    {/* ── LEFT: Cover + Actions ── */}
                    <div className="book-cover-section">
                        <div className="book-cover-card">
                            <div className={`book-cover-container${!book.coverImage ? " " + gradientClass : ""}`}>
                                <BookCoverImage
                                    src={book.coverImage}
                                    alt={book.title}
                                    fallback={
                                        <div className="book-cover-placeholder">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem", marginTop: 8 }}>No cover image</p>
                                        </div>
                                    }
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="book-actions-card">
                                {/* PDF read button */}
                                {book.pdfFile && (
                                    isStaff || activeBorrowRecord
                                        ? <Link href={`/books/${book.id}/read`} className="btn btn-info btn-full">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                            Read PDF
                                        </Link>
                                        : <button className="btn btn-info btn-full" disabled style={{ opacity: 0.5 }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                                            Borrow to Read
                                        </button>
                                )}

                                {/* Student actions */}
                                {user?.role === "student" && (
                                    activeBorrowRecord ? (
                                        <>
                                            <div className="bd-alert bd-alert-success">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                You have borrowed this book
                                            </div>
                                            <Link href="/borrow/my-books" className="btn btn-warning btn-full">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></svg>
                                                Return This Book
                                            </Link>
                                            {isOverdue && (
                                                <Link href="/borrow/unpaid-fines" className="btn btn-full" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white" }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
                                                    Pay Fine
                                                </Link>
                                            )}
                                            <div className={`bd-due-date${isOverdue ? " overdue" : ""}`}>
                                                <strong>Due:</strong> {activeBorrowRecord.dueDate ? formatDate(activeBorrowRecord.dueDate) : "—"}
                                                {isOverdue && <span> · <strong>Overdue!</strong></span>}
                                            </div>
                                        </>
                                    ) : isAvailable ? (
                                        <button className="btn btn-success btn-full" onClick={handleRequestBook}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
                                            Request This Book
                                        </button>
                                    ) : (
                                        <>
                                            <div className="bd-alert bd-alert-warning">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                All copies are currently borrowed
                                            </div>
                                            <button className="btn btn-info btn-full" onClick={handleRequestBook}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                                Join Waitlist
                                            </button>
                                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>You'll be notified when available</p>
                                        </>
                                    )
                                )}

                                {/* Staff actions */}
                                {isStaff && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                                        <Link href={`/books/${book.id}/edit`} className="btn btn-outline btn-sm" style={{ justifyContent: "center" }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            Edit
                                        </Link>
                                        {user?.role === "admin" && (
                                            <button className="btn btn-sm" style={{ border: "1px solid var(--error)", color: "var(--error)", background: "transparent", justifyContent: "center" }} onClick={handleDelete} disabled={deleting}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                {deleting ? "…" : "Delete"}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Guest */}
                                {!user && (
                                    <Link href="/users/login" className="btn btn-primary btn-full">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                                        Login to Request
                                    </Link>
                                )}

                                {/* QR Code */}
                                {book.qrCode && isStaff && (
                                    <div className="bd-qr-section">
                                        <p>Book QR Code</p>
                                        <img src={book.qrCode} alt="QR Code" />
                                        <a href={`/api/books/${book.id}/qr-code`} className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>Download QR</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Book Info ── */}
                    <div className="book-info-section">
                        {/* Header */}
                        <div className="bd-book-header">
                            <h1 className="bd-title">{book.title}</h1>
                            <p className="bd-author">by {book.author}</p>

                            <div className="bd-badges">
                                {book.category && (
                                    <Link href={`/books?category=${book.categoryId}`} className="bd-badge bd-badge-category">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                        {book.category.name}
                                    </Link>
                                )}
                                <span className={`bd-badge ${isAvailable ? "bd-badge-available" : "bd-badge-unavailable"}`}>
                                    {isAvailable
                                        ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>Available</>
                                        : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>Unavailable</>
                                    }
                                </span>
                            </div>

                            <div className="bd-rating-row">
                                <StarRow rating={avgRating} />
                                <span className="bd-rating-value">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
                                <span className="bd-rating-count">({book.reviews.length} review{book.reviews.length !== 1 ? "s" : ""})</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bd-info-card">
                            <h3>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                Description
                            </h3>
                            <p className="bd-description">{book.description || "No description available for this book."}</p>
                        </div>

                        {/* Book Details */}
                        <div className="bd-info-card">
                            <h3>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                Book Details
                            </h3>
                            <div className="bd-details-grid">
                                {[
                                    { icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>, label: "ISBN", value: book.isbn || "—" },
                                    { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>, label: "Publisher", value: book.publisher || "—" },
                                    { icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>, label: "Publication Date", value: book.publicationDate ? formatDate(book.publicationDate) : "—" },
                                    { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>, label: "Pages", value: book.pages ? book.pages.toLocaleString() : "—" },
                                    { icon: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>, label: "Language", value: LANG_MAP[book.language] ?? book.language ?? "—" },
                                    { icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>, label: "Total Copies", value: book.totalCopies },
                                    { icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>, label: "Available Copies", value: book.availableCopies },
                                    { icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />, label: "Times Borrowed", value: book.timesBorrowed },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} className="bd-detail-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                                        <div>
                                            <div className="bd-detail-label">{label}</div>
                                            <div className="bd-detail-value">{value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PDF notice */}
                        {book.pdfFile && (
                            <div className="bd-pdf-alert">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                <span>
                                    {isStaff || activeBorrowRecord
                                        ? <><Link href={`/books/${book.id}/read`}>Read Online</Link> or <a href={`/api/books/${book.id}/pdf`}>Download PDF</a></>
                                        : isAvailable
                                            ? <>PDF available. <button className="bd-link-btn" onClick={handleRequestBook}>Borrow this book</button> to read it.</>
                                            : <>PDF available once a copy is returned.</>
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Reviews Section ── */}
                <ReviewsSection
                    book={book}
                    avgRating={avgRating}
                    ratingDist={ratingDist}
                    canReview={canReview}
                    hasReviewed={hasReviewed}
                    hasBorrowedAndReturned={hasBorrowedAndReturned}
                    user={user}
                />

                {/* ── Recommendations ── */}
                {recommendations.length > 0 && (
                    <div className="bd-recommendations">
                        <div className="bd-section-header">
                            <div className="bd-section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                Similar Books
                            </div>
                        </div>
                        <div className="bd-recs-grid">
                            {recommendations.map((rec: any, i: number) => (
                                <Link key={rec.id} href={`/books/${rec.id}`} className="bd-rec-card">
                                    <div className={`bd-rec-cover ${GRADIENTS[i % 6]}`}>
                                        <BookCoverImage
                                            src={rec.coverImage}
                                            alt={rec.title}
                                            fallback={<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
                                        />
                                    </div>
                                    <div className="bd-rec-info">
                                        <div className="bd-rec-title">{rec.title}</div>
                                        <div className="bd-rec-author">{rec.author}</div>
                                        <div className="bd-rec-meta">
                                            <span className={rec.availableCopies > 0 ? "bd-rec-avail" : "bd-rec-unavail"}>{rec.availableCopies > 0 ? "Available" : "Unavailable"}</span>
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{rec.timesBorrowed}× borrowed</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Reviews Section ─────────────────────────────── */
function ReviewsSection({ book, avgRating, ratingDist, canReview, hasReviewed, hasBorrowedAndReturned, user }: any) {
    const router = useRouter();

    return (
        <div className="bd-reviews-section" id="reviews">
            <div className="bd-section-header">
                <div className="bd-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Reviews ({book.reviews.length})
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {canReview && (
                        <Link href={`/books/${book.id}/review`} className="btn btn-primary btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            Write a Review
                        </Link>
                    )}
                    {!canReview && user?.role === "student" && !hasBorrowedAndReturned && (
                        <span style={{ fontSize: "0.813rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                            Borrow &amp; return this book to write a review
                        </span>
                    )}
                </div>
            </div>

            {/* Note for students who already reviewed */}
            {hasReviewed && (
                <div className="bd-review-note">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                    You have already reviewed this book. Thank you for your feedback!
                </div>
            )}

            {book.reviews.length === 0 ? (
                <div className="bd-empty-reviews">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <h5>No Reviews Yet</h5>
                    <p>Be the first to share your thoughts on this book!</p>
                    {canReview && (
                        <Link href={`/books/${book.id}/review`} className="btn btn-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
                            Write the First Review
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    {/* Rating summary */}
                    <div className="bd-rating-summary">
                        <div className="bd-rating-summary-grid">
                            <div className="bd-overall-rating">
                                <div className="bd-overall-value">{avgRating.toFixed(1)}</div>
                                <StarRow rating={avgRating} size={24} />
                                <div className="bd-overall-count">{book.reviews.length} review{book.reviews.length !== 1 ? "s" : ""}</div>
                            </div>
                            <div className="bd-rating-dist">
                                <h6>Rating Distribution</h6>
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = ratingDist[star] ?? 0;
                                    const pct = book.reviews.length > 0 ? (count / book.reviews.length) * 100 : 0;
                                    return (
                                        <div key={star} className="bd-rating-bar-row">
                                            <span className="bd-rating-bar-label">
                                                {star} <svg viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            </span>
                                            <div className="bd-rating-bar">
                                                <div className="bd-rating-bar-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="bd-rating-bar-count">{count} review{count !== 1 ? "s" : ""}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Review cards grid */}
                    <div className="bd-reviews-grid">
                        {book.reviews.map((review: any) => (
                            <ReviewCard key={review.id} review={review} bookId={book.id} isAdmin={user?.role === "admin"} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/* ─── Single Review Card ──────────────────────────── */
function ReviewCard({ review, bookId, isAdmin }: { review: any; bookId: number; isAdmin: boolean }) {
    const router = useRouter();
    const name = [review.user.firstName, review.user.lastName].filter(Boolean).join(" ") || review.user.username;
    const initials = name.slice(0, 1).toUpperCase();
    const emoji = RATING_EMOJI[review.rating] ?? "⭐";
    const label = RATING_LABEL[review.rating] ?? "";

    async function handleDelete() {
        const ok = await showConfirm("Delete this review?", "danger");
        if (!ok) return;
        const res = await fetch(`/api/books/${bookId}/reviews/${review.id}`, { method: "DELETE" });
        if (res.ok) { showToast("Review deleted.", "success"); router.refresh(); }
        else showToast("Failed to delete review.", "error");
    }

    return (
        <div className="bd-review-card">
            <div className="bd-review-header">
                <div className="bd-reviewer-info">
                    <div className="bd-reviewer-avatar">{initials}</div>
                    <div>
                        <h5 className="bd-reviewer-name">{name}</h5>
                        <div className="bd-review-date">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {formatDate(review.createdAt)}
                        </div>
                    </div>
                </div>
                <div className="bd-rating-badge">
                    <span className="bd-rating-emoji">{emoji}</span>
                    <div className="bd-review-stars">
                        <StarRow rating={review.rating} size={14} />
                    </div>
                    <div className="bd-rating-text">{label}</div>
                </div>
            </div>

            <div className={`bd-review-text${!review.reviewText ? " no-text" : ""}`}>
                {review.reviewText || "No written review provided."}
            </div>

            <div className="bd-review-footer">
                <div className="bd-verified-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    Verified Reader
                </div>
                {isAdmin && (
                    <button className="bd-btn-delete-review" onClick={handleDelete}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
