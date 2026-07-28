import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("email") ?? "";
    if (!email) return NextResponse.json({ available: true });
    const exists = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    return NextResponse.json({ available: !exists });
}
