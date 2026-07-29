import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        hasGoogleClientId: !!(process.env.GOOGLE_CLIENT_ID?.trim() || process.env.AUTH_GOOGLE_ID?.trim()),
        hasGoogleClientSecret: !!(process.env.GOOGLE_CLIENT_SECRET?.trim() || process.env.AUTH_GOOGLE_SECRET?.trim()),
        hasGithubClientId: !!(process.env.GITHUB_CLIENT_ID?.trim() || process.env.AUTH_GITHUB_ID?.trim()),
        hasGithubClientSecret: !!(process.env.GITHUB_CLIENT_SECRET?.trim() || process.env.AUTH_GITHUB_SECRET?.trim()),
        hasAuthSecret: !!(process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || process.env.SECRET_KEY?.trim()),
        authUrl: process.env.AUTH_URL ?? null,
        nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
        siteUrl: process.env.SITE_URL ?? null,
        vercelEnv: process.env.VERCEL_ENV ?? null,
        vercelUrl: process.env.VERCEL_URL ?? null,
        vercelProjectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
    });
}
