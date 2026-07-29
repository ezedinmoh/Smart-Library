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
        // Convert string userId back to Int for DB lookups and ensure AdapterUser interface compatibility
        getUserById: async (id: string) => {
            const userId = parseInt(id);
            if (isNaN(userId)) return null;
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true },
            });
            if (!user) return null;
            return {
                ...user,
                id: String(user.id),
                name: `${user.firstName} ${user.lastName}`.trim() || user.username,
                emailVerified: null,
            };
        },
        getUserByEmail: async (email: string) => {
            const user = await prisma.user.findFirst({
                where: { email: { equals: email, mode: "insensitive" } },
                include: { profile: true },
            });
            if (!user) return null;
            return {
                ...user,
                id: String(user.id),
                name: `${user.firstName} ${user.lastName}`.trim() || user.username,
                emailVerified: null,
            };
        },
        createUser: async (data: any) => {
            const email = data.email || "";
            const usernameBase = (email.split("@")[0] || "user").replace(/[^a-z0-9]/gi, "").toLowerCase();
            const username = `${usernameBase}${Math.floor(1000 + Math.random() * 9000)}`;
            const firstName = data.name?.split(" ")[0] ?? "";
            const lastName = data.name?.split(" ").slice(1).join(" ") ?? "";

            const user = await prisma.user.create({
                data: {
                    email,
                    username,
                    firstName,
                    lastName,
                    password: "",
                    isActive: true,
                    role: "student",
                    profile: {
                        create: {
                            profilePicture: data.image ?? null,
                        },
                    },
                },
                include: { profile: true },
            });
            return {
                ...user,
                id: String(user.id),
                name: `${user.firstName} ${user.lastName}`.trim() || user.username,
                emailVerified: null,
            };
        },
        linkAccount: async (data: any) => {
            const userId = typeof data.userId === "number" ? data.userId : parseInt(data.userId);
            const accountData = {
                userId,
                type: data.type,
                provider: data.provider,
                providerAccountId: String(data.providerAccountId),
                refresh_token: data.refresh_token ?? null,
                access_token: data.access_token ?? null,
                expires_at: data.expires_at ? Number(data.expires_at) : null,
                token_type: data.token_type ?? null,
                scope: data.scope ?? null,
                id_token: data.id_token ?? null,
                session_state: data.session_state ?? null,
            };
            return prisma.account.upsert({
                where: {
                    provider_providerAccountId: {
                        provider: data.provider,
                        providerAccountId: String(data.providerAccountId),
                    },
                },
                create: accountData,
                update: accountData,
            });
        },
        getUserByAccount: async ({ provider, providerAccountId }: { provider: string; providerAccountId: string }) => {
            const account = await prisma.account.findUnique({
                where: { provider_providerAccountId: { provider, providerAccountId } },
                include: { user: { include: { profile: true } } },
            });
            if (!account || !account.user) return null;
            return {
                ...account.user,
                id: String(account.user.id),
                name: `${account.user.firstName} ${account.user.lastName}`.trim() || account.user.username,
                emailVerified: null,
            };
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

const googleClientId = (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "").trim();
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || "").trim();

if (googleClientId && googleClientSecret) {
    providers.push(
        GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
        })
    );
}

const githubClientId = (process.env.GITHUB_CLIENT_ID || process.env.AUTH_GITHUB_ID || "").trim();
const githubClientSecret = (process.env.GITHUB_CLIENT_SECRET || process.env.AUTH_GITHUB_SECRET || "").trim();

if (githubClientId && githubClientSecret) {
    providers.push(
        GitHubProvider({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
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
