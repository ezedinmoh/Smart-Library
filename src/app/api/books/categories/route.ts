import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, description } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required." }, { status: 400 });
    const exists = await prisma.category.findFirst({ where: { name: { equals: name.trim(), mode: "insensitive" } } });
    if (exists) return NextResponse.json({ error: `Category "${name}" already exists.` }, { status: 400 });
    const cat = await prisma.category.create({ data: { name: name.trim(), description: description ?? "" } });
    return NextResponse.json({ id: cat.id }, { status: 201 });
}
