import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { role } = await req.json();
    if (!["admin", "librarian", "student"].includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (target.role === "admin" && role !== "admin") {
        const adminCount = await prisma.user.count({ where: { role: "admin", isActive: true } });
        if (adminCount <= 1) return NextResponse.json({ error: "Cannot remove the last admin." }, { status: 400 });
    }

    await prisma.user.update({ where: { id: target.id }, data: { role } });
    await logActivity(parseInt(u.id), "user_role_changed", `Changed ${target.username}'s role to ${role}`);
    return NextResponse.json({ success: true });
}
