import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import StudentDashboardClient from "./StudentDashboardClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "My Dashboard - Smart Library" };

export default async function StudentDashboardPage() {
    const user = await requireStudent();
    const userId = parseInt(user.id);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const threeDaysOut = new Date(today); threeDaysOut.setDate(threeDaysOut.getDate() + 3);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Batch 1: core borrow/request data (5 queries)
    const [borrowedBooks, borrowHistory, overdueBooks, pendingRequests, readyRequests] = await Promise.all([
        prisma.borrowRecord.findMany({ where: { userId, status: { in: ["borrowed", "overdue"] } }, include: { book: { include: { category: true } } }, orderBy: { borrowDate: "desc" } }),
        prisma.borrowRecord.findMany({ where: { userId }, include: { book: true }, orderBy: { borrowDate: "desc" }, take: 10 }),
        prisma.borrowRecord.findMany({ where: { userId, status: "overdue" }, include: { book: true } }),
        prisma.bookRequest.findMany({ where: { userId, status: "pending" }, include: { book: true }, orderBy: { requestDate: "desc" } }),
        prisma.bookRequest.findMany({ where: { userId, status: "ready" }, include: { book: true }, orderBy: { approvedDate: "desc" } }),
    ]);

    // Batch 2: profile & aggregates (4 queries)
    const [profile, booksThisMonth, totalFinesAgg, unpaidFinesAgg] = await Promise.all([
        prisma.userProfile.findUnique({ where: { userId } }),
        prisma.borrowRecord.count({ where: { userId, borrowDate: { gte: thisMonth } } }),
        prisma.borrowRecord.aggregate({ where: { userId, fineAmount: { gt: 0 } }, _sum: { fineAmount: true } }),
        prisma.borrowRecord.aggregate({ where: { userId, fineAmount: { gt: 0 }, finePaid: false }, _sum: { fineAmount: true } }),
    ]);

    // Batch 3: due soon, categories, totals (4 queries)
    const [dueSoonBooks, userCategories, totalBorrowed, booksReturned] = await Promise.all([
        prisma.borrowRecord.findMany({ where: { userId, status: { in: ["borrowed", "overdue"] }, dueDate: { lte: threeDaysOut } }, include: { book: true }, orderBy: { dueDate: "asc" } }),
        prisma.borrowRecord.findMany({ where: { userId }, select: { book: { select: { categoryId: true } } }, take: 50 }),
        prisma.borrowRecord.count({ where: { userId } }),
        prisma.borrowRecord.count({ where: { userId, status: "returned" } }),
    ]);

    const categoryIds = [...new Set(userCategories.map(b => b.book.categoryId).filter(Boolean))];
    const borrowedIds = borrowedBooks.map(b => b.bookId);

    let recommendedBooks = await prisma.book.findMany({
        where: { categoryId: { in: categoryIds as number[] }, availableCopies: { gt: 0 }, id: { notIn: borrowedIds } },
        orderBy: { timesBorrowed: "desc" }, take: 6, include: { category: true },
    });
    if (recommendedBooks.length === 0) {
        recommendedBooks = await prisma.book.findMany({
            where: { availableCopies: { gt: 0 }, id: { notIn: borrowedIds } },
            orderBy: { timesBorrowed: "desc" }, take: 6, include: { category: true },
        });
    }

    // Batch 4: activity logs & user details
    const activityLogs = await prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    const fullUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            createdAt: true,
        }
    });

    return (
        <AppShell>
            <StudentDashboardClient
                borrowedBooks={serializePrisma(borrowedBooks)} 
                borrowHistory={serializePrisma(borrowHistory)} 
                overdueBooks={serializePrisma(overdueBooks)}
                pendingRequests={serializePrisma(pendingRequests)} 
                readyRequests={serializePrisma(readyRequests)}
                dueSoonBooks={serializePrisma(dueSoonBooks)} 
                recommendedBooks={serializePrisma(recommendedBooks)}
                activityLogs={serializePrisma(activityLogs)}
                profile={serializePrisma(profile)}
                userInfo={serializePrisma(fullUser)}
                stats={{
                    totalBorrowed,
                    booksReturned,
                    currentBorrowed: borrowedBooks.length,
                    booksThisMonth,
                    maxLimit: profile?.maxBooksAllowed ?? 7,
                    remainingSlots: (profile?.maxBooksAllowed ?? 7) - borrowedBooks.length,
                    totalFines: parseFloat((totalFinesAgg._sum.fineAmount ?? 0).toString()),
                    unpaidFines: parseFloat((unpaidFinesAgg._sum.fineAmount ?? 0).toString()),
                    totalBooksRead: profile?.totalBooksRead ?? booksReturned,
                    readingBadge: profile?.readingBadge || "Scholar",
                }}
                username={user.firstName || user.username}
            />
        </AppShell>
    );
}
