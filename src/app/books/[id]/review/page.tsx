import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import ReviewFormClient from "./ReviewFormClient";
import { serializePrisma } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Write Review - Smart Library" };

export default async function AddReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireStudent();
    const { id: idStr } = await params;
    const bookId = parseInt(idStr);
    const userId = parseInt(user.id);

    const [book, hasBorrowedAndReturned, existingReview] = await Promise.all([
        prisma.book.findUnique({ where: { id: bookId } }),
        prisma.borrowRecord.findFirst({ where: { userId, bookId, status: "returned" } }),
        prisma.bookReview.findFirst({ where: { bookId, userId } }),
    ]);

    if (!book) notFound();
    if (!hasBorrowedAndReturned) redirect(`/books/${bookId}`);

    return <AppShell><ReviewFormClient book={serializePrisma(book)} existingReview={serializePrisma(existingReview)} /></AppShell>;
}
