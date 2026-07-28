import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(user.id);

    const request = await prisma.bookRequest.findUnique({ where: { id: parseInt(id) } });
    if (!request || request.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["pending", "ready"].includes(request.status)) return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    await prisma.bookRequest.update({
        where: { id: request.id },
        data: { status: "cancelled", cancellationReason: body.reason ?? "Cancelled by user" },
    });

    return NextResponse.json({ success: true });
}
