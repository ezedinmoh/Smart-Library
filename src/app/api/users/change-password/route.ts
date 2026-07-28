import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { oldPassword, newPassword } = await req.json();
    if (!newPassword || newPassword.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });

    const dbUser = await prisma.user.findUnique({ where: { id: parseInt(user.id) } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await verifyPassword(oldPassword, dbUser.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: dbUser.id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
}
