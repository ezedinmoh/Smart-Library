import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const targetId = parseInt(id);
    if (targetId === parseInt(user.id)) return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (target.role === "admin") {
        const adminCount = await prisma.user.count({ where: { role: "admin", isActive: true } });
        if (adminCount <= 1) return NextResponse.json({ error: "Cannot delete the last admin." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: targetId } });
    await logActivity(parseInt(user.id), "user_updated", `Deleted user: ${target.username}`);
    return NextResponse.json({ success: true });
}
