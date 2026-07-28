import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, description } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required." }, { status: 400 });
    const dup = await prisma.category.findFirst({ where: { name: { equals: name.trim(), mode: "insensitive" }, id: { not: parseInt(id) } } });
    if (dup) return NextResponse.json({ error: `Category "${name}" already exists.` }, { status: 400 });
    await prisma.category.update({ where: { id: parseInt(id) }, data: { name: name.trim(), description: description ?? "" } });
    return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.category.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
}
