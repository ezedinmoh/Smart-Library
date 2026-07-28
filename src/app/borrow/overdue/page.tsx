import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import OverdueClient from "./OverdueClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Overdue Books - Smart Library" };

export default async function OverduePage() {
    await requireLibrarianOrAdmin();

    const [records, settings] = await Promise.all([
        prisma.borrowRecord.findMany({
            where: { OR: [{ status: "overdue" }, { status: "returned", fineAmount: { gt: 0 } }] },
            include: { user: true, book: true },
            orderBy: [{ finePaid: "asc" }, { dueDate: "asc" }],
        }),
        prisma.systemSettings.findUnique({ where: { id: 1 } }),
    ]);

    const etbToUsd = parseFloat((settings?.etbToUsdRate ?? 0.018).toString());
    const currentlyOverdue = records.filter(r => r.status === "overdue");
    const totalFines = currentlyOverdue.reduce((s, r) => s + parseFloat(r.fineAmount.toString()), 0);
    const unpaidFines = currentlyOverdue.filter(r => !r.finePaid).reduce((s, r) => s + parseFloat(r.fineAmount.toString()), 0);
    const paidFines = records.filter(r => r.finePaid).reduce((s, r) => s + parseFloat(r.fineAmount.toString()), 0);

    const { serializePrisma } = require("@/lib/utils");

    return (
        <AppShell>
            <OverdueClient
                records={serializePrisma(records)}
                totalFines={totalFines}
                unpaidFines={unpaidFines}
                paidFines={paidFines}
                unpaidCount={currentlyOverdue.filter(r => !r.finePaid).length}
                etbToUsd={etbToUsd}
            />
        </AppShell>
    );
}
