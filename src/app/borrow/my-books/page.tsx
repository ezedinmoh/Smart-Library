import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import MyBooksClient from "./MyBooksClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "My Books - Smart Library" };

export default async function MyBooksPage() {
    const user = await requireAuth();
    const userId = parseInt(user.id);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [borrowedBooks, pendingRequests, readyRequests, rejectedRequests, cancelledRequests,
        returnedBooks, profile, systemSettings] = await Promise.all([
            prisma.borrowRecord.findMany({ where: { userId, status: { in: ["borrowed", "overdue"] } }, include: { book: { include: { category: true } } }, orderBy: { borrowDate: "desc" } }),
            prisma.bookRequest.findMany({ where: { userId, status: "pending" }, include: { book: { include: { category: true } } }, orderBy: { requestDate: "desc" } }),
            prisma.bookRequest.findMany({ where: { userId, status: "ready" }, include: { book: true, approvedBy: true }, orderBy: { approvedDate: "desc" } }),
            prisma.bookRequest.findMany({ where: { userId, status: "rejected", updatedAt: { gte: twoWeeksAgo } }, include: { book: true, approvedBy: true }, orderBy: { updatedAt: "desc" } }),
            prisma.bookRequest.findMany({ where: { userId, status: "cancelled", updatedAt: { gte: twoWeeksAgo } }, include: { book: true }, orderBy: { updatedAt: "desc" } }),
            prisma.borrowRecord.findMany({ where: { userId, status: "returned", returnDate: { gte: ninetyDaysAgo } }, include: { book: true }, orderBy: { returnDate: "desc" } }),
            prisma.userProfile.findUnique({ where: { userId } }),
            prisma.systemSettings.findUnique({ where: { id: 1 } }),
        ]);

    const { serializePrisma } = require("@/lib/utils");

    return (
        <AppShell>
            <MyBooksClient
                borrowedBooks={serializePrisma(borrowedBooks)}
                pendingRequests={serializePrisma(pendingRequests)}
                readyRequests={serializePrisma(readyRequests)}
                rejectedRequests={serializePrisma(rejectedRequests)}
                cancelledRequests={serializePrisma(cancelledRequests)}
                returnedBooks={serializePrisma(returnedBooks)}
                borrowedCount={borrowedBooks.length}
                maxLimit={profile?.maxBooksAllowed ?? 7}
                etbToUsd={parseFloat((systemSettings?.etbToUsdRate ?? 0.018).toString())}
            />
        </AppShell>
    );
}
