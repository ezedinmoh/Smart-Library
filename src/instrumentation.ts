/** Runs before the Next.js server starts — normalizes env vars and pre-warms the DB connection. */
export async function register() {
    // Only execute Node.js-specific setups when running on Node.js runtime (not Edge)
    if (process.env.NEXT_RUNTIME === "nodejs") {
        try {
            const dns = await import("node:dns");
            dns.setDefaultResultOrder("ipv4first");
        } catch {
            // Non-fatal
        }

        // Fix TLS issues in WSL/Node 24 — must set BEFORE any HTTPS requests
        if (!process.env.NODE_EXTRA_CA_CERTS) {
            process.env.NODE_EXTRA_CA_CERTS = "/etc/ssl/certs/ca-certificates.crt";
        }

        await import("@/lib/load-env");

        try {
            const { prisma } = await import("@/lib/prisma");
            await prisma.$connect();
        } catch {
            // Non-fatal
        }
    } else {
        await import("@/lib/load-env");
    }
}
