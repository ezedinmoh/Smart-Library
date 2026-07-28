import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail, emailVerificationTemplate } from "@/lib/mail";
import { getSiteName, getSiteUrl } from "@/lib/env";
import crypto from "crypto";

const schema = z.object({
    username: z.string().min(3).max(150),
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().optional().default(""),
    lastName: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            const errors: Record<string, string> = {};
            parsed.error.errors.forEach(e => { errors[e.path[0] as string] = e.message; });
            return NextResponse.json({ errors }, { status: 400 });
        }

        const { username, email, password, firstName, lastName } = parsed.data;

        // Check uniqueness
        const [existingUsername, existingEmail] = await Promise.all([
            prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } }),
            prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
        ]);

        const errors: Record<string, string> = {};
        if (existingUsername) errors.username = "A user with this username already exists.";
        if (existingEmail) errors.email = "A user with this email already exists.";
        if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user (inactive until email verified)
        const user = await prisma.user.create({
            data: {
                username,
                email: email.toLowerCase(),
                password: hashedPassword,
                firstName,
                lastName,
                isActive: false,
                role: "student",
            },
        });

        // Create profile
        await prisma.userProfile.create({ data: { userId: user.id } });

        // Create email verification token
        const key = crypto.randomBytes(48).toString("hex");
        await prisma.emailAddress.create({
            data: { userId: user.id, email: email.toLowerCase(), verified: false, primary: true, key },
        });

        // Build verification URL
        const siteUrl = getSiteUrl();
        const activateUrl = `${siteUrl}/users/verify-email/${key}`;
        const siteName = getSiteName();

        // Send email (non-blocking)
        sendEmail({
            to: email,
            subject: `Verify your email for ${siteName}`,
            html: emailVerificationTemplate({ username, activateUrl, siteName }),
        }).catch(console.error);

        return NextResponse.json({ success: true, email, activateUrl }, { status: 201 });
    } catch (err) {
        console.error("[Register]", err);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}
