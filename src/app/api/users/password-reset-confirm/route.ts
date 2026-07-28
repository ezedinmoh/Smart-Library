import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    const { token, email, password } = await req.json();
    if (!token || !email || !password) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const record = await prisma.verificationToken.findUnique({ where: { identifier_token: { identifier: email, token } } });
    if (!record || record.expires < new Date()) return NextResponse.json({ error: "Reset link is invalid or has expired." }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });

    return NextResponse.json({ success: true });
}
