import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import type { Metadata } from "next";
import { serializePrisma } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id: idStr } = await params;
    const cat = await prisma.category.findUnique({ where: { id: parseInt(idStr) } });
    return { title: cat ? `${cat.name} - Smart Library` : "Category" };
}

const GRADIENTS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    const isStaff = user?.role === "admin" || user?.role === "librarian";

    const { id: idStr2 } = await params;
    const category = await prisma.category.findUnique({
        where: { id: parseInt(idStr2) },
        include: { books: { include: { category: true }, orderBy: { createdAt: "desc" } } },
    });
    if (!category) notFound();
    const books = serializePrisma(category.books);

    return (
        <AppShell>
            <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
                <div style={{ marginBottom: 24 }}><Link href="/books/categories" style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M19 12H5m7-7-7 7 7 7" /></svg>Categories</Link></div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <h1 className="page-title-gradient">{category.name}</h1>
                        {category.description && <p style={{ color: "var(--text-secondary)" }}>{category.description}</p>}
                        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 4 }}>{books.length} book{books.length !== 1 ? "s" : ""}</p>
                    </div>
                    {isStaff && <Link href={`/books/categories/${category.id}/edit`} className="btn btn-secondary">Edit Category</Link>}
                </div>
                {books.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 0" }}><p style={{ color: "var(--text-muted)" }}>No books in this category yet.</p></div>
                ) : (
                    <div className="books-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))" }}>
                        {books.map((book, i) => (
                            <Link key={book.id} href={`/books/${book.id}`} className="book-item">
                                <div className={`book-cover-large ${GRADIENTS[i % 6]}`} style={{ position: "relative" }}>
                                    {book.coverImage ? <img src={book.coverImage} alt={book.title} className="book-cover-image" /> : (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 16, textAlign: "center" }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 48, height: 48, marginBottom: 8, opacity: 0.9 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                            <span style={{ color: "white", fontWeight: 600, fontSize: "0.75rem", lineHeight: 1.4 }}>{book.title.split(" ").slice(0, 4).join(" ")}</span>
                                        </div>
                                    )}
                                    <span className={`book-badge ${book.availableCopies > 0 ? "available" : "borrowed"}`}>{book.availableCopies > 0 ? "Available" : "Borrowed"}</span>
                                </div>
                                <div className="book-details">
                                    <h3 title={book.title}>{book.title.split(" ").slice(0, 5).join(" ")}{book.title.split(" ").length > 5 ? "…" : ""}</h3>
                                    <p className="author">{book.author}</p>
                                    <div className="book-meta">
                                        <div className="rating"><svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14, color: "#fbbf24" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg><span style={{ fontSize: "0.813rem" }}>{parseFloat(book.rating.toString()).toFixed(1)}</span></div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
