import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function GET() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Dump all data as JSON backup
    const [users, books, categories, borrowRecords, bookRequests, payments, settings, activityLogs] = await Promise.all([
        prisma.user.findMany(),
        prisma.book.findMany(),
        prisma.category.findMany(),
        prisma.borrowRecord.findMany(),
        prisma.bookRequest.findMany(),
        prisma.payment.findMany(),
        prisma.systemSettings.findMany(),
        prisma.activityLog.findMany({ take: 1000, orderBy: { createdAt: "desc" } }),
    ]);

    const backup = { timestamp: new Date().toISOString(), users, books, categories, borrowRecords, bookRequests, payments, settings, activityLogs };
    const json = JSON.stringify(backup, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    await logActivity(parseInt(u.id), "backup_created", `Database backup downloaded: db_backup_${timestamp}.json`);

    return new NextResponse(json, {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="db_backup_${timestamp}.json"`,
        },
    });
}
