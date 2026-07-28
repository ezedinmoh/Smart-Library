/** Runs before the Next.js server starts — normalizes env vars and pre-warms the DB connection. */
export async function register() {
    // Fix TLS issues in WSL/Node 24 — must set BEFORE any HTTPS requests
    if (!process.env.NODE_EXTRA_CA_CERTS) {
        process.env.NODE_EXTRA_CA_CERTS = "/etc/ssl/certs/ca-certificates.crt";
    }

    await import("@/lib/load-env");

    // Only pre-warm on the Node.js runtime (not Edge)
    if (process.env.NEXT_RUNTIME === "nodejs") {
        try {
            // Import and trigger DB connection early so first request doesn't pay the cold-start cost
            const { prisma } = await import("@/lib/prisma");
            await prisma.$connect();
        } catch {
            // Non-fatal — the app will retry on demand
        }
    }
}
