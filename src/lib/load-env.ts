/**
 * Normalizes env var names for NextAuth v5 compatibility.
 * Import this module before any code reads process.env for app config.
 *
 * Priority order for site URL (highest to lowest):
 *   AUTH_URL > NEXTAUTH_URL > SITE_URL > NEXT_PUBLIC_SITE_URL
 *   > VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL > localhost
 */

function setIfMissing(target: string, source: string): void {
    if (!process.env[target]?.trim() && process.env[source]?.trim()) {
        process.env[target] = process.env[source]!.trim();
    }
}

function stripTrailingSlash(url: string): string {
    return url.replace(/\/+$/, "");
}

function ensureHttps(url: string): string {
    const cleaned = url.replace(/^https?:\/\//, "");
    return `https://${cleaned}`;
}

/** Sync NextAuth v4 ↔ v5 secret names */
function mapAuthSecrets(): void {
    setIfMissing("NEXTAUTH_SECRET", "SECRET_KEY");
    setIfMissing("AUTH_SECRET", "SECRET_KEY");
    // Sync in both directions — whichever is set, copy to the other
    setIfMissing("AUTH_SECRET", "NEXTAUTH_SECRET");
    setIfMissing("NEXTAUTH_SECRET", "AUTH_SECRET");
}

/**
 * Resolve the canonical site URL for NextAuth v5.
 *
 * NextAuth v5 reads AUTH_URL as its primary URL. NEXTAUTH_URL is the v4 compat name.
 * This function ensures AUTH_URL is always set to the correct production URL.
 *
 * Resolution priority:
 *   1. AUTH_URL (explicitly set — wins always)
 *   2. NEXTAUTH_URL (v4 compat — common in Vercel dashboards)
 *   3. SITE_URL / NEXT_PUBLIC_SITE_URL (custom app vars)
 *   4. VERCEL_PROJECT_PRODUCTION_URL (Vercel auto-var for production domain)
 *   5. VERCEL_URL (Vercel auto-var — may be a preview/deployment URL)
 *   6. http://localhost:3000 (local fallback)
 */
function resolveAndSetSiteUrl(): void {
    const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;

    // Safeguard: If running on Vercel, discard any accidentally imported localhost values
    if (isVercel) {
        if (process.env.AUTH_URL?.includes("localhost") || process.env.AUTH_URL?.includes("127.0.0.1")) {
            delete process.env.AUTH_URL;
        }
        if (process.env.NEXTAUTH_URL?.includes("localhost") || process.env.NEXTAUTH_URL?.includes("127.0.0.1")) {
            delete process.env.NEXTAUTH_URL;
        }
        if (process.env.SITE_URL?.includes("localhost") || process.env.SITE_URL?.includes("127.0.0.1")) {
            delete process.env.SITE_URL;
        }
        if (process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost") || process.env.NEXT_PUBLIC_SITE_URL?.includes("127.0.0.1")) {
            delete process.env.NEXT_PUBLIC_SITE_URL;
        }
    }

    // Step 1: Build candidate list in priority order
    const candidates = [
        process.env.AUTH_URL,
        process.env.NEXTAUTH_URL,
        process.env.SITE_URL,
        process.env.NEXT_PUBLIC_SITE_URL,
        // VERCEL_PROJECT_PRODUCTION_URL is always the custom/production domain
        process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? ensureHttps(process.env.VERCEL_PROJECT_PRODUCTION_URL)
            : undefined,
        // VERCEL_URL is deployment-specific; use as fallback on Vercel
        process.env.VERCEL_URL
            ? ensureHttps(process.env.VERCEL_URL)
            : undefined,
    ];

    // Step 2: Pick first valid non-localhost value on Vercel, or localhost when offline
    const resolved = candidates
        .map((c) => (c ? stripTrailingSlash(c.trim()) : ""))
        .find((c) => c.length > 0 && (!isVercel || (!c.includes("localhost") && !c.includes("127.0.0.1")))) ?? "http://localhost:3000";

    // Step 3: Set all URL vars to the resolved value
    process.env.AUTH_URL = resolved;
    process.env.NEXTAUTH_URL = resolved;
    process.env.SITE_URL = resolved;
}

/** Django STRIPE_PUBLIC_KEY → NEXT_PUBLIC_STRIPE_PUBLIC_KEY (build-time only) */
function mapPaymentKeys(): void {
    setIfMissing("STRIPE_PUBLIC_KEY", "NEXT_PUBLIC_STRIPE_PUBLIC_KEY");
}

/** Gmail SMTP vars → Brevo (if Brevo not configured) */
function mapEmailConfig(): void {
    setIfMissing("BREVO_SMTP_USER", "EMAIL_HOST_USER");
    setIfMissing("BREVO_SMTP_PASSWORD", "EMAIL_HOST_PASSWORD");
}

/** Sync NextAuth v5 standard OAuth env var names */
function mapOAuthKeys(): void {
    setIfMissing("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID");
    setIfMissing("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET");
    setIfMissing("GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID");
    setIfMissing("GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET");

    setIfMissing("AUTH_GITHUB_ID", "GITHUB_CLIENT_ID");
    setIfMissing("AUTH_GITHUB_SECRET", "GITHUB_CLIENT_SECRET");
    setIfMissing("GITHUB_CLIENT_ID", "AUTH_GITHUB_ID");
    setIfMissing("GITHUB_CLIENT_SECRET", "AUTH_GITHUB_SECRET");
}

/**
 * Prisma needs a direct Postgres URL for migrations.
 * Derive from DATABASE_URL when DIRECT_URL is missing (common on Supabase).
 */
function deriveDirectDatabaseUrl(): void {
    const isPrismaCli =
        typeof process !== "undefined" &&
        Array.isArray((process as any).argv) &&
        (process as any).argv.some(
            (arg: string) => arg.includes("prisma") || arg.endsWith("prisma")
        );

    // Inside Prisma CLI — force local DB if defined
    if (isPrismaCli && process.env.LOCAL_DATABASE_URL?.trim()) {
        process.env.DATABASE_URL = process.env.LOCAL_DATABASE_URL.trim();
        process.env.DIRECT_URL = process.env.LOCAL_DATABASE_URL.trim();
        return;
    }

    if (process.env.DIRECT_URL?.trim()) return;

    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) return;

    try {
        const url = new URL(databaseUrl);
        url.searchParams.delete("pgbouncer");
        url.searchParams.delete("connection_limit");

        if (url.port === "6543") {
            url.port = "5432";
        }

        // Supabase pooler → direct connection host
        const poolerMatch = url.hostname.match(
            /^aws-0-([a-z0-9-]+)\.pooler\.supabase\.com$/
        );
        const projectRef = url.username.includes(".")
            ? url.username.split(".")[1]
            : null;

        if (poolerMatch && projectRef) {
            url.hostname = `db.${projectRef}.supabase.co`;
            url.username = "postgres";
            url.port = "5432";
        }

        process.env.DIRECT_URL = url.toString();
    } catch {
        process.env.DIRECT_URL = databaseUrl;
    }
}

let loaded = false;

export function loadEnv(): void {
    if (loaded) return;
    loaded = true;

    mapAuthSecrets();
    mapOAuthKeys();
    resolveAndSetSiteUrl();
    mapPaymentKeys();
    mapEmailConfig();
    deriveDirectDatabaseUrl();

    // Always trust host — required for Vercel deployments and custom domains
    if (process.env.AUTH_TRUST_HOST !== "false") {
        process.env.AUTH_TRUST_HOST = "true";
    }
}

// Eager load when this module is imported
loadEnv();
