import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function POST() {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(user.id);
    const { count } = await prisma.bookRequest.deleteMany({ where: { userId, status: "rejected" } });
    return NextResponse.json({ success: true, count });
}
