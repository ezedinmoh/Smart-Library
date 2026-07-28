import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import ReservationsClient from "./ReservationsClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Manage Reservations - Smart Library" };

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
    await requireAdmin();
    const params = await searchParams;
    const q = params.q?.trim() || "";
    const statusFilter = params.status?.trim() || "";

    // Stats aggregation
    const allRequests = await prisma.bookRequest.findMany({
        select: { status: true }
    });
    
    const stats = {
        pending: 0, ready: 0, fulfilled: 0, cancelled: 0, rejected: 0, all: 0
    };
    allRequests.forEach(r => {
        if (stats.hasOwnProperty(r.status)) {
            stats[r.status as keyof typeof stats]++;
        }
        stats.all++;
    });

    const whereClause: any = {};
    if (statusFilter && statusFilter !== "all") {
        whereClause.status = statusFilter;
    }
    if (q) {
        whereClause.OR = [
            { user: { username: { contains: q } } },
            { book: { title: { contains: q } } }
        ];
    }

    const requests = await prisma.bookRequest.findMany({
        where: whereClause,
        include: { user: { select: { username: true, email: true } }, book: { select: { title: true, author: true, availableCopies: true } } },
        orderBy: { requestDate: "desc" },
    });

    return <AppShell><ReservationsClient requests={serializePrisma(requests)} stats={stats} initialSearch={q} initialStatus={statusFilter} /></AppShell>;
}
