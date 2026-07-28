import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { maxBooks } = await req.json();
    const val = parseInt(maxBooks);
    if (isNaN(val) || val < 1 || val > 20) return NextResponse.json({ error: "Value must be 1–20." }, { status: 400 });
    await prisma.userProfile.upsert({
        where: { userId: parseInt(id) },
        create: { userId: parseInt(id), maxBooksAllowed: val },
        update: { maxBooksAllowed: val },
    });
    return NextResponse.json({ success: true });
}
