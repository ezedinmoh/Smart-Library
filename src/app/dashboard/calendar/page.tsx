import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import CalendarClient from "./CalendarClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Due Dates Calendar - Smart Library" };

export default async function CalendarPage() {
    const user = await requireAuth();
    const userId = parseInt(user.id);

    let records;
    if (user.role === "student") {
        records = await prisma.borrowRecord.findMany({
            where: { userId, status: { in: ["borrowed", "overdue"] } },
            include: { book: true, user: true },
        });
    } else {
        records = await prisma.borrowRecord.findMany({
            where: { status: { in: ["borrowed", "overdue"] } },
            include: { book: true, user: true },
        });
    }

    const events = records.map(r => ({
        title: user.role === "student" ? `Return: ${r.book.title}` : `${r.user.username}: ${r.book.title}`,
        start: new Date(r.dueDate).toISOString().split("T")[0],
        color: r.status === "overdue" ? "#ef4444" : "#10b981",
        url: `/books/${r.bookId}`,
        status: r.status,
        fine: parseFloat(r.fineAmount.toString()),
    }));

    return <AppShell><CalendarClient events={events} /></AppShell>;
}
