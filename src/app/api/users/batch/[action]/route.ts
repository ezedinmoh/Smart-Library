import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
    const { action: batchAction } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "No IDs provided." }, { status: 400 });

    const selfId = parseInt(u.id);
    const safeIds = ids.filter((id: number) => id !== selfId);

    if (batchAction === "activate") {
        await prisma.user.updateMany({ where: { id: { in: safeIds } }, data: { isActive: true } });
    } else if (batchAction === "deactivate") {
        await prisma.user.updateMany({ where: { id: { in: safeIds } }, data: { isActive: false } });
    } else if (batchAction === "delete") {
        await prisma.user.deleteMany({ where: { id: { in: safeIds } } });
    } else {
        return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: safeIds.length });
}
