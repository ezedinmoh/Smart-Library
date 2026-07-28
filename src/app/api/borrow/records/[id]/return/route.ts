import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { calculateFine } from "@/lib/fines";
import type { SessionUser } from "@/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const recordId = parseInt(id);
    const userId = parseInt(user.id);

    const record = await prisma.borrowRecord.findUnique({ where: { id: recordId }, include: { book: true, user: { include: { profile: true } } } });
    if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    // Students can only return their own books
    if (user.role === "student" && record.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (record.status === "returned") return NextResponse.json({ error: "Already returned" }, { status: 400 });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const fineAmount = record.dueDate < today ? await calculateFine(record.dueDate) : 0;

    // Update record
    await prisma.borrowRecord.update({
        where: { id: recordId },
        data: { status: "returned", returnDate: today, fineAmount, returnedToId: userId },
    });

    // Update book availability
    await prisma.book.update({ where: { id: record.bookId }, data: { availableCopies: { increment: 1 } } });

    // Update user profile
    if (record.user.profile && record.user.profile.currentlyBorrowed > 0) {
        await prisma.userProfile.update({
            where: { userId: record.userId },
            data: { currentlyBorrowed: { decrement: 1 }, totalBooksRead: { increment: 1 } },
        });
    }

    await logActivity(userId, "book_returned", `Returned book: "${record.book.title}"`);

    return NextResponse.json({ success: true, fineAmount, status: "returned" });
}
