import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Routes that require authentication
const protectedRoutes = [
    "/dashboard",
    "/books/create",
    "/books/manage",
    "/borrow/my-books",
    "/borrow/history",
    "/borrow/request-list",
    "/borrow/pending-requests",
    "/borrow/all-records",
    "/borrow/overdue",
    "/borrow/issue-return",
    "/users/profile",
    "/users/list",
    "/users/notifications",
    "/payments",
];

// Routes only for unauthenticated users (redirect if logged in)
const authRoutes = ["/users/login", "/users/register"];

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session?.user;
    const role = (session?.user as { role?: string } | undefined)?.role;

    const isProtected = protectedRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
    );

    // Redirect authenticated users away from login/register
    if (isAuthRoute && isLoggedIn) {
        if (role === "admin") return NextResponse.redirect(new URL("/dashboard/admin", nextUrl));
        if (role === "librarian") return NextResponse.redirect(new URL("/dashboard/librarian", nextUrl));
        return NextResponse.redirect(new URL("/dashboard/student", nextUrl));
    }

    // Redirect unauthenticated users to login
    if (isProtected && !isLoggedIn) {
        const loginUrl = new URL("/users/login", nextUrl);
        loginUrl.searchParams.set("next", nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|images|enhanced.js|auth-enhanced.js|batch_operations.js).*)",
    ],
};
