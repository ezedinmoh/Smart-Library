/**
 * Notification system — mirrors Django's apps/users/notifications.py
 * Notifications are computed from database state + NotificationRead records
 */
import { prisma } from "./prisma";
import type { Notification } from "@/types";
import { getDaysOverdue } from "./utils";
import { formatDate } from "./utils";

/** Get all notifications for a user (computed from DB state) */
export async function getUserNotifications(
    userId: number,
    includeRead = true
): Promise<Notification[]> {
    const [user, readRecords, borrowRecords, bookRequests] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        }),
        prisma.notificationRead.findMany({
            where: { userId },
            select: { notificationKey: true, notificationType: true },
        }),
        prisma.borrowRecord.findMany({
            where: {
                userId,
                status: { in: ["borrowed", "overdue"] },
            },
            include: { book: true },
            orderBy: { dueDate: "asc" },
        }),
        prisma.bookRequest.findMany({
            where: { userId },
            include: { book: true },
            orderBy: { requestDate: "desc" },
            take: 20,
        }),
    ]);

    if (!user) return [];

    const readKeys = new Set(readRecords.map((r) => r.notificationKey));
    const notifications: Notification[] = [];

    // Overdue books
    for (const record of borrowRecords) {
        if (record.status === "overdue") {
            const key = `overdue_${record.id}`;
            const daysOverdue = getDaysOverdue(record.dueDate);
            notifications.push({
                id: key,
                key,
                type: "overdue",
                title: "Book Overdue",
                message: `"${record.book.title}" is ${daysOverdue} day(s) overdue.`,
                level: "error",
                icon: "exclamation-triangle",
                isRead: readKeys.has(key),
                fine: record.fineAmount ? parseFloat(record.fineAmount.toString()) : null,
                createdAt: record.borrowDate,
                url: `/borrow/my-books/`,
            });
        } else {
            // Due soon (within 3 days)
            const remaining = getDaysOverdue(record.dueDate);
            if (remaining === 0) {
                const key = `due_today_${record.id}`;
                notifications.push({
                    id: key,
                    key,
                    type: "due_soon",
                    title: "Book Due Today",
                    message: `"${record.book.title}" is due today!`,
                    level: "warning",
                    icon: "clock",
                    isRead: readKeys.has(key),
                    createdAt: record.borrowDate,
                    url: `/borrow/my-books/`,
                });
            } else {
                const daysLeft = Math.ceil(
                    (new Date(record.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                if (daysLeft <= 3 && daysLeft > 0) {
                    const key = `due_soon_${record.id}`;
                    notifications.push({
                        id: key,
                        key,
                        type: "due_soon",
                        title: "Book Due Soon",
                        message: `"${record.book.title}" is due in ${daysLeft} day(s) (${formatDate(record.dueDate)}).`,
                        level: "warning",
                        icon: "clock",
                        isRead: readKeys.has(key),
                        createdAt: record.borrowDate,
                        url: `/borrow/my-books/`,
                    });
                }
            }
        }
    }

    // Book request status changes
    for (const req of bookRequests) {
        if (req.status === "ready") {
            const key = `request_ready_${req.id}`;
            notifications.push({
                id: key,
                key,
                type: "request_ready",
                title: "Book Ready for Pickup",
                message: `"${req.book.title}" is ready to borrow!`,
                level: "success",
                icon: "check-circle",
                isRead: readKeys.has(key),
                createdAt: req.updatedAt,
                url: `/borrow/my-books/`,
            });
        } else if (req.status === "rejected") {
            const key = `request_rejected_${req.id}`;
            notifications.push({
                id: key,
                key,
                type: "request_rejected",
                title: "Book Request Rejected",
                message: `Your request for "${req.book.title}" was rejected.${req.rejectionReason ? ` Reason: ${req.rejectionReason}` : ""
                    }`,
                level: "error",
                icon: "x-circle",
                isRead: readKeys.has(key),
                createdAt: req.updatedAt,
                url: `/borrow/my-books/`,
            });
        }
    }

    // Admin/Librarian: pending requests notification
    if (user.role === "admin" || user.role === "librarian") {
        const pendingRequests = await prisma.bookRequest.findMany({
            where: { status: "pending" },
            include: { book: true, user: true },
            orderBy: { requestDate: "desc" },
            take: 10,
        });

        for (const req of pendingRequests) {
            const key = `pending_request_${req.id}`;
            notifications.push({
                id: key,
                key,
                type: "pending_request",
                title: "New Book Request",
                message: `${req.user.username} requested "${req.book.title}".`,
                level: "info",
                icon: "bell",
                isRead: readKeys.has(key),
                createdAt: req.requestDate,
                url: `/borrow/pending-requests/`,
            });
        }
    }

    // Sort: unread first, then by date desc
    notifications.sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (!includeRead) return notifications.filter((n) => !n.isRead);
    return notifications;
}

export async function getNotificationCount(userId: number): Promise<number> {
    const notifications = await getUserNotifications(userId, false);
    return notifications.filter((n) => !n.isRead).length;
}

export async function markNotificationRead(
    userId: number,
    notificationKey: string,
    notificationType: string
): Promise<void> {
    await prisma.notificationRead.upsert({
        where: {
            userId_notificationType_notificationKey: {
                userId,
                notificationType,
                notificationKey,
            },
        },
        create: { userId, notificationType, notificationKey },
        update: {},
    });
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
    const notifications = await getUserNotifications(userId);
    await Promise.all(
        notifications
            .filter((n) => !n.isRead)
            .map((n) =>
                markNotificationRead(userId, n.key, n.type)
            )
    );
}

export async function deleteNotification(
    userId: number,
    notificationKey: string,
    notificationType: string
): Promise<boolean> {
    try {
        await prisma.notificationRead.upsert({
            where: {
                userId_notificationType_notificationKey: {
                    userId,
                    notificationType,
                    notificationKey,
                },
            },
            create: { userId, notificationType, notificationKey },
            update: {},
        });
        return true;
    } catch {
        return false;
    }
}

export async function clearAllNotifications(userId: number): Promise<number> {
    const notifications = await getUserNotifications(userId);
    let count = 0;
    for (const n of notifications) {
        await markNotificationRead(userId, n.key, n.type);
        count++;
    }
    return count;
}
