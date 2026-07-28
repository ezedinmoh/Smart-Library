import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail, emailVerificationTemplate } from "@/lib/mail";
import { getSiteName, getSiteUrl } from "@/lib/env";
import { logActivity } from "@/lib/activity";
import crypto from "crypto";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { username, email, password, firstName, lastName, role } = await req.json();
    const errors: Record<string, string> = {};

    if (!username || username.length < 3) errors.username = "Username must be at least 3 characters.";
    if (!email || !email.includes("@")) errors.email = "Valid email required.";
    if (!password || password.length < 8) errors.password = "Password min 8 chars.";
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

    const [dupUser, dupEmail] = await Promise.all([
        prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } }),
        prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
    ]);
    if (dupUser) errors.username = "Username already taken.";
    if (dupEmail) errors.email = "Email already registered.";
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
        data: { username, email: email.toLowerCase(), password: hashed, firstName: firstName ?? "", lastName: lastName ?? "", role: role ?? "student", isActive: false },
    });
    await prisma.userProfile.create({ data: { userId: newUser.id } });

    const key = crypto.randomBytes(48).toString("hex");
    await prisma.emailAddress.create({ data: { userId: newUser.id, email: newUser.email, verified: false, primary: true, key } });

    const siteUrl = getSiteUrl();
    const siteName = getSiteName();
    const activateUrl = `${siteUrl}/users/verify-email/${key}`;

    sendEmail({ to: newUser.email, subject: `Verify your ${siteName} email`, html: emailVerificationTemplate({ username: newUser.username, activateUrl, siteName }) }).catch(console.error);
    await logActivity(parseInt(u.id), "user_created", `Admin created user: ${newUser.username} (${role})`);

    return NextResponse.json({ success: true, id: newUser.id }, { status: 201 });
}
