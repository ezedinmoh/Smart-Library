import "@/lib/load-env";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    activeClient: PrismaClient | undefined;
    connectionCheckPromise: Promise<PrismaClient> | undefined;
};


async function verifyConnection(baseClient: PrismaClient, timeoutMs = 2500): Promise<boolean> {
    try {
        const queryPromise = baseClient.$queryRaw`SELECT 1`;
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Database connection timeout")), timeoutMs)
        );
        await Promise.race([queryPromise, timeoutPromise]);
        return true;
    } catch {
        return false;
    }
}

function wrapExtendedClient(baseClient: PrismaClient): PrismaClient {
    return baseClient.$extends({
        query: {
            user: {
                async create({ args, query }) {
                    if (args.data) {
                        if (!args.data.password) {
                            args.data.password = "!"; // Django-compatible unusable password
                        }
                        if (!args.data.username) {
                            const baseUsername = args.data.email
                                ? args.data.email.split("@")[0].substring(0, 130)
                                : "user_" + Math.random().toString(36).substring(2, 8);
                            args.data.username = `${baseUsername}_${Math.random().toString(36).substring(2, 6)}`;
                        }
                    }
                    return query(args);
                },
            },
        },
    }) as unknown as PrismaClient;
}

async function getOrInitClient(): Promise<PrismaClient> {
    if (globalForPrisma.activeClient) return globalForPrisma.activeClient;
    if (globalForPrisma.connectionCheckPromise) return globalForPrisma.connectionCheckPromise;

    const promise = (async () => {
        const primaryUrl = process.env.DATABASE_URL || "";
        const fallbackUrl = process.env.LOCAL_DATABASE_URL || "";

        const isRemote = primaryUrl &&
            !primaryUrl.includes("127.0.0.1") &&
            !primaryUrl.includes("localhost");

        // In non-production (local development), test remote DB first; if unavailable, seamlessly fall back
        if (process.env.NODE_ENV !== "production" && isRemote && fallbackUrl) {
            const primaryBase = new PrismaClient({
                datasources: { db: { url: primaryUrl } },
                log: ["error"],
            });

            const isHealthy = await verifyConnection(primaryBase, 2000);

            if (!isHealthy) {
                console.warn("\n⚠️  [Database] Remote database unreachable or paused — seamlessly using local PostgreSQL.\n");
                await primaryBase.$disconnect().catch(() => {});
                const localBase = new PrismaClient({
                    datasources: { db: { url: fallbackUrl } },
                    log: ["error", "warn"],
                });
                const client = wrapExtendedClient(localBase);
                globalForPrisma.activeClient = client;
                return client;
            }

            console.log("[Database] Connected to remote PostgreSQL.");
            const client = wrapExtendedClient(primaryBase);
            globalForPrisma.activeClient = client;
            return client;
        }

        const baseClient = new PrismaClient({
            datasources: { db: { url: primaryUrl || fallbackUrl } },
            log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        });
        const client = wrapExtendedClient(baseClient);
        globalForPrisma.activeClient = client;
        return client;
    })();

    globalForPrisma.connectionCheckPromise = promise;

    try {
        const client = await promise;
        return client;
    } catch (err) {
        globalForPrisma.activeClient = undefined;
        globalForPrisma.connectionCheckPromise = undefined;
        throw err;
    }
}

// Export a Proxy of PrismaClient that resolves the active connection on-demand
export const prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
        if (prop === "then") return undefined;
        if (prop === "$connect") return () => getOrInitClient().then(c => c.$connect());
        if (prop === "$disconnect") return () => getOrInitClient().then(c => c.$disconnect());
        if (prop === "$transaction") return (...args: any[]) => getOrInitClient().then(c => (c as any).$transaction(...args));
        if (prop === "$queryRaw") return (...args: any[]) => getOrInitClient().then(c => (c as any).$queryRaw(...args));
        if (prop === "$executeRaw") return (...args: any[]) => getOrInitClient().then(c => (c as any).$executeRaw(...args));
        if (prop === "$queryRawUnsafe") return (...args: any[]) => getOrInitClient().then(c => (c as any).$queryRawUnsafe(...args));
        if (prop === "$executeRawUnsafe") return (...args: any[]) => getOrInitClient().then(c => (c as any).$executeRawUnsafe(...args));

        return new Proxy({}, {
            get(subTarget, subProp) {
                return (...args: any[]) => {
                    return getOrInitClient().then((client) => {
                        const model = (client as any)[prop];
                        if (!model) {
                            throw new Error(`Model ${String(prop)} not found on Prisma Client`);
                        }
                        const method = model[subProp];
                        if (typeof method !== "function") {
                            return method;
                        }
                        return method.apply(model, args);
                    });
                };
            }
        });
    }
});

globalForPrisma.prisma = prisma;

