import "@/lib/load-env";
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "./prisma";
import { hashPassword, shouldUpgradePasswordHash, verifyPassword } from "./password";
import { isOAuthConfigured } from "./env";
import { authConfig } from "./auth.config";

const providers: NextAuthConfig["providers"] = [
    CredentialsProvider({
        name: "credentials",
        credentials: {
            username: { label: "Username or Email", type: "text" },
            password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
            if (!credentials?.username || !credentials?.password) return null;

            const usernameOrEmail = credentials.username as string;
            const password = credentials.password as string;

            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: { equals: usernameOrEmail, mode: "insensitive" } },
                        { email: { equals: usernameOrEmail, mode: "insensitive" } },
                    ],
                },
                include: { profile: true },
            });

            if (!user) return null;
            if (!user.isActive) {
                throw new Error("EMAIL_NOT_VERIFIED");
            }

            const passwordMatch = await verifyPassword(password, user.password);
            if (!passwordMatch) return null;

            const loginUpdate: { lastLogin: Date; password?: string } = { lastLogin: new Date() };
            if (shouldUpgradePasswordHash(user.password)) {
                loginUpdate.password = await hashPassword(password);
            }

            await prisma.user.update({
                where: { id: user.id },
                data: loginUpdate,
            });

            return {
                id: String(user.id),
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                image: user.profile?.profilePicture ?? null,
            };
        },
    }),
];

if (isOAuthConfigured("google")) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        })
    );
}

if (isOAuthConfigured("github")) {
    providers.push(
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        })
    );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    providers,
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }) {
            if (account?.provider !== "credentials" && user.email) {
                const dbUser = await prisma.user.findFirst({
                    where: { email: { equals: user.email, mode: "insensitive" } },
                });
                if (dbUser) {
                    await prisma.userProfile.upsert({
                        where: { userId: dbUser.id },
                        create: { userId: dbUser.id },
                        update: {},
                    });
                }
            }
            return true;
        },
    },
    events: {
        async createUser({ user }) {
            const dbUser = await prisma.user.findFirst({
                where: { email: user.email! },
            });
            if (dbUser) {
                await prisma.userProfile.upsert({
                    where: { userId: dbUser.id },
                    create: { userId: dbUser.id },
                    update: {},
                });
            }
        },
    },
});
