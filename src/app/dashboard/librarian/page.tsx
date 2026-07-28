import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import LibrarianDashboardClient from "./LibrarianDashboardClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
import type { SessionUser } from "@/types";
import { auth } from "@/lib/auth";
export const metadata: Metadata = { title: "Librarian Dashboard - Smart Library" };

export default async function LibrarianDashboardPage() {
    await requireLibrarianOrAdmin();
    const session = await auth();
    const sessionUser = session?.user as SessionUser | undefined;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
        totalBooks, availableBooks, lowStockBooksData, activeBorrows,
        overdueBooks, pendingRequests, lowStockCount,
    ] = await Promise.all([
        prisma.book.count(),
        prisma.book.count({ where: { availableCopies: { gt: 0 } } }),
        prisma.book.findMany({ where: { availableCopies: { lte: 2 } }, orderBy: { availableCopies: "asc" }, take: 6 }),
        prisma.borrowRecord.count({ where: { status: { in: ["borrowed", "overdue"] } } }),
        prisma.borrowRecord.count({ where: { status: "overdue" } }),
        prisma.bookRequest.count({ where: { status: "pending" } }),
        prisma.book.count({ where: { availableCopies: { lte: 2 } } }),
    ]);

    const [todayBorrows, todayReturns, todayRequests] = await Promise.all([
        prisma.borrowRecord.count({ where: { borrowDate: { gte: today } } }),
        prisma.borrowRecord.count({ where: { returnDate: { gte: today } } }),
        prisma.bookRequest.count({ where: { requestDate: { gte: today } } }),
    ]);

    const [recentBorrows, recentRequests, unpaidFinesAgg] = await Promise.all([
        prisma.borrowRecord.findMany({ include: { user: true, book: true }, orderBy: { borrowDate: "desc" }, take: 10 }),
        prisma.bookRequest.findMany({ where: { status: "pending" }, include: { user: true, book: true }, orderBy: { requestDate: "desc" }, take: 8 }),
        prisma.borrowRecord.aggregate({ where: { fineAmount: { gt: 0 }, finePaid: false }, _sum: { fineAmount: true } }),
    ]);

    const username = sessionUser?.firstName || sessionUser?.username || "Librarian";

    return (
        <AppShell>
            <LibrarianDashboardClient
                stats={{
                    totalBooks, availableBooks, activeBorrows, overdueBooks,
                    pendingRequests, lowStockCount,
                    unpaidFines: parseFloat((unpaidFinesAgg._sum.fineAmount ?? 0).toString()),
                }}
                todayStats={{ borrows: todayBorrows, returns: todayReturns, requests: todayRequests }}
                recentBorrows={serializePrisma(recentBorrows)}
                recentRequests={serializePrisma(recentRequests)}
                lowStockBooks={serializePrisma(lowStockBooksData)}
                username={username}
            />
        </AppShell>
    );
}
