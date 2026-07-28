"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";

export default function CategoryFormClient({ action, category }: { action: "Add" | "Edit"; category?: any }) {
    const router = useRouter();
    const [name, setName] = useState(category?.name ?? "");
    const [description, setDescription] = useState(category?.description ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const url = category ? `/api/books/categories/${category.id}` : "/api/books/categories";
        const method = category ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
        const data = await res.json();
        if (res.ok) {
            showToast(`Category "${name}" ${action === "Add" ? "created" : "updated"}.`, "success");
            router.push("/books/categories");
        } else {
            setError(data.error || "Something went wrong.");
        }
        setLoading(false);
    }

    const descCount = description.length;

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 680 }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <nav className="breadcrumb">
                    <Link href="/books">Books</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <Link href="/books/categories">Categories</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <span>{action} Category</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}>
                        {action === "Add"
                            ? <path d="M12 5v14m-7-7h14" />
                            : <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>}
                    </svg>
                    <h1 className="page-title-gradient">{action} Category</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
                    {action === "Add" ? "Create a new category to organize books" : "Update the category details"}
                </p>
            </div>

            {/* Form Card */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ padding: "28px 28px 0" }}>

                        {/* Error */}
                        {error && (
                            <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius)", color: "#ef4444", fontSize: "0.875rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {error}
                            </div>
                        )}

                        {/* Live Preview */}
                        <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, rgba(16,185,129,0.04), rgba(14,165,233,0.04))", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)", marginBottom: 24 }}>
                            <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>Live Preview</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 10, background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(14,165,233,0.15))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{name || "Category Name"}</div>
                                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{description || "Category description will appear here…"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Name field */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", marginBottom: 8 }}>
                                Category Name <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={100} placeholder="e.g. Science Fiction, History, Technology…"
                                style={{ width: "100%", padding: "11px 14px", fontSize: "0.9375rem", color: "var(--text-primary)", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius)", transition: "all 0.2s", outline: "none" }}
                                onFocus={e => e.currentTarget.style.borderColor = "#10b981"}
                                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 6 }}>Between 2 and 100 characters</p>
                        </div>

                        {/* Description field */}
                        <div style={{ marginBottom: 8 }}>
                            <label style={{ display: "block", fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", marginBottom: 8 }}>Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={500}
                                placeholder="Briefly describe what kinds of books belong in this category…"
                                style={{ width: "100%", padding: "11px 14px", fontSize: "0.9375rem", color: "var(--text-primary)", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius)", transition: "all 0.2s", outline: "none", resize: "vertical", lineHeight: 1.6 }}
                                onFocus={e => e.currentTarget.style.borderColor = "#10b981"}
                                onBlur={e => e.currentTarget.style.borderColor = "var(--border)"} />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Optional — helps users understand what books belong here</p>
                                <span style={{ fontSize: "0.8125rem", color: descCount > 450 ? "#f59e0b" : "var(--text-muted)", fontWeight: 500 }}>{descCount} / 500</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", gap: 12, padding: "20px 28px", borderTop: "1px solid var(--border)", background: "var(--background)", marginTop: 28 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: "center" }}>
                            {loading ? (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Saving…</>
                            ) : (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12" /></svg> {action} Category</>
                            )}
                        </button>
                        <Link href="/books/categories" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
