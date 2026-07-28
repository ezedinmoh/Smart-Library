import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import AdminDashboardClient from "./AdminDashboardClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard - Smart Library" };

export default async function AdminDashboardPage() {
    await requireAdmin();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last30 = new Date(today); last30.setDate(last30.getDate() - 30);

    const [
        totalBooks, totalCategories, totalUsers, activeUsers,
        adminCount, librarianCount, studentCount, availableBooks,
    ] = await Promise.all([
        prisma.book.count(),
        prisma.category.count(),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: "admin" } }),
        prisma.user.count({ where: { role: "librarian" } }),
        prisma.user.count({ where: { role: "student" } }),
        prisma.book.count({ where: { availableCopies: { gt: 0 } } }),
    ]);

    const [
        totalCopiesAgg, availableCopiesAgg,
        totalBorrows, activeBorrows, overdueBooks, returnedBooks, pendingRequests,
    ] = await Promise.all([
        prisma.book.aggregate({ _sum: { totalCopies: true } }),
        prisma.book.aggregate({ _sum: { availableCopies: true } }),
        prisma.borrowRecord.count(),
        prisma.borrowRecord.count({ where: { status: { in: ["borrowed", "overdue"] } } }),
        prisma.borrowRecord.count({ where: { status: "overdue" } }),
        prisma.borrowRecord.count({ where: { status: "returned" } }),
        prisma.bookRequest.count({ where: { status: "pending" } }),
    ]);

    const [totalFinesAgg, unpaidFinesAgg, recentBorrows, recentReturns] = await Promise.all([
        prisma.borrowRecord.aggregate({ where: { fineAmount: { gt: 0 } }, _sum: { fineAmount: true } }),
        prisma.borrowRecord.aggregate({ where: { fineAmount: { gt: 0 }, finePaid: false }, _sum: { fineAmount: true } }),
        prisma.borrowRecord.findMany({ include: { user: true, book: true }, orderBy: { borrowDate: "desc" }, take: 12 }),
        prisma.borrowRecord.findMany({ where: { status: "returned" }, include: { user: true, book: true }, orderBy: { returnDate: "desc" }, take: 10 }),
    ]);

    const [mostBorrowed, rawMonthlyBorrows] = await Promise.all([
        prisma.book.findMany({ where: { timesBorrowed: { gt: 0 } }, orderBy: { timesBorrowed: "desc" }, take: 8 }),
        prisma.borrowRecord.findMany({ where: { borrowDate: { gte: last30 } }, select: { borrowDate: true } }),
    ]);

    // Group borrows by day (YYYY-MM-DD)
    const groupedBorrows = rawMonthlyBorrows.reduce((acc: any, record: any) => {
        const dateStr = record.borrowDate.toISOString().split('T')[0];
        if (!acc[dateStr]) acc[dateStr] = 0;
        acc[dateStr]++;
        return acc;
    }, {});

    const monthlyBorrows = Object.keys(groupedBorrows).sort().map(dateStr => ({
        borrowDate: new Date(dateStr),
        _count: { id: groupedBorrows[dateStr] }
    }));

    return (
        <AppShell>
            <AdminDashboardClient
                stats={{
                    totalBooks, totalCategories, totalUsers, activeUsers,
                    adminCount, librarianCount, studentCount,
                    availableBooks, unavailableBooks: totalBooks - availableBooks,
                    totalCopies: totalCopiesAgg._sum.totalCopies ?? 0,
                    availableCopies: availableCopiesAgg._sum.availableCopies ?? 0,
                    totalBorrows, activeBorrows, overdueBooks, returnedBooks,
                    pendingRequests,
                    totalFines: parseFloat((totalFinesAgg._sum.fineAmount ?? 0).toString()),
                    unpaidFines: parseFloat((unpaidFinesAgg._sum.fineAmount ?? 0).toString()),
                }}
                recentBorrows={serializePrisma(recentBorrows)}
                recentReturns={serializePrisma(recentReturns)}
                mostBorrowed={serializePrisma(mostBorrowed)}
                monthlyBorrows={serializePrisma(monthlyBorrows)}
            />
        </AppShell>
    );
}
