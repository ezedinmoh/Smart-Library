"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, getDaysRemaining, getDaysOverdue } from "@/lib/utils";

type TabType = "all" | "borrowed" | "ready" | "pending" | "returned" | "rejected";

export default function MyBooksClient({
    borrowedBooks = [],
    pendingRequests = [],
    readyRequests = [],
    rejectedRequests = [],
    returnedBooks = [],
    borrowedCount = 0,
    maxLimit = 7
}: any) {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [borrowedView, setBorrowedView] = useState<"grid" | "list">("grid");
    const [readyView, setReadyView] = useState<"grid" | "list">("grid");
    const [pendingView, setPendingView] = useState<"grid" | "list">("grid");
    const [returnedView, setReturnedView] = useState<"grid" | "list">("grid");
    const [rejectedView, setRejectedView] = useState<"grid" | "list">("grid");

    const overdueBooks = borrowedBooks.filter((r: any) => r.status === "overdue" || getDaysOverdue(r.dueDate) > 0);
    const totalUnpaidFine = overdueBooks.reduce((sum: number, r: any) => {
        const days = getDaysOverdue(r.dueDate);
        const amount = r.fineAmount > 0 ? Number(r.fineAmount) : days * 10;
        return sum + (r.finePaid ? 0 : amount);
    }, 0);

    const totalItems = borrowedBooks.length + readyRequests.length + pendingRequests.length + returnedBooks.length + rejectedRequests.length;
    const usagePercent = Math.min(100, Math.round((borrowedCount / maxLimit) * 100));

    async function cancelRequest(requestId: number, bookTitle: string) {
        const ok = await showConfirm(`Cancel your request for "${bookTitle}"?`, "warning");
        if (!ok) return;
        const res = await fetch(`/api/borrow/requests/${requestId}/cancel`, { method: "POST" });
        if (res.ok) {
            showToast("Request cancelled successfully.", "success");
            router.refresh();
        } else showToast("Failed to cancel request.", "error");
    }

    async function returnBook(recordId: number, bookTitle: string) {
        const ok = await showConfirm(`Are you sure you want to return "${bookTitle}"?`, "warning");
        if (!ok) return;
        const res = await fetch(`/api/borrow/records/${recordId}/return`, { method: "POST" });
        const data = await res.json();
        if (res.ok) {
            if (data.fineAmount > 0) {
                showToast(`"${bookTitle}" returned. Fine amount: ETB ${data.fineAmount.toFixed(2)}`, "warning");
            } else {
                showToast(`"${bookTitle}" returned successfully.`, "success");
            }
            router.refresh();
        } else showToast(data.error || "Failed to return book.", "error");
    }

    async function deleteRequest(requestId: number) {
        const res = await fetch(`/api/borrow/requests/${requestId}`, { method: "DELETE" });
        if (res.ok) {
            showToast("Request record cleared.", "success");
            router.refresh();
        } else showToast("Failed to delete request.", "error");
    }

    async function clearAllRejected() {
        const ok = await showConfirm("Are you sure you want to clear all rejected request records?", "warning");
        if (!ok) return;
        const res = await fetch("/api/borrow/requests/clear-rejected", { method: "POST" });
        if (res.ok) {
            showToast("All rejected request records cleared.", "success");
            router.refresh();
        } else showToast("Failed to clear records.", "error");
    }

    async function requestAgain(bookId: number, bookTitle: string) {
        const res = await fetch("/api/borrow/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookId })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`Borrow request for "${bookTitle}" submitted!`, "success");
            router.refresh();
        } else {
            showToast(data.error || "Failed to request book.", "error");
        }
    }

    const showBorrowed = activeTab === "all" || activeTab === "borrowed";
    const showReady = activeTab === "all" || activeTab === "ready";
    const showPending = activeTab === "all" || activeTab === "pending";
    const showReturned = activeTab === "all" || activeTab === "returned";
    const showRejected = activeTab === "all" || activeTab === "rejected";

    return (
        <div className="page-content" style={{ paddingTop: 140 }}>
            <div className="container">

                {/* Back Link */}
                <div className="back-to-home-catalog" style={{ marginBottom: 24 }}>
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
                </div>

                {/* Page Header */}
                <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
                    <div>
                        <div className="page-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <h1>My Books <span className="gradient-text">&amp; Requests</span></h1>
                        </div>
                        <p className="page-description">Manage your active loans, track pending requests, and view reading history</p>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link href="/borrow/request-list" className="btn btn-primary" style={{ textDecoration: "none" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 6 }}>
                                <path d="M12 4v16m8-8H4" />
                            </svg>
                            Request New Book
                        </Link>
                        <Link href="/borrow/history" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 6 }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Full History
                        </Link>
                    </div>
                </div>

                {/* Allowance Widget */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 32 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                        <div>
                            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>Borrowing Allowance</span>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2px 0 0", color: "var(--text-primary)" }}>
                                {borrowedCount} of {maxLimit} Books Borrowed
                            </h3>
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, padding: "6px 14px", borderRadius: 9999, background: usagePercent >= 100 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)", color: usagePercent >= 100 ? "#ef4444" : "#10b981" }}>
                            {maxLimit - borrowedCount} Slot(s) Available
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: "100%", height: 10, background: "var(--border)", borderRadius: 9999, overflow: "hidden" }}>
                        <div style={{ width: `${usagePercent}%`, height: "100%", background: usagePercent >= 100 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, #10b981, #0ea9d2)", borderRadius: 9999, transition: "width 0.5s ease" }} />
                    </div>
                </div>

                {/* Summary Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: 32 }}>
                    <div className="stat-card" onClick={() => setActiveTab("borrowed")} style={{ cursor: "pointer" }}>
                        <div className="stat-icon gradient-1">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{borrowedCount}/{maxLimit}</span>
                            <span className="stat-label">Currently Borrowed</span>
                        </div>
                    </div>

                    <div className="stat-card" onClick={() => setActiveTab("pending")} style={{ cursor: "pointer" }}>
                        <div className="stat-icon gradient-5">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{pendingRequests.length}</span>
                            <span className="stat-label">Pending Requests</span>
                        </div>
                    </div>

                    <div className="stat-card" onClick={() => setActiveTab("returned")} style={{ cursor: "pointer" }}>
                        <div className="stat-icon gradient-3">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{returnedBooks.length}</span>
                            <span className="stat-label">Recently Returned</span>
                        </div>
                    </div>

                    <div className="stat-card" onClick={() => setActiveTab("rejected")} style={{ cursor: "pointer" }}>
                        <div className="stat-icon gradient-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{rejectedRequests.length}</span>
                            <span className="stat-label">Recently Rejected</span>
                        </div>
                    </div>
                </div>

                {/* Overdue Fines Alert Banner */}
                {overdueBooks.length > 0 && (
                    <div className="alert-box alert-danger" style={{ marginBottom: 32, padding: 20, borderRadius: "var(--radius-lg)", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 24, height: 24, flexShrink: 0, marginTop: 2 }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <div>
                                <strong style={{ color: "#ef4444", fontSize: "1rem" }}>Overdue Books & Fines Notice</strong>
                                <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                    You have {overdueBooks.length} overdue book(s) with total fine of <strong style={{ color: "var(--text-primary)" }}>ETB {totalUnpaidFine.toFixed(2)}</strong>. Please return the books or settle fines.
                                </p>
                            </div>
                        </div>
                        <Link href="/borrow/unpaid-fines" className="btn btn-primary btn-sm" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", textDecoration: "none", whiteSpace: "nowrap" }}>
                            Pay Fines ({overdueBooks.length})
                        </Link>
                    </div>
                )}

                {/* Section Filter Tabs */}
                <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
                    {[
                        { id: "all", label: "All Items", count: totalItems },
                        { id: "borrowed", label: "Currently Borrowed", count: borrowedCount },
                        { id: "ready", label: "Ready for Pickup", count: readyRequests.length },
                        { id: "pending", label: "Pending Requests", count: pendingRequests.length },
                        { id: "returned", label: "Returned Books", count: returnedBooks.length },
                        { id: "rejected", label: "Rejected Requests", count: rejectedRequests.length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as TabType)}
                            style={{
                                padding: "10px 18px",
                                border: "none",
                                background: "none",
                                borderBottom: activeTab === tab.id ? "3px solid var(--primary)" : "3px solid transparent",
                                color: activeTab === tab.id ? "var(--primary)" : "var(--text-secondary)",
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                transition: "all 0.2s ease"
                            }}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span style={{
                                    fontSize: "0.75rem",
                                    padding: "2px 8px",
                                    borderRadius: 9999,
                                    background: activeTab === tab.id ? "var(--primary)" : "var(--surface)",
                                    color: activeTab === tab.id ? "white" : "var(--text-secondary)",
                                    fontWeight: 600
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── 1. APPROVED / READY FOR PICKUP ── */}
                {showReady && readyRequests.length > 0 && (
                    <div className="section-card success-border">
                        <div className="section-header">
                            <div className="section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                <h2>Ready for Pickup (Approved)</h2>
                                <span className="section-badge" style={{ background: "#22c55e" }}>{readyRequests.length}</span>
                            </div>
                            <div className="view-toggle">
                                <button type="button" className={`view-btn ${readyView === "grid" ? "active" : ""}`} onClick={() => setReadyView("grid")} title="Grid View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></button>
                                <button type="button" className={`view-btn ${readyView === "list" ? "active" : ""}`} onClick={() => setReadyView("list")} title="List View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></button>
                            </div>
                        </div>

                        <div className={readyView === "grid" ? "books-grid" : "books-list"}>
                            {readyRequests.map((req: any) => (
                                <div key={req.id} className="book-card">
                                    <div className="book-cover">
                                        {req.book.coverImage ? <img src={req.book.coverImage} alt={req.book.title} /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 80, height: 80, color: "var(--text-muted)", margin: "auto" }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
                                        <div className="book-status-badge badge-ready">Ready</div>
                                    </div>
                                    <div className="book-info">
                                        <div className="book-details">
                                            <h3 className="book-title">{req.book.title}</h3>
                                            <p className="book-author">by {req.book.author}</p>
                                            <div className="book-meta">
                                                <div className="meta-item"><span className="meta-label">Approved:</span><span className="meta-value success">{formatDate(req.updatedAt)}</span></div>
                                                <div className="meta-item"><span className="meta-label">Status:</span><span className="meta-value success">Approved — Visit Front Desk</span></div>
                                            </div>
                                        </div>
                                        <div className="book-actions">
                                            <Link href={`/books/${req.book.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>View Details</Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 2. CURRENTLY BORROWED BOOKS ── */}
                {showBorrowed && (
                    <div className="section-card">
                        <div className="section-header">
                            <div className="section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <h2>Currently Borrowed</h2>
                                <span className="section-badge">{borrowedCount}</span>
                            </div>
                            <div className="section-controls">
                                <div className="view-toggle">
                                    <button type="button" className={`view-btn ${borrowedView === "grid" ? "active" : ""}`} onClick={() => setBorrowedView("grid")} title="Grid View">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                    </button>
                                    <button type="button" className={`view-btn ${borrowedView === "list" ? "active" : ""}`} onClick={() => setBorrowedView("list")} title="List View">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {borrowedBooks.length === 0 ? (
                            <div className="empty-state">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>
                                <h3>No Borrowed Books</h3>
                                <p>You don't have any borrowed books at the moment</p>
                                <Link href="/borrow/request-list" className="btn btn-primary" style={{ textDecoration: "none" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
                                    Request a Book
                                </Link>
                            </div>
                        ) : (
                            <div className={borrowedView === "grid" ? "books-grid" : "books-list"}>
                                {borrowedBooks.map((record: any) => {
                                    const daysOver = getDaysOverdue(record.dueDate);
                                    const daysLeft = getDaysRemaining(record.dueDate);
                                    const isOverdue = record.status === "overdue" || daysOver > 0;
                                    const fineVal = record.fineAmount > 0 ? Number(record.fineAmount) : daysOver * 10;

                                    return (
                                        <div 
                                            key={record.id} 
                                            className={`book-card ${isOverdue ? "overdue" : ""}`}
                                            onClick={(e) => {
                                                if ((e.target as HTMLElement).closest('a, button')) return;
                                                router.push(`/books/${record.book.id}`);
                                            }}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="book-cover">
                                                {isOverdue && fineVal > 0 && !record.finePaid && (
                                                    <Link href={`/payments/select-method/${record.id}`} className="pay-fine-badge" title={`Click to pay fine (ETB ${fineVal.toFixed(0)})`}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
                                                        Pay Fine
                                                    </Link>
                                                )}

                                                {record.book.coverImage ? (
                                                    <img src={record.book.coverImage} alt={record.book.title} />
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 80, height: 80, color: "var(--text-muted)", margin: "auto" }}>
                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                    </svg>
                                                )}

                                                <div className={`book-status-badge ${isOverdue ? "badge-overdue" : "badge-borrowed"}`}>
                                                    {isOverdue ? "Overdue" : "Borrowed"}
                                                </div>
                                            </div>

                                            <div className="book-info">
                                                <div className="book-details">
                                                    <h3 className="book-title">{record.book.title}</h3>
                                                    <p className="book-author">by {record.book.author}</p>

                                                    <div className="book-meta">
                                                        <div className="meta-item">
                                                            <span className="meta-label">Borrowed:</span>
                                                            <span className="meta-value">{formatDate(record.borrowDate)}</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <span className="meta-label">Due Date:</span>
                                                            <span className={`meta-value ${isOverdue ? "overdue" : ""}`}>
                                                                {formatDate(record.dueDate)}
                                                            </span>
                                                        </div>
                                                        {!isOverdue && (
                                                            <div className="meta-item">
                                                                <span className="meta-label">Time Left:</span>
                                                                <span className="meta-value">{daysLeft > 0 ? `${daysLeft} days` : "Due today"}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="book-actions">
                                                    <Link href={`/books/${record.book.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                        View Details
                                                    </Link>
                                                    {record.book.pdfFile && (
                                                        <Link href={`/books/${record.book.id}/read`} className="btn btn-primary btn-sm" style={{ textDecoration: "none", background: "#8b5cf6", border: "none" }}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                                            Read PDF
                                                        </Link>
                                                    )}
                                                    <button type="button" className="btn btn-outline btn-sm" onClick={() => returnBook(record.id, record.book.title)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></svg>
                                                        Return Book
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 3. PENDING REQUESTS ── */}
                {showPending && (
                    <div className="section-card warning-border">
                        <div className="section-header">
                            <div className="section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <h2>Pending Requests</h2>
                                <span className="section-badge" style={{ background: "#f59e0b" }}>{pendingRequests.length}</span>
                            </div>
                            <div className="section-controls">
                                <div className="view-toggle">
                                    <button type="button" className={`view-btn ${pendingView === "grid" ? "active" : ""}`} onClick={() => setPendingView("grid")} title="Grid View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></button>
                                    <button type="button" className={`view-btn ${pendingView === "list" ? "active" : ""}`} onClick={() => setPendingView("list")} title="List View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></button>
                                </div>
                            </div>
                        </div>

                        {pendingRequests.length === 0 ? (
                            <div className="empty-state">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <h3>No Pending Requests</h3>
                                <p>You have no borrow requests currently awaiting approval.</p>
                            </div>
                        ) : (
                            <div className={pendingView === "grid" ? "books-grid" : "books-list"}>
                                {pendingRequests.map((req: any) => (
                                    <div 
                                        key={req.id} 
                                        className="book-card"
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('a, button')) return;
                                            router.push(`/books/${req.book.id}`);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className="book-cover">
                                            {req.book.coverImage ? <img src={req.book.coverImage} alt={req.book.title} /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 80, height: 80, color: "var(--text-muted)", margin: "auto" }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
                                            <div className="book-status-badge badge-pending">Pending</div>
                                        </div>
                                        <div className="book-info">
                                            <div className="book-details">
                                                <h3 className="book-title">{req.book.title}</h3>
                                                <p className="book-author">by {req.book.author}</p>
                                                <div className="book-meta">
                                                    <div className="meta-item"><span className="meta-label">Requested:</span><span className="meta-value">{formatDate(req.requestDate)}</span></div>
                                                    <div className="meta-item"><span className="meta-label">Status:</span><span className="meta-value" style={{ color: "#f59e0b" }}>Awaiting Librarian Approval</span></div>
                                                </div>
                                            </div>
                                            <div className="book-actions">
                                                <Link href={`/books/${req.book.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>View Details</Link>
                                                <button type="button" className="btn btn-outline btn-sm" onClick={() => cancelRequest(req.id, req.book.title)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>Cancel Request
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 4. RETURNED BOOKS ── */}
                {showReturned && (
                    <div className="section-card success-border">
                        <div className="section-header">
                            <div className="section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                <h2>Returned Books</h2>
                                <span className="section-badge">{returnedBooks.length}</span>
                            </div>
                            <div className="section-controls">
                                <div className="view-toggle">
                                    <button type="button" className={`view-btn ${returnedView === "grid" ? "active" : ""}`} onClick={() => setReturnedView("grid")} title="Grid View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></button>
                                    <button type="button" className={`view-btn ${returnedView === "list" ? "active" : ""}`} onClick={() => setReturnedView("list")} title="List View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></button>
                                </div>
                            </div>
                        </div>

                        {returnedBooks.length === 0 ? (
                            <div className="empty-state">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                <h3>No Recently Returned Books</h3>
                                <p>Your return history will appear here.</p>
                            </div>
                        ) : (
                            <div className={returnedView === "grid" ? "books-grid" : "books-list"}>
                                {returnedBooks.map((record: any) => {
                                    const fineVal = record.fineAmount ? Number(record.fineAmount) : 0;
                                    const isPaid = record.finePaid;
                                    const hasFine = fineVal > 0;

                                    let badgeText = "Returned On Time";
                                    let badgeBg = "rgba(34, 197, 94, 0.95)";
                                    if (hasFine) {
                                        if (isPaid) {
                                            badgeText = "Fine Paid";
                                            badgeBg = "rgba(245, 158, 11, 0.95)";
                                        } else {
                                            badgeText = `Fine Unpaid (ETB ${fineVal.toFixed(0)})`;
                                            badgeBg = "rgba(239, 68, 68, 0.95)";
                                        }
                                    }

                                    return (
                                        <div 
                                            key={record.id} 
                                            className="book-card"
                                            onClick={(e) => {
                                                if ((e.target as HTMLElement).closest('a, button')) return;
                                                router.push(`/books/${record.book.id}`);
                                            }}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="book-cover">
                                                {record.book.coverImage ? (
                                                    <img src={record.book.coverImage} alt={record.book.title} />
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64, color: "var(--text-muted)", margin: "auto" }}>
                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                    </svg>
                                                )}
                                                {hasFine && !isPaid ? (
                                                    <Link href={`/payments/select-method/${record.id}`} className="book-status-badge badge-overdue" style={{ background: badgeBg, color: "white", textDecoration: "none", cursor: "pointer" }} title="Click to pay fine">
                                                        {badgeText}
                                                    </Link>
                                                ) : (
                                                    <div className="book-status-badge" style={{ background: badgeBg, color: "white" }}>
                                                        {badgeText}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="book-info">
                                                <div className="book-details">
                                                    <h3 className="book-title">{record.book.title}</h3>
                                                    <p className="book-author">by {record.book.author}</p>
                                                    <div className="book-meta">
                                                        <div className="meta-item">
                                                            <span className="meta-label">Returned:</span>
                                                            <span className="meta-value success">{formatDate(record.returnDate)}</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <span className="meta-label">Status:</span>
                                                            <span className="meta-value" style={{ color: hasFine ? (isPaid ? "#f59e0b" : "#ef4444") : "#22c55e", fontWeight: 700 }}>
                                                                {hasFine ? (isPaid ? `ETB ${fineVal.toFixed(0)} Fine (Paid)` : `ETB ${fineVal.toFixed(0)} Fine Unpaid`) : "On Time"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="book-actions">
                                                    <Link href={`/books/${record.book.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                        View Details
                                                    </Link>
                                                    {hasFine && !isPaid && (
                                                        <Link href={`/payments/select-method/${record.id}`} className="btn btn-sm" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", textDecoration: "none", justifyContent: "center" }}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                                                            Pay Fine ETB {fineVal.toFixed(0)}
                                                        </Link>
                                                    )}
                                                    <button type="button" className="btn btn-outline btn-sm" onClick={() => requestAgain(record.book.id, record.book.title)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
                                                        Request Again
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 5. REJECTED REQUESTS ── */}
                {showRejected && (
                    <div className="section-card danger-border">
                        <div className="section-header">
                            <div className="section-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                <h2>Rejected Requests</h2>
                                <span className="section-badge" style={{ background: "#ef4444" }}>{rejectedRequests.length}</span>
                            </div>
                            <div className="section-controls">
                                <div className="view-toggle">
                                    <button type="button" className={`view-btn ${rejectedView === "grid" ? "active" : ""}`} onClick={() => setRejectedView("grid")} title="Grid View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></button>
                                    <button type="button" className={`view-btn ${rejectedView === "list" ? "active" : ""}`} onClick={() => setRejectedView("list")} title="List View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></button>
                                </div>
                                {rejectedRequests.length > 0 && (
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={clearAllRejected}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, marginRight: 4 }}>
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        {rejectedRequests.length === 0 ? (
                            <div className="empty-state">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                <h3>No Rejected Requests</h3>
                                <p>You have no rejected request records.</p>
                            </div>
                        ) : (
                            <div className={rejectedView === "grid" ? "books-grid" : "books-list"}>
                                {rejectedRequests.map((req: any) => (
                                    <div 
                                        key={req.id} 
                                        className="book-card"
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('a, button')) return;
                                            router.push(`/books/${req.book.id}`);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className="book-cover">
                                            {req.book.coverImage ? <img src={req.book.coverImage} alt={req.book.title} /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 80, height: 80, color: "var(--text-muted)", margin: "auto" }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
                                            <div className="book-status-badge badge-rejected">Rejected</div>
                                        </div>
                                        <div className="book-info">
                                            <div className="book-details">
                                                <h3 className="book-title">{req.book.title}</h3>
                                                <p className="book-author">by {req.book.author}</p>
                                                {req.rejectionReason && (
                                                    <div className="reason-box">
                                                        <strong>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                            Rejection Reason:
                                                        </strong>
                                                        <p>{req.rejectionReason}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="book-actions">
                                                <Link href={`/books/${req.book.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>View Book</Link>
                                                <button type="button" className="btn btn-outline btn-sm" style={{ borderColor: "#ef4444", color: "#ef4444" }} onClick={() => deleteRequest(req.id)}>Clear Record</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
