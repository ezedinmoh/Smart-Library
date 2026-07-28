"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";

const GRADIENTS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

interface Props {
    records: Array<{
        id: number;
        issueDate: string;
        dueDate: string;
        status: string;
        daysOverdue: number;
        fineAmount: number;
        finePaid: boolean;
        book: {
            id: number;
            title: string;
            author: string;
            coverImage: string | null;
            isbn: string | null;
            categoryName: string;
        };
    }>;
    totalFines: number;
    userRole: string;
}

export default function UnpaidFinesClient({ records, totalFines }: Props) {
    const router = useRouter();

    async function handleReturnBook(recordId: number, bookTitle: string) {
        const ok = await showConfirm(`Are you sure you want to return "${bookTitle}"? Outstanding fines must be cleared.`, "warning");
        if (!ok) return;

        const res = await fetch(`/api/borrow/records/${recordId}/return`, { method: "POST" });
        const data = await res.json();
        if (res.ok) {
            showToast(`"${bookTitle}" returned successfully. Fine: ETB ${data.fineAmount?.toFixed(2) || "0.00"}`, "success");
            router.refresh();
        } else {
            showToast(data.error || "Failed to return book.", "error");
        }
    }

    return (
        <main className="catalog-main" style={{ paddingTop: 104, paddingBottom: 60 }}>
            <div className="container">

                {/* Back to Home / My Books */}
                <div className="back-to-home-catalog" style={{ marginBottom: 24 }}>
                    <Link href="/borrow/my-books">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to My Books
                    </Link>
                </div>

                {/* Page Header */}
                <div className="catalog-header">
                    <div className="catalog-title">
                        <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 36, height: 36 }}>
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                            </svg>
                            Unpaid <span className="gradient-text" style={{ background: "linear-gradient(135deg, #ef4444, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fines & Books</span>
                        </h1>
                        <p>Detailed list of your overdue borrowed books requiring fine payment or return.</p>
                    </div>

                    {/* Stats */}
                    <div className="catalog-stats">
                        <div className="stat-item" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
                            <span className="stat-value" style={{ color: "#ef4444" }}>{records.length}</span>
                            <span className="stat-label">Unpaid Books</span>
                        </div>
                        <div className="stat-item" style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}>
                            <span className="stat-value" style={{ color: "#f59e0b" }}>ETB {totalFines.toFixed(2)}</span>
                            <span className="stat-label">Total Fine Due</span>
                        </div>
                    </div>
                </div>

                {/* Warning Alert Banner */}
                {records.length > 0 && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-lg)", padding: "18px 24px", marginBottom: 32, display: "flex", alignItems: "flex-start", gap: 16 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 24, height: 24, flexShrink: 0, marginTop: 2 }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <div>
                            <strong style={{ color: "#ef4444", fontSize: "1.05rem", display: "block", marginBottom: 4 }}>
                                Outstanding Fines Notice
                            </strong>
                            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.938rem", lineHeight: 1.5 }}>
                                You currently have <strong>{records.length} overdue book(s)</strong> with an accumulated fine of <strong>ETB {totalFines.toFixed(2)}</strong>. Overdue fines accumulate at ETB 10.00 per day. Please clear your fines or return the books promptly.
                            </p>
                        </div>
                    </div>
                )}

                {/* Records List */}
                {records.length === 0 ? (
                    <div className="empty-state" style={{ padding: "60px 20px", textAlign: "center" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ width: 64, height: 64, margin: "0 auto 16px" }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <h3>No Unpaid Books or Fines!</h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>You have zero overdue books and no pending library fines. Great job!</p>
                        <Link href="/borrow/my-books" className="btn btn-primary">
                            Go to My Books
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {records.map((r, i) => (
                            <div
                                key={r.id}
                                style={{
                                    background: "var(--background)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    borderRadius: "var(--radius-lg)",
                                    padding: 24,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 24,
                                    alignItems: "center",
                                    boxShadow: "0 4px 12px rgba(239,68,68,0.05)"
                                }}
                            >
                                {/* Cover Image */}
                                <div className={`book-catalog-cover ${GRADIENTS[i % 6]}`} style={{ width: 120, height: 160, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                                    {r.book.coverImage ? (
                                        <img src={r.book.coverImage} alt={r.book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 44, height: 44, opacity: 0.6, margin: "auto" }}>
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    )}
                                </div>

                                {/* Main Details */}
                                <div style={{ flex: 1, minWidth: 260 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                        <span style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", fontWeight: 700, fontSize: "0.75rem", padding: "3px 10px", borderRadius: 9999 }}>
                                            OVERDUE ({r.daysOverdue} DAYS)
                                        </span>
                                        <span style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>
                                            Category: {r.book.categoryName}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>
                                        {r.book.title}
                                    </h3>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.938rem", margin: "0 0 12px" }}>
                                        Author: <strong>{r.book.author}</strong> {r.book.isbn ? `• ISBN: ${r.book.isbn}` : ""}
                                    </p>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, background: "var(--surface)", padding: 14, borderRadius: 10 }}>
                                        <div>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Borrowed On</span>
                                            <strong style={{ fontSize: "0.875rem" }}>{formatDate(r.issueDate)}</strong>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Due Date</span>
                                            <strong style={{ fontSize: "0.875rem", color: "#ef4444" }}>{formatDate(r.dueDate)}</strong>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Fine Amount</span>
                                            <strong style={{ fontSize: "0.938rem", color: "#f59e0b" }}>ETB {r.fineAmount.toFixed(2)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 160, alignSelf: "center" }}>
                                    <Link
                                        href={`/payments/select-method/${r.id}`}
                                        className="btn btn-primary"
                                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", justifyContent: "center", textDecoration: "none" }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                            <line x1="1" y1="10" x2="23" y2="10" />
                                        </svg>
                                        Pay Fine Now
                                    </Link>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ justifyContent: "center" }}
                                        onClick={() => handleReturnBook(r.id, r.book.title)}
                                    >
                                        Return Book
                                    </button>
                                    <Link
                                        href={`/books/${r.book.id}`}
                                        className="btn btn-secondary btn-sm"
                                        style={{ justifyContent: "center", textDecoration: "none" }}
                                    >
                                        View Book Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </main>
    );
}
