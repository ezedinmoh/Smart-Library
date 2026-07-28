import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
    const { id, reviewId } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const review = await prisma.bookReview.findUnique({ where: { id: parseInt(reviewId) }, include: { book: true } });
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.bookReview.delete({ where: { id: review.id } });

    // Recalculate book rating
    const remaining = await prisma.bookReview.findMany({ where: { bookId: review.bookId } });
    const avg = remaining.length > 0 ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length : 0;
    await prisma.book.update({ where: { id: review.bookId }, data: { rating: avg } });

    return NextResponse.json({ success: true });
}
