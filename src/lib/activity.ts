import { prisma } from "./prisma";
import type { ActivityAction } from "@prisma/client";

/** Log an activity — mirrors Django's log_activity() */
export async function logActivity(
    userId: number | null,
    action: ActivityAction,
    description: string,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                description,
                ipAddress: ipAddress ?? null,
                userAgent: userAgent ?? "",
            },
        });
    } catch (err) {
        // Never let logging crash the main flow
        console.error("[ActivityLog] Failed:", err);
    }
}
