"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";

const LANGUAGES = [
    ["en", "English"], ["hi", "Hindi"], ["es", "Spanish"], ["fr", "French"],
    ["de", "German"], ["ar", "Arabic"], ["zh", "Chinese"], ["pt", "Portuguese"], ["other", "Other"],
];

const IS: React.CSSProperties = {
    width: "100%", padding: "10px 13px", fontSize: "0.9375rem", color: "var(--text-primary)",
    background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius)",
    transition: "border-color 0.2s, box-shadow 0.2s", outline: "none", fontFamily: "inherit",
};

function FF({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactElement<any> }) {
    const styled = React.cloneElement(children, {
        style: { ...IS, ...(children.props.style ?? {}), ...(error ? { borderColor: "#ef4444" } : {}) },
        onFocus: (e: React.FocusEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.12)"; },
        onBlur: (e: React.FocusEvent<HTMLElement>) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "var(--border)"; e.currentTarget.style.boxShadow = "none"; },
    });
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: 7, color: "var(--text-primary)" }}>{label}</label>
            {styled}
            {hint && !error && <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 5 }}>{hint}</p>}
            {error && (
                <span style={{ fontSize: "0.8125rem", color: "#ef4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                </span>
            )}
        </div>
    );
}

function FormSection({ title, icon, children }: { title: string; icon: "info" | "file" | "box" | "image"; children: React.ReactNode }) {
    const icons: Record<string, React.ReactNode> = {
        info:  <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></>,
        file:  <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
        box:   <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
        image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
    };
    return (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-light)", background: "rgba(0,0,0,0.015)", display: "flex", alignItems: "center", gap: 10 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 18, height: 18 }}>{icons[icon]}</svg>
                <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{title}</h2>
            </div>
            <div style={{ padding: 24 }}>{children}</div>
        </div>
    );
}

