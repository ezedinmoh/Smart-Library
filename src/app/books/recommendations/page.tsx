import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import type { Metadata } from "next";
import { serializePrisma } from "@/lib/utils";
export const metadata: Metadata = { title: "Recommended Books - Smart Library" };

const GRADIENTS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

export default async function BookRecommendationsPage() {
    const user = await requireAuth();
    const userId = parseInt(user.id);

    const userBorrows = await prisma.borrowRecord.findMany({ where: { userId }, select: { bookId: true, book: { select: { categoryId: true } } } });
    const borrowedIds = userBorrows.map(b => b.bookId);
    const categoryIds = [...new Set(userBorrows.map(b => b.book.categoryId).filter(Boolean))] as number[];

    let recommended = await prisma.book.findMany({
        where: { categoryId: { in: categoryIds }, availableCopies: { gt: 0 }, id: { notIn: borrowedIds } },
        include: { category: true },
        orderBy: [{ timesBorrowed: "desc" }, { rating: "desc" }],
        take: 12,
    });

    if (recommended.length < 6) {
        const more = await prisma.book.findMany({
            where: { availableCopies: { gt: 0 }, id: { notIn: [...borrowedIds, ...recommended.map(b => b.id)] } },
            include: { category: true },
            orderBy: [{ timesBorrowed: "desc" }, { rating: "desc" }],
            take: 12 - recommended.length,
        });
        recommended = [...recommended, ...more];
    }

    const userCategories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const serializedRecommended = serializePrisma(recommended);

    return (
        <AppShell>
            <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 className="page-title-gradient">Recommended for You</h1>
                    {userCategories.length > 0 && (
                        <p style={{ color: "var(--text-secondary)" }}>
                            Based on your interest in: {userCategories.map(c => c.name).join(", ")}
                        </p>
                    )}
                </div>

                {serializedRecommended.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Borrow some books to get personalized recommendations!</p>
                        <Link href="/borrow/request-list" className="btn btn-primary">Browse Books</Link>
                    </div>
                ) : (
                    <div className="books-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))" }}>
                        {serializedRecommended.map((book, i) => (
                            <Link key={book.id} href={`/books/${book.id}`} className="book-item">
                                <div className={`book-cover-large ${GRADIENTS[i % 6]}`} style={{ position: "relative" }}>
                                    {book.coverImage ? (
                                        <img src={book.coverImage} alt={book.title} className="book-cover-image" />
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 16, textAlign: "center" }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 48, height: 48, marginBottom: 8, opacity: 0.9 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                            <span style={{ color: "white", fontWeight: 600, fontSize: "0.75rem", lineHeight: 1.4 }}>{book.title.split(" ").slice(0, 4).join(" ")}</span>
                                        </div>
                                    )}
                                    <span className="book-badge available">{book.availableCopies} left</span>
                                </div>
                                <div className="book-details">
                                    <h3 title={book.title}>{book.title.split(" ").slice(0, 5).join(" ")}{book.title.split(" ").length > 5 ? "…" : ""}</h3>
                                    <p className="author">{book.author}</p>
                                    <div className="book-meta">
                                        <div className="rating">
                                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14, color: "#fbbf24" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            <span style={{ fontSize: "0.813rem" }}>{Number(book.rating).toFixed(1)}</span>
                                        </div>
                                        {book.category && <span className="genre">{book.category.name}</span>}
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
