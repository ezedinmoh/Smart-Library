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

// PrismaAdapter expects String IDs — our User uses Int.
// This wrapper coerces types so OAuth sign-in works correctly.
function buildAdapter() {
    const adapter = PrismaAdapter(prisma);
    return {
        ...adapter,
        // Convert string userId back to Int for DB lookups
        getUserById: async (id: string) => {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(id) },
                include: { profile: true },
            });
            if (!user) return null;
            return { ...user, id: String(user.id) };
        },
        getUserByEmail: async (email: string) => {
            const user = await prisma.user.findFirst({
                where: { email: { equals: email, mode: "insensitive" } },
                include: { profile: true },
            });
            if (!user) return null;
            return { ...user, id: String(user.id) };
        },
        createUser: async (data: any) => {
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    username: data.email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() + Math.floor(Math.random() * 9999),
                    firstName: data.name?.split(" ")[0] ?? "",
                    lastName: data.name?.split(" ").slice(1).join(" ") ?? "",
                    password: "",
                    isActive: true,
                    role: "student",
                },
            });
            return { ...user, id: String(user.id) };
        },
        linkAccount: async (data: any) => {
            return prisma.account.create({
                data: { ...data, userId: parseInt(data.userId) },
            });
        },
        getUserByAccount: async ({ provider, providerAccountId }: { provider: string; providerAccountId: string }) => {
            const account = await prisma.account.findUnique({
                where: { provider_providerAccountId: { provider, providerAccountId } },
                include: { user: { include: { profile: true } } },
            });
            if (!account) return null;
            return { ...account.user, id: String(account.user.id) };
        },
    };
}

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
    adapter: buildAdapter() as any,
    // NextAuth v5 primary secret name is AUTH_SECRET; NEXTAUTH_SECRET is v4 compat
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    trustHost: true,
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
