import "@/lib/load-env";
import { PrismaClient } from "@prisma/client";
import net from "net";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    activeClient: PrismaClient | undefined;
    connectionCheckPromise: Promise<PrismaClient> | undefined;
};

function parseHostPort(urlStr: string) {
    try {
        const url = new URL(urlStr);
        return {
            host: url.hostname,
            port: parseInt(url.port || "5432", 10),
        };
    } catch {
        return null;
    }
}

function checkReachable(host: string, port: number, timeoutMs = 800): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let resolved = false;

        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                resolve(false);
            }
        }, timeoutMs);

        socket.connect(port, host, () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                socket.end();
                resolve(true);
            }
        });

        socket.on("error", () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                socket.destroy();
                resolve(false);
            }
        });
    });
}

async function getOrInitClient(): Promise<PrismaClient> {
    if (globalForPrisma.activeClient) return globalForPrisma.activeClient;
    if (globalForPrisma.connectionCheckPromise) return globalForPrisma.connectionCheckPromise;

    const promise = (async () => {
        const primaryUrl = process.env.DATABASE_URL || "";
        const fallbackUrl = process.env.LOCAL_DATABASE_URL || "";

        let useUrl = primaryUrl;

        // Only do reachability check if primary is a REMOTE host and fallback is configured
        const isRemote = primaryUrl &&
            !primaryUrl.includes("127.0.0.1") &&
            !primaryUrl.includes("localhost");

        if (isRemote && fallbackUrl) {
            const hp = parseHostPort(primaryUrl);
            if (hp) {
                const isReachable = await checkReachable(hp.host, hp.port, 800);
                if (!isReachable) {
                    console.warn(`[Database] Primary (${hp.host}) unreachable — using local PostgreSQL.`);
                    useUrl = fallbackUrl;
                } else {
                    console.log(`[Database] Connected to remote: ${hp.host}`);
                }
            }
        } else if (!isRemote) {
            console.log("[Database] Using local PostgreSQL.");
        }

        const baseClient = new PrismaClient({
            datasources: {
                db: {
                    url: useUrl,
                },
            },
            log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        });

        const extendedClient = baseClient.$extends({
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
                    }
                }
            }
        }) as unknown as PrismaClient;

        // Pre-connect; if it fails, clear so the next request retries
        baseClient.$connect().catch((err: Error) => {
            console.error("\n╔══════════════════════════════════════════════════════════╗");
            console.error("║           ❌  DATABASE CONNECTION FAILED                 ║");
            console.error(`║  ${err.message.split("\n")[0].substring(0, 56).padEnd(56)} ║`);
            console.error("╚══════════════════════════════════════════════════════════╝\n");
            globalForPrisma.activeClient = undefined;
            globalForPrisma.connectionCheckPromise = undefined;
        });

        if (process.env.NODE_ENV !== "production") {
            globalForPrisma.activeClient = extendedClient;
        }

        return extendedClient;
    })();

    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.connectionCheckPromise = promise;
    }

    return promise;
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

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
