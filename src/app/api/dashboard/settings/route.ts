import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { defaultBorrowLimit, finePerDay, etbToUsdRate, maxBorrowDays, applyToAll } = await req.json();
    await prisma.systemSettings.upsert({
        where: { id: 1 },
        create: { id: 1, defaultBorrowLimit, finePerDay, etbToUsdRate, maxBorrowDays, updatedById: parseInt(u.id) },
        update: { defaultBorrowLimit, finePerDay, etbToUsdRate, maxBorrowDays, updatedById: parseInt(u.id) },
    });

    if (applyToAll) {
        await prisma.userProfile.updateMany({
            data: { maxBorrowLimit: defaultBorrowLimit }
        });
        await logActivity(parseInt(u.id), "settings_updated", `System settings updated and applied borrow limit (${defaultBorrowLimit}) to all users`);
    } else {
        await logActivity(parseInt(u.id), "settings_updated", "System settings updated");
    }

    return NextResponse.json({ success: true });
}