export default function BookFormClient({ categories, book, action }: any) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        isbn: book?.isbn ?? "",
        title: book?.title ?? "",
        author: book?.author ?? "",
        description: book?.description ?? "",
        categoryId: book?.categoryId ?? "",
        totalCopies: book?.totalCopies ?? 1,
        availableCopies: book?.availableCopies ?? 1,
        publisher: book?.publisher ?? "",
        publicationDate: book?.publicationDate ? new Date(book.publicationDate).toISOString().split("T")[0] : "",
        pages: book?.pages ?? "",
        language: book?.language ?? "en",
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function set(field: string, value: any) {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    }

    function validateStock(): string | null {
        const total = parseInt(String(form.totalCopies)) || 0;
        const avail = parseInt(String(form.availableCopies)) || 0;
        if (avail > total) return "Available copies cannot exceed total copies";
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const stockErr = validateStock();
        if (stockErr) { setErrors(prev => ({ ...prev, availableCopies: stockErr })); return; }
        setSaving(true);
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
        if (coverFile) fd.append("coverImage", coverFile);
        if (pdfFile) fd.append("pdfFile", pdfFile);
        const url = book ? `/api/books/${book.id}` : "/api/books";
        const method = book ? "PATCH" : "POST";
        const res = await fetch(url, { method, body: fd });
        const data = await res.json();
        if (res.ok) {
            showToast(`Book "${form.title}" ${book ? "updated" : "added"} successfully.`, "success");
            router.push(`/books/${data.id ?? book?.id}`);
        } else {
            if (data.errors) setErrors(data.errors);
            else showToast(data.error || "Failed to save book.", "error");
        }
        setSaving(false);
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 960 }}>

            {/* Back link */}
            <div style={{ marginBottom: 24 }}>
                <Link href={book ? `/books/${book.id}` : "/books"}
                    style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", textDecoration: "none" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M19 12H5m7-7-7 7 7 7" /></svg>
                    Back to Books
                </Link>
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, var(--primary), var(--secondary))", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(16,185,129,0.25)", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 24, height: 24 }}>
                        {action === "Add"
                            ? <path d="M12 5v14m-7-7h14" />
                            : <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>}
                    </svg>
                </div>
                <div>
                    <h1 className="page-title-gradient" style={{ margin: 0 }}>{action} Book</h1>
                    <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "0.9375rem" }}>
                        {action === "Add" ? "Add a new book to the library collection" : "Update book information and details"}
                    </p>
                </div>
            </div>

            {/* Guidelines info box */}
            <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(16,185,129,0.05))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ width: 20, height: 20, flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)" }}>Book Entry Guidelines</span>
                </div>
                <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
                    {[
                        "Ensure ISBN is unique and follows standard format (10 or 13 digits)",
                        "Available copies cannot exceed total copies",
                        "Cover images should be in JPG, PNG, or WebP format (max 5MB)",
                        "PDF files are optional but recommended for digital access",
                    ].map(tip => (
                        <li key={tip} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Basic Information */}
                <FormSection title="Basic Information" icon="info">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <FF label="Book Title *" error={errors.title}>
                                <input type="text" value={form.title} onChange={e => set("title", e.target.value)} required placeholder="Enter the complete book title" />
                            </FF>
                        </div>
                        <FF label="Author *" error={errors.author}>
                            <input type="text" value={form.author} onChange={e => set("author", e.target.value)} required placeholder="Author name" />
                        </FF>
                        <FF label="ISBN *" error={errors.isbn} hint="10 or 13 digit ISBN">
                            <input type="text" value={form.isbn} onChange={e => set("isbn", e.target.value)} required placeholder="978-0-123456-78-9" />
                        </FF>
                        <FF label="Category">
                            <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                                <option value="">— No Category —</option>
                                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </FF>
                        <FF label="Language">
                            <select value={form.language} onChange={e => set("language", e.target.value)}>
                                {LANGUAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </FF>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <FF label="Description">
                                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
                                    placeholder="Brief description of the book, its themes, and what readers can expect…"
                                    style={{ resize: "vertical" }} />
                            </FF>
                        </div>
                    </div>
                </FormSection>

                {/* Publication Details */}
                <FormSection title="Publication Details" icon="file">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <FF label="Publisher">
                            <input type="text" value={form.publisher} onChange={e => set("publisher", e.target.value)} placeholder="Publishing company" />
                        </FF>
                        <FF label="Publication Date">
                            <input type="date" value={form.publicationDate} onChange={e => set("publicationDate", e.target.value)} />
                        </FF>
                        <FF label="Number of Pages">
                            <input type="number" value={form.pages} onChange={e => set("pages", e.target.value)} min={1} placeholder="e.g. 350" />
                        </FF>
                    </div>
                </FormSection>

                {/* Stock Management */}
                <FormSection title="Stock Management" icon="box">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <FF label="Total Copies *" error={errors.totalCopies} hint="Total number of copies in the library">
                            <input type="number" value={form.totalCopies} onChange={e => set("totalCopies", parseInt(e.target.value))} required min={0} placeholder="e.g. 10" />
                        </FF>
                        <FF label="Available Copies *" error={errors.availableCopies} hint="Currently available for borrowing">
                            <input type="number" value={form.availableCopies} onChange={e => set("availableCopies", parseInt(e.target.value))} required min={0} placeholder="e.g. 8" />
                        </FF>
                    </div>
                </FormSection>

                {/* Media Files */}
                <FormSection title="Media Files" icon="image">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                        <div>
                            <FF label="Cover Image (JPG / PNG / WebP)">
                                <input type="file" accept="image/*"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f && f.size > 5 * 1024 * 1024) { showToast("Cover image must be under 5MB", "error"); e.target.value = ""; return; }
                                        setCoverFile(f ?? null);
                                    }} />
                            </FF>
                            {book?.coverImage && (
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, padding: "10px 14px", background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                                    <img src={book.coverImage} alt="Current cover" style={{ width: 48, height: 68, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 2 }}>Current Cover</div>
                                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Already uploaded</div>
                                    </div>
                                </div>
                            )}
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 6 }}>JPG, PNG, or WebP — max 5MB</p>
                        </div>
                        <div>
                            <FF label="PDF File (optional)">
                                <input type="file" accept=".pdf"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f && !f.type.includes("pdf")) { showToast("Please select a PDF file", "error"); e.target.value = ""; return; }
                                        setPdfFile(f ?? null);
                                    }} />
                            </FF>
                            {book?.pdfFile && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "6px 12px", background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600 }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    PDF already uploaded
                                </div>
                            )}
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 6 }}>PDF format only — optional</p>
                        </div>
                    </div>
                </FormSection>

                {/* Actions */}
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 4 }}>
                    <Link href={book ? `/books/${book.id}` : "/books"} className="btn btn-secondary" style={{ padding: "12px 24px" }}>Cancel</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: "12px 32px", fontSize: "1rem" }}>
                        {saving
                            ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 17, height: 17, animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Saving…</>
                            : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 17, height: 17 }}><polyline points="20 6 9 17 4 12" /></svg> {action} Book</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
