import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (user.role !== "student") return NextResponse.json({ error: "Only students can request books" }, { status: 403 });

    const { bookId } = await req.json();
    const userId = parseInt(user.id);

    // Check for unpaid fines
    const unpaidFines = await prisma.borrowRecord.aggregate({
        where: { userId, fineAmount: { gt: 0 }, finePaid: false },
        _sum: { fineAmount: true },
    });
    if (unpaidFines._sum.fineAmount && parseFloat(unpaidFines._sum.fineAmount.toString()) > 0) {
        return NextResponse.json({ error: `You have unpaid fines of ETB ${parseFloat(unpaidFines._sum.fineAmount.toString()).toFixed(2)}. Please pay before requesting new books.` }, { status: 400 });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // Check borrow limit
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const maxLimit = profile?.maxBooksAllowed ?? 7;
    const currentBorrows = await prisma.borrowRecord.count({ where: { userId, status: { in: ["borrowed", "overdue"] } } });
    const pendingRequests = await prisma.bookRequest.count({ where: { userId, status: { in: ["pending", "ready"] } } });

    if (currentBorrows + pendingRequests >= maxLimit) {
        return NextResponse.json({ error: `Maximum limit of ${maxLimit} books reached (borrowed: ${currentBorrows}, pending: ${pendingRequests}).` }, { status: 400 });
    }

    // Check duplicates
    const [existingRequest, existingBorrow] = await Promise.all([
        prisma.bookRequest.findFirst({ where: { userId, bookId, status: { in: ["pending", "ready"] } } }),
        prisma.borrowRecord.findFirst({ where: { userId, bookId, status: { in: ["borrowed", "overdue"] } } }),
    ]);
    if (existingRequest) return NextResponse.json({ error: `You already have a pending request for "${book.title}".` }, { status: 400 });
    if (existingBorrow) return NextResponse.json({ error: `You have already borrowed "${book.title}".` }, { status: 400 });

    const bookRequest = await prisma.bookRequest.create({
        data: { userId, bookId, status: "pending" },
    });

    await logActivity(userId, "request_created", `Requested book: "${book.title}"`);

    // Notify librarians/admins
    try {
        const staffUsers = await prisma.user.findMany({ where: { role: { in: ["admin", "librarian"] } } });
        // In production: send email notifications here
        console.log(`[Notification] New book request #${bookRequest.id} by user ${userId}`);
    } catch { /* non-critical */ }

    return NextResponse.json({ success: true, requestId: bookRequest.id }, { status: 201 });
}
