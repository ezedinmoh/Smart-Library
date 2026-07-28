import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const username = req.nextUrl.searchParams.get("username") ?? "";
    if (!username) return NextResponse.json({ available: true });
    const exists = await prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });
    return NextResponse.json({ available: !exists });
}
