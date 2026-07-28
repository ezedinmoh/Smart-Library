import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "student") return NextResponse.json({ error: "Only students can review." }, { status: 403 });

    const bookId = parseInt(id);
    const userId = parseInt(u.id);
    const { rating, reviewText } = await req.json();

    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });

    const hasBorrowed = await prisma.borrowRecord.findFirst({ where: { userId, bookId, status: "returned" } });
    if (!hasBorrowed) return NextResponse.json({ error: "You can only review books you have borrowed and returned." }, { status: 400 });

    const existing = await prisma.bookReview.findFirst({ where: { bookId, userId } });
    if (existing) return NextResponse.json({ error: "You have already reviewed this book." }, { status: 400 });

    await prisma.bookReview.create({ data: { bookId, userId, rating, reviewText: reviewText ?? "" } });

    // Update avg rating
    const reviews = await prisma.bookReview.findMany({ where: { bookId } });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await prisma.book.update({ where: { id: bookId }, data: { rating: avg } });

    await logActivity(userId, "review_added", `Added review for book #${bookId}`);
    return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "student") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const bookId = parseInt(id);
    const userId = parseInt(u.id);
    const { rating, reviewText } = await req.json();

    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });

    const existing = await prisma.bookReview.findFirst({ where: { bookId, userId } });
    if (!existing) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    await prisma.bookReview.update({ where: { id: existing.id }, data: { rating, reviewText: reviewText ?? "" } });

    const reviews = await prisma.bookReview.findMany({ where: { bookId } });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await prisma.book.update({ where: { id: bookId }, data: { rating: avg } });

    return NextResponse.json({ success: true });
}
