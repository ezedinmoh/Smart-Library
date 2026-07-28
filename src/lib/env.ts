import "@/lib/load-env";

/**
 * Environment helpers — resolves URLs correctly on localhost, Vercel preview, and production.
 *
 * Local:  SITE_URL or NEXT_PUBLIC_SITE_URL=http://localhost:3000 in .env.local
 * Vercel: set SITE_URL (or NEXT_PUBLIC_SITE_URL) to your production domain
 *         VERCEL_URL is used automatically when neither is set (preview deploys)
 */

function stripTrailingSlash(url: string): string {
    return url.replace(/\/+$/, "");
}

/** Base site URL used for email links, payment callbacks, etc. */
export function getSiteUrl(): string {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL);
    }
    if (process.env.NEXTAUTH_URL) {
        return stripTrailingSlash(process.env.NEXTAUTH_URL);
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return "http://localhost:3000";
}

export function getSiteName(): string {
    return process.env.NEXT_PUBLIC_SITE_NAME ?? "Smart Library Management System";
}

/** True when OAuth provider credentials are configured */
export function hasGoogleOAuth(): boolean {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function hasGitHubOAuth(): boolean {
    return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function isOAuthConfigured(provider: "google" | "github"): boolean {
    return provider === "google" ? hasGoogleOAuth() : hasGitHubOAuth();
}
