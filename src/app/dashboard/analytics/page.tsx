import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import AnalyticsClient from "./AnalyticsClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Analytics - Smart Library" };

export default async function AnalyticsPage() {
    await requireAdmin();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Last 12 months borrow trend
    const monthlyLabels: string[] = [];
    const monthlyData: number[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const count = await prisma.borrowRecord.count({ where: { borrowDate: { gte: d, lt: end } } });
        monthlyLabels.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
        monthlyData.push(count);
    }

    // Category distribution
    const categoryStats = await prisma.category.findMany({
        include: { _count: { select: { books: true } } },
        orderBy: { books: { _count: "desc" } },
    });

    // Role stats
    const [adminCount, librarianCount, studentCount] = await Promise.all([
        prisma.user.count({ where: { role: "admin" } }),
        prisma.user.count({ where: { role: "librarian" } }),
        prisma.user.count({ where: { role: "student" } }),
    ]);

    // Book availability
    const [availableBooks, totalBooks] = await Promise.all([
        prisma.book.count({ where: { availableCopies: { gt: 0 } } }),
        prisma.book.count(),
    ]);

    // Last 7 days daily activity
    const dailyLabels: string[] = [];
    const dailyBorrows: number[] = [];
    const dailyReturns: number[] = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date(today); day.setDate(day.getDate() - i);
        const nextDay = new Date(day); nextDay.setDate(nextDay.getDate() + 1);
        const [bCount, rCount] = await Promise.all([
            prisma.borrowRecord.count({ where: { borrowDate: { gte: day, lt: nextDay } } }),
            prisma.borrowRecord.count({ where: { returnDate: day } }),
        ]);
        dailyLabels.push(day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }));
        dailyBorrows.push(bCount);
        dailyReturns.push(rCount);
    }

    const topBooks = await prisma.book.findMany({ where: { timesBorrowed: { gt: 0 } }, orderBy: { timesBorrowed: "desc" }, take: 10 });
    const [totalFinesAgg, unpaidFinesAgg] = await Promise.all([
        prisma.borrowRecord.aggregate({ where: { fineAmount: { gt: 0 } }, _sum: { fineAmount: true } }),
        prisma.borrowRecord.aggregate({ where: { fineAmount: { gt: 0 }, finePaid: false }, _sum: { fineAmount: true } }),
    ]);

    return (
        <AppShell>
            <AnalyticsClient
                monthlyLabels={monthlyLabels} monthlyData={monthlyData}
                categoryStats={categoryStats.map(c => ({ name: c.name, book_count: c._count.books }))}
                roleStats={{ admin: adminCount, librarian: librarianCount, student: studentCount }}
                availableBooks={availableBooks} unavailableBooks={totalBooks - availableBooks}
                dailyLabels={dailyLabels} dailyBorrows={dailyBorrows} dailyReturns={dailyReturns}
                topBooks={serializePrisma(topBooks)}
                totalFines={parseFloat((totalFinesAgg._sum.fineAmount ?? 0).toString())}
                unpaidFines={parseFloat((unpaidFinesAgg._sum.fineAmount ?? 0).toString())}
            />
        </AppShell>
    );
}
