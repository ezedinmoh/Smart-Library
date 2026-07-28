"use client";
import Link from "next/link";
import BookCoverImage from "@/components/BookCoverImage";

const gradients = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

export default function BookGridClient({ books }: { books: any[] }) {
    return (
        <div className="books-grid">
            {books.map((book: any, i: number) => (
                <Link key={book.id} href={`/books/${book.id}`} className="book-item">
                    <div className={`book-cover-large ${gradients[i % 6]}`} style={{ position: "relative" }}>
                        <BookCoverImage
                            src={book.coverImage}
                            alt={book.title}
                            className="book-cover-image"
                            fallback={
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 20, textAlign: "center" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 64, height: 64, marginBottom: 12, opacity: 0.9 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                    <span style={{ color: "white", fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.4 }}>{book.title.split(" ").slice(0, 4).join(" ")}</span>
                                </div>
                            }
                        />
                    </div>
                    <div className="book-info">
                        <h3 className="book-title">{book.title}</h3>
                        <p className="book-author">{book.author}</p>
                        <span className={`book-badge ${book.availableCopies > 0 ? "badge-available" : "badge-unavailable"}`}>
                            {book.availableCopies > 0 ? `${book.availableCopies} available` : "Unavailable"}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}
