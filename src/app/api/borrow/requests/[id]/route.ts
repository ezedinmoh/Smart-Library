import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(user.id);

    const request = await prisma.bookRequest.findUnique({ where: { id: parseInt(id) } });
    if (!request || request.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["rejected", "cancelled"].includes(request.status)) return NextResponse.json({ error: "Only rejected/cancelled can be deleted" }, { status: 400 });

    await prisma.bookRequest.delete({ where: { id: request.id } });
    return NextResponse.json({ success: true });
}
