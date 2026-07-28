import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import BookDetailClient from "./BookDetailClient";
import { auth } from "@/lib/auth";
import { serializePrisma } from "@/lib/utils";
import type { SessionUser } from "@/types";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id: idStr } = await params;
    const book = await prisma.book.findUnique({ where: { id: parseInt(idStr) } });
    return { title: book ? `${book.title} - Smart Library` : "Book Not Found" };
}

export default async function BookDetailPage({ params }: Props) {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) notFound();

    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    const book = await prisma.book.findUnique({
        where: { id },
        include: {
            category: true,
            reviews: { include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" } },
        },
    });
    if (!book) notFound();

    // Rating distribution
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    book.reviews.forEach(r => { ratingDist[r.rating] = (ratingDist[r.rating] ?? 0) + 1; });

    // Correct avg rating
    const avgRating = book.reviews.length > 0
        ? book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length
        : 0;

    // User-specific data
    let canReview = false;
    let hasReviewed = false;
    let activeBorrowRecord = null;
    let hasBorrowedAndReturned = false;

    if (user) {
        const userId = parseInt(user.id);
        const [returned, reviewed, active] = await Promise.all([
            prisma.borrowRecord.findFirst({ where: { userId, bookId: id, status: "returned" } }),
            prisma.bookReview.findFirst({ where: { bookId: id, userId } }),
            prisma.borrowRecord.findFirst({ where: { userId, bookId: id, status: { in: ["borrowed", "overdue"] } } }),
        ]);
        hasBorrowedAndReturned = !!returned;
        hasReviewed = !!reviewed;
        canReview = hasBorrowedAndReturned && !hasReviewed && user.role === "student";
        activeBorrowRecord = active ? { id: active.id, status: active.status } : null;
    }

    // Recommendations
    const recommendations = await prisma.book.findMany({
        where: { categoryId: book.categoryId, id: { not: id }, availableCopies: { gt: 0 } },
        orderBy: { timesBorrowed: "desc" },
        take: 5,
        include: { category: true },
    });

    return (
        <AppShell>
            <BookDetailClient
                book={serializePrisma({ ...book, reviews: book.reviews })}
                avgRating={avgRating}
                ratingDist={ratingDist}
                canReview={canReview}
                hasReviewed={hasReviewed}
                hasBorrowedAndReturned={hasBorrowedAndReturned}
                activeBorrowRecord={serializePrisma(activeBorrowRecord)}
                recommendations={serializePrisma(recommendations)}
                user={user ?? null}
            />
        </AppShell>
    );
}
