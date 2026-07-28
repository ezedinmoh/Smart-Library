import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Categories - Smart Library" };

export default async function CategoriesPage() {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    const isStaff = user?.role === "admin" || user?.role === "librarian";

    const categories = await prisma.category.findMany({
        include: {
            _count: { select: { books: true } },
            books: { select: { coverImage: true, title: true }, take: 4, orderBy: { createdAt: "desc" } },
        },
        orderBy: { name: "asc" },
    });

    const totalBooks = categories.reduce((sum, c) => sum + c._count.books, 0);
    const withBooks = categories.filter(c => c._count.books > 0).length;

    return (
        <AppShell>
            <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <nav className="breadcrumb">
                            <Link href="/books">Books</Link>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                            <span>Categories</span>
                        </nav>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                            <h1 className="page-title-gradient">Book Categories</h1>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Browse and manage the library&apos;s book categories</p>
                    </div>
                    {isStaff && (
                        <Link href="/books/categories/create" className="btn btn-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M12 5v14m-7-7h14" /></svg>
                            Add Category
                        </Link>
                    )}
                </div>

                {/* Stats Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 32, padding: "14px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: 28, boxShadow: "var(--shadow-sm)", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                        <strong style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{categories.length}</strong>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Total Categories</span>
                    </div>
                    <div style={{ width: 1, height: 32, background: "var(--border)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                        <strong style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{totalBooks}</strong>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Total Books</span>
                    </div>
                    <div style={{ width: 1, height: 32, background: "var(--border)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ width: 20, height: 20 }}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                        <strong style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{withBooks}</strong>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Categories with Books</span>
                    </div>
                </div>

                {categories.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64, opacity: 0.2, display: "block", margin: "0 auto 16px" }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>No categories yet</h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Create your first category to start organizing books.</p>
                        {isStaff && <Link href="/books/categories/create" className="btn btn-primary" style={{ display: "inline-flex" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M12 5v14m-7-7h14" /></svg>
                            Add First Category
                        </Link>}
                    </div>
                ) : (
                    <div className="categories-grid-auto" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
                        {categories.map(cat => (
                            <div key={cat.id} className="category-card-hover" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>

                                {/* Card Top */}
                                <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                    <div style={{ width: 50, height: 50, borderRadius: 12, background: "linear-gradient(135deg, var(--primary), var(--secondary))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(16,185,129,0.2)", flexShrink: 0 }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                    </div>
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: "0.8125rem", fontWeight: 700, background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: 9999 }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                        {cat._count.books} book{cat._count.books !== 1 ? "s" : ""}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: "0 20px 14px", flex: 1 }}>
                                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{cat.name}</h3>
                                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {(cat as any).description ?? "No description provided for this category."}
                                    </p>
                                </div>

                                {/* Mini book cover previews */}
                                {cat.books.length > 0 && (
                                    <div style={{ display: "flex", gap: 5, padding: "0 20px 14px" }}>
                                        {cat.books.map((book, idx) => (
                                            book.coverImage
                                                ? <img key={idx} src={book.coverImage} alt={book.title} title={book.title} style={{ width: 32, height: 44, borderRadius: 4, objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }} />
                                                : <div key={idx} title={book.title} style={{ width: 32, height: 44, borderRadius: 4, background: "linear-gradient(135deg, #10b981, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.6875rem", fontWeight: 700, flexShrink: 0 }}>{book.title[0]?.toUpperCase()}</div>
                                        ))}
                                        {cat._count.books > 4 && (
                                            <div style={{ width: 32, height: 44, borderRadius: 4, background: "var(--background)", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)" }}>+{cat._count.books - 4}</div>
                                        )}
                                    </div>
                                )}

                                {/* Card Footer */}
                                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--background)" }}>
                                    <Link href={`/books/categories/${cat.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        View Books
                                    </Link>
                                    {isStaff && (
                                        <Link href={`/books/categories/${cat.id}/edit`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            Edit
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
