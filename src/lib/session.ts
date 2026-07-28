import { auth } from "./auth";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/types";

/** Get the current session user or return null */
export async function getSessionUser(): Promise<SessionUser | null> {
    const session = await auth();
    if (!session?.user) return null;
    return session.user as SessionUser;
}

/** Require authentication — redirects to login if not authenticated */
export async function requireAuth(): Promise<SessionUser> {
    const user = await getSessionUser();
    if (!user) redirect("/users/login");
    return user;
}

/** Require admin role */
export async function requireAdmin(): Promise<SessionUser> {
    const user = await requireAuth();
    if (user.role !== "admin") redirect("/dashboard");
    return user;
}

/** Require librarian or admin role */
export async function requireLibrarianOrAdmin(): Promise<SessionUser> {
    const user = await requireAuth();
    if (user.role !== "admin" && user.role !== "librarian") redirect("/dashboard");
    return user;
}

/** Require student role */
export async function requireStudent(): Promise<SessionUser> {
    const user = await requireAuth();
    if (user.role !== "student") redirect("/dashboard");
    return user;
}
