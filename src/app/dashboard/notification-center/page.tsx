import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import NotificationCenterClient from "./NotificationCenterClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Notification Center - Smart Library" };

export default async function NotificationCenterPage() {
    await requireLibrarianOrAdmin();

    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(today.getDate() + 3);

    const [overdueRecords, dueSoonRecords, unpaidFines, allUsers] = await Promise.all([
        prisma.borrowRecord.findMany({ where: { status: "overdue" }, include: { user: true, book: true }, orderBy: { dueDate: "asc" } }),
        prisma.borrowRecord.findMany({ where: { status: "borrowed", dueDate: { lte: in3Days, gte: today } }, include: { user: true, book: true }, orderBy: { dueDate: "asc" } }),
        prisma.borrowRecord.findMany({ where: { fineAmount: { gt: 0 }, finePaid: false }, include: { user: true, book: true }, orderBy: { dueDate: "asc" } }),
        prisma.user.findMany({ where: { isActive: true }, select: { id: true, username: true, email: true, role: true, firstName: true, lastName: true }, orderBy: { username: "asc" } }),
    ]);

    return (
        <AppShell>
            <NotificationCenterClient 
                overdueRecords={serializePrisma(overdueRecords)} 
                dueSoonRecords={serializePrisma(dueSoonRecords)} 
                unpaidFines={serializePrisma(unpaidFines)} 
                allUsers={serializePrisma(allUsers)} 
            />
        </AppShell>
    );
}
