import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

/**
 * Edge-compatible NextAuth config — safe for middleware.
 * Providers and DB logic live in auth.ts.
 */
export const authConfig = {
    pages: {
        signIn: "/users/login",
        error: "/users/login",
    },
    session: { strategy: "jwt" },
    trustHost: true,
    providers: [],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = (user as { username?: string }).username;
                token.role = (user as { role?: UserRole }).role;
                token.firstName = (user as { firstName?: string }).firstName;
                token.lastName = (user as { lastName?: string }).lastName;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                (session.user as { username?: string }).username = token.username as string;
                (session.user as { role?: UserRole }).role = token.role as UserRole;
                (session.user as { firstName?: string }).firstName = token.firstName as string;
                (session.user as { lastName?: string }).lastName = token.lastName as string;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
