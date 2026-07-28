/**
 * Normalizes Django/Render env var names into Next.js equivalents.
 * Import this module before any code reads process.env for app config.
 *
 * Paste Render exports as-is — aliases are applied automatically.
 * Local overrides in .env.local (e.g. SITE_URL=http://localhost:3000) win.
 */

function setIfMissing(target: string, source: string): void {
    if (!process.env[target]?.trim() && process.env[source]?.trim()) {
        process.env[target] = process.env[source]!.trim();
    }
}

/** Django SECRET_KEY → NextAuth secrets */
function mapAuthSecrets(): void {
    setIfMissing("NEXTAUTH_SECRET", "SECRET_KEY");
    setIfMissing("AUTH_SECRET", "SECRET_KEY");
    setIfMissing("AUTH_SECRET", "NEXTAUTH_SECRET");
    setIfMissing("NEXTAUTH_SECRET", "AUTH_SECRET");
}

/** Django SITE_* → Next.js public site vars */
function mapSiteConfig(): void {
    // Non-public vars are safe to set at runtime
    setIfMissing("NEXTAUTH_URL", "SITE_URL");
    setIfMissing("NEXTAUTH_URL", "NEXT_PUBLIC_SITE_URL");
    // NEXT_PUBLIC_* vars are baked in at build time — skip runtime assignment
    // to avoid the SWC minifier inlining them as string literals in edge bundles
    setIfMissing("SITE_URL", "NEXT_PUBLIC_SITE_URL");
}

/** Django STRIPE_PUBLIC_KEY → NEXT_PUBLIC_STRIPE_PUBLIC_KEY (build-time only) */
function mapPaymentKeys(): void {
    // NEXT_PUBLIC_* is baked in at build time; just ensure the non-public alias works
    setIfMissing("STRIPE_PUBLIC_KEY", "NEXT_PUBLIC_STRIPE_PUBLIC_KEY");
}

/** Gmail SMTP vars from Django → Brevo (if Brevo not configured) */
function mapEmailConfig(): void {
    setIfMissing("BREVO_SMTP_USER", "EMAIL_HOST_USER");
    setIfMissing("BREVO_SMTP_PASSWORD", "EMAIL_HOST_PASSWORD");
}

/**
 * Prisma needs a direct Postgres URL for migrations.
 * Derive from DATABASE_URL when DIRECT_URL is missing (common on Render/Supabase).
 * Also handles LOCAL_DATABASE_URL override for local dev and SUPABASE_DATABASE_URL fallback.
 */
function deriveDirectDatabaseUrl(): void {
    const isPrismaCli = typeof process !== "undefined" &&
        Array.isArray((process as any).argv) &&
        (process as any).argv.some((arg: string) => arg.includes("prisma") || arg.endsWith("prisma"));

    // If running inside Prisma CLI (e.g. migrations), force local DB override if defined
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

/** On Vercel preview/production, fall back to VERCEL_URL when site URL is unset. */
function mapVercelUrls(): void {
    if (!process.env.VERCEL_URL) return;

    const vercelOrigin = `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;

    // Only fill gaps — .env.local / dashboard values always win
    // Note: NEXT_PUBLIC_* vars are inlined at build time, so we only set
    // the non-public variants that are safe to assign at runtime.
    if (!process.env.NEXTAUTH_URL?.trim()) {
        process.env.NEXTAUTH_URL = vercelOrigin;
    }
    if (!process.env.SITE_URL?.trim()) {
        process.env.SITE_URL = vercelOrigin;
    }
}

let loaded = false;

export function loadEnv(): void {
    if (loaded) return;
    loaded = true;

    mapAuthSecrets();
    mapSiteConfig();
    mapPaymentKeys();
    mapEmailConfig();
    deriveDirectDatabaseUrl();
    mapVercelUrls();

    if (process.env.AUTH_TRUST_HOST !== "false") {
        process.env.AUTH_TRUST_HOST = "true";
    }


}

// Eager load when this module is imported
loadEnv();
