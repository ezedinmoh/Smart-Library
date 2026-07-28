"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";

export default function ReviewFormClient({ book, existingReview }: any) {
    const router = useRouter();
    const [rating, setRating] = useState(existingReview?.rating ?? 0);
    const [hovered, setHovered] = useState(0);
    const [reviewText, setReviewText] = useState(existingReview?.reviewText ?? "");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!rating) { showToast("Please select a rating.", "warning"); return; }
        setLoading(true);
        const res = await fetch(`/api/books/${book.id}/reviews`, {
            method: existingReview ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating, reviewText }),
        });
        const data = await res.json();
        if (res.ok) { showToast(existingReview ? "Review updated!" : "Review submitted!", "success"); router.push(`/books/${book.id}`); }
        else showToast(data.error || "Failed.", "error");
        setLoading(false);
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 640 }}>
            <div style={{ marginBottom: 24 }}><Link href={`/books/${book.id}`} style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M19 12H5m7-7-7 7 7 7" /></svg>Back to Book</Link></div>
            <h1 className="page-title-gradient">{existingReview ? "Update Review" : "Write a Review"}</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>for <strong>{book.title}</strong></p>

            <form onSubmit={handleSubmit}>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 32, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Star Rating */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 12 }}>Your Rating *</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, transition: "transform 0.1s" }}
                                    onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
                                    onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}>
                                    <svg viewBox="0 0 24 24" fill={(hovered || rating) >= s ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" style={{ width: 36, height: 36, color: "#fbbf24" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                </button>
                            ))}
                            {rating > 0 && <span style={{ alignSelf: "center", fontSize: "0.875rem", color: "var(--text-secondary)", marginLeft: 8 }}>
                                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                            </span>}
                        </div>
                    </div>

                    {/* Review Text */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Review (optional)</label>
                        <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={5}
                            placeholder="Share your thoughts about this book…"
                            style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", fontSize: "0.875rem", resize: "vertical" }} />
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading || !rating}>{loading ? "Submitting…" : existingReview ? "Update Review" : "Submit Review"}</button>
                        <Link href={`/books/${book.id}`} className="btn btn-secondary">Cancel</Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
