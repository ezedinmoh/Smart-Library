import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || (user.role !== "admin" && user.role !== "librarian")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reason } = await req.json();
    const requestId = parseInt(id);
    const rejecterId = parseInt(user.id);

    const bookRequest = await prisma.bookRequest.findUnique({ where: { id: requestId }, include: { book: true, user: true } });
    if (!bookRequest || bookRequest.status !== "pending") {
        return NextResponse.json({ error: "Request not found or already processed" }, { status: 400 });
    }

    await prisma.bookRequest.update({
        where: { id: requestId },
        data: { status: "rejected", rejectionReason: reason ?? "", approvedById: rejecterId, approvedDate: new Date() },
    });

    // Mark notification read for all staff
    const staffUsers = await prisma.user.findMany({ where: { role: { in: ["admin", "librarian"] } } });
    await Promise.all(staffUsers.map(su => prisma.notificationRead.upsert({
        where: { userId_notificationType_notificationKey: { userId: su.id, notificationType: "pending_request", notificationKey: `pending_request_${requestId}` } },
        create: { userId: su.id, notificationType: "pending_request", notificationKey: `pending_request_${requestId}` },
        update: {},
    })));

    await logActivity(rejecterId, "request_rejected", `Rejected book request for "${bookRequest.book.title}" by ${bookRequest.user.username}`);
    return NextResponse.json({ success: true });
}
