import { requireAdmin } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import SystemAdminClient from "./SystemAdminClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "System Administration - Smart Library" };

import { prisma } from "@/lib/prisma";

export default async function SystemAdminPage() {
    await requireAdmin();

    const [settings, recentLogs, totalLogs] = await Promise.all([
        prisma.systemSettings.findFirst() || prisma.systemSettings.create({ data: {} }),
        prisma.activityLog.findMany({ 
            take: 5, 
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { username: true } } }
        }),
        prisma.activityLog.count()
    ]);

    // Prisma returns Decimal for finePerDay, convert it:
    const safeSettings = {
        ...settings,
        finePerDay: Number(settings.finePerDay)
    };

    return <AppShell><SystemAdminClient settings={safeSettings} recentLogs={recentLogs} totalLogs={totalLogs} /></AppShell>;
}
