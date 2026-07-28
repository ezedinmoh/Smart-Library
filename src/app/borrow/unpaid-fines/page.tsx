import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import AppShell from "@/components/layout/AppShell";
import UnpaidFinesClient from "./UnpaidFinesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Unpaid Books & Fines - Smart Library Management",
    description: "View and pay outstanding fines for overdue borrowed books."
};

export default async function UnpaidFinesPage() {
    const user = await requireAuth();
    const userId = parseInt(user.id);
    const now = new Date();

    // Fetch all overdue or unpaid fine borrow records for this user
    const records = await prisma.borrowRecord.findMany({
        where: {
            userId,
            OR: [
                { status: "issued", dueDate: { lt: now } },
                { status: "overdue" },
                { finePaid: false, fineAmount: { gt: 0 } }
            ]
        },
        include: {
            book: {
                include: { category: true }
            }
        },
        orderBy: { dueDate: "asc" }
    });

    const formatted = records.map(r => {
        const due = new Date(r.dueDate);
        const diffMs = now.getTime() - due.getTime();
        const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const fineVal = Number(r.fineAmount);
        const fineAmount = fineVal > 0 ? fineVal : daysOverdue * 10;

        return {
            id: r.id,
            issueDate: r.borrowDate ? new Date(r.borrowDate).toISOString() : now.toISOString(),
            dueDate: r.dueDate ? new Date(r.dueDate).toISOString() : now.toISOString(),
            status: r.status,
            daysOverdue,
            fineAmount,
            finePaid: r.finePaid,
            book: {
                id: r.book.id,
                title: r.book.title,
                author: r.book.author,
                coverImage: r.book.coverImage,
                isbn: r.book.isbn,
                categoryName: r.book.category?.name || "Uncategorized"
            }
        };
    });

    const totalFines = formatted.reduce((acc, r) => acc + (r.finePaid ? 0 : r.fineAmount), 0);

    return (
        <AppShell>
            <UnpaidFinesClient
                records={serializePrisma(formatted)}
                totalFines={totalFines}
                userRole={user.role}
            />
        </AppShell>
    );
}
