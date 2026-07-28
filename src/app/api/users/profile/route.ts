import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function PATCH(req: NextRequest) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(user.id);
    const { firstName, lastName, email, phoneNumber, address } = await req.json();

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    const conflict = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, id: { not: userId } } });
    if (conflict) return NextResponse.json({ error: "Email is already taken" }, { status: 400 });

    await prisma.user.update({ where: { id: userId }, data: { firstName: firstName ?? "", lastName: lastName ?? "", email: email.toLowerCase(), phoneNumber: phoneNumber ?? "", address: address ?? "" } });
    return NextResponse.json({ success: true });
}
