import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || (user.role !== "admin" && user.role !== "librarian")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requestId = parseInt(id);
    const bookRequest = await prisma.bookRequest.findUnique({
        where: { id: requestId },
        include: { user: { include: { profile: true } }, book: true },
    });
    if (!bookRequest || bookRequest.status !== "pending") {
        return NextResponse.json({ error: "Request not found or already processed" }, { status: 400 });
    }

    // Check unpaid fines
    const unpaidFines = await prisma.borrowRecord.aggregate({
        where: { userId: bookRequest.userId, fineAmount: { gt: 0 }, finePaid: false },
        _sum: { fineAmount: true },
    });
    if (unpaidFines._sum.fineAmount && parseFloat(unpaidFines._sum.fineAmount.toString()) > 0) {
        return NextResponse.json({ error: `User has unpaid fines of ETB ${parseFloat(unpaidFines._sum.fineAmount.toString()).toFixed(2)}.` }, { status: 400 });
    }

    if (!bookRequest.book.availableCopies) {
        return NextResponse.json({ error: `"${bookRequest.book.title}" is no longer available.` }, { status: 400 });
    }

    // Check borrow limit
    const profile = bookRequest.user.profile;
    const maxLimit = profile?.maxBooksAllowed ?? 7;
    const currentBorrows = await prisma.borrowRecord.count({ where: { userId: bookRequest.userId, status: { in: ["borrowed", "overdue"] } } });
    const otherRequests = await prisma.bookRequest.count({ where: { userId: bookRequest.userId, status: { in: ["pending", "ready"] }, id: { not: requestId } } });
    if (currentBorrows + otherRequests >= maxLimit) {
        return NextResponse.json({ error: `User has reached the maximum limit of ${maxLimit} books.` }, { status: 400 });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const borrowDays = settings?.maxBorrowDays ?? 14;
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + borrowDays); dueDate.setHours(0, 0, 0, 0);

    const approverId = parseInt(user.id);

    await prisma.$transaction(async (tx) => {
        // Approve request
        await tx.bookRequest.update({ where: { id: requestId }, data: { status: "fulfilled", approvedById: approverId, approvedDate: new Date() } });
        // Create borrow record
        await tx.borrowRecord.create({ data: { userId: bookRequest.userId, bookId: bookRequest.bookId, bookRequestId: requestId, dueDate, issuedById: approverId } });
        // Decrease available copies
        await tx.book.update({ where: { id: bookRequest.bookId }, data: { availableCopies: { decrement: 1 }, timesBorrowed: { increment: 1 } } });
        // Update user profile
        if (profile) await tx.userProfile.update({ where: { userId: bookRequest.userId }, data: { currentlyBorrowed: { increment: 1 } } });
        // Mark notification as read for all staff
        const staffUsers = await tx.user.findMany({ where: { role: { in: ["admin", "librarian"] } } });
        await Promise.all(staffUsers.map(su => tx.notificationRead.upsert({
            where: { userId_notificationType_notificationKey: { userId: su.id, notificationType: "pending_request", notificationKey: `pending_request_${requestId}` } },
            create: { userId: su.id, notificationType: "pending_request", notificationKey: `pending_request_${requestId}` },
            update: {},
        })));
    });

    await logActivity(approverId, "request_approved", `Approved book request for "${bookRequest.book.title}" by ${bookRequest.user.username}`);
    return NextResponse.json({ success: true });
}
