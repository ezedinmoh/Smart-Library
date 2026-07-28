import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import UserDetailClient from "./UserDetailClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "User Detail - Smart Library" };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();
    const { id: idStr } = await params;
    const userId = parseInt(idStr);

    const [user, profile, borrowRecords, activeBorrows, overdueBorrows, pendingRequests, finesAgg, unpaidAgg] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.userProfile.findUnique({ where: { userId } }),
        prisma.borrowRecord.findMany({ where: { userId }, include: { book: true }, orderBy: { borrowDate: "desc" }, take: 10 }),
        prisma.borrowRecord.count({ where: { userId, status: { in: ["borrowed", "overdue"] } } }),
        prisma.borrowRecord.count({ where: { userId, status: "overdue" } }),
        prisma.bookRequest.findMany({ where: { userId, status: "pending" }, include: { book: true }, take: 5 }),
        prisma.borrowRecord.aggregate({ where: { userId, fineAmount: { gt: 0 } }, _sum: { fineAmount: true } }),
        prisma.borrowRecord.aggregate({ where: { userId, fineAmount: { gt: 0 }, finePaid: false }, _sum: { fineAmount: true } }),
    ]);

    if (!user) notFound();
    const validUntil = new Date(); validUntil.setFullYear(validUntil.getFullYear() + 4);

    const safeProfile = profile ? {
        ...profile,
        totalFines: profile.totalFines ? parseFloat(profile.totalFines.toString()) : 0
    } : null;

    const safeBorrowRecords = borrowRecords.map(r => ({
        ...r,
        fineAmount: r.fineAmount ? parseFloat(r.fineAmount.toString()) : 0
    }));

    return (
        <AppShell>
            <UserDetailClient
                user={user} profile={safeProfile}
                borrowRecords={safeBorrowRecords}
                totalBorrowed={await prisma.borrowRecord.count({ where: { userId } })}
                totalReturned={await prisma.borrowRecord.count({ where: { userId, status: "returned" } })}
                activeBorrows={activeBorrows} overdueBorrows={overdueBorrows}
                pendingRequests={pendingRequests}
                totalFines={parseFloat((finesAgg._sum.fineAmount ?? 0).toString())}
                unpaidFines={parseFloat((unpaidAgg._sum.fineAmount ?? 0).toString())}
                validUntil={validUntil}
            />
        </AppShell>
    );
}
