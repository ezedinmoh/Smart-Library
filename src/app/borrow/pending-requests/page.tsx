import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import PendingRequestsClient from "./PendingRequestsClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Pending Requests - Smart Library" };

export default async function PendingRequestsPage() {
    await requireLibrarianOrAdmin();
    const requests = await prisma.bookRequest.findMany({
        where: { status: "pending" },
        include: { user: { include: { profile: true } }, book: { include: { category: true } } },
        orderBy: { requestDate: "asc" },
    });
    const plainRequests = JSON.parse(JSON.stringify(requests));
    return <AppShell><PendingRequestsClient requests={plainRequests} /></AppShell>;
}
