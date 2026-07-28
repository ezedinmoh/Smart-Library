import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCloudinaryUrl } from "@/lib/utils";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";

export async function HEAD(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id: idStr } = await params;
    const bookId = parseInt(idStr);

    if (isNaN(bookId)) return new NextResponse(null, { status: 400 });

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || !book.pdfFile) return new NextResponse(null, { status: 404 });

    if (!session?.user) return new NextResponse(null, { status: 401 });
    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "librarian") {
        const hasRecord = await prisma.borrowRecord.findFirst({
            where: {
                userId: parseInt(session.user.id!),
                bookId,
                status: { in: ["borrowed", "issued", "overdue", "returned"] },
            },
        });
        if (!hasRecord && userRole !== "student") return new NextResponse(null, { status: 403 });
    }

    const rawValue = book.pdfFile.trim();
    const isAlreadyHttp = /^https?:\/\//i.test(rawValue);

    try {
        // Check if the PDF is reachable without downloading it
        const urlToCheck = isAlreadyHttp
            ? rawValue
            : resolveCloudinaryUrl(rawValue, "image") ?? null;

        if (urlToCheck) {
            // Cloudinary raw files don't support HEAD — use GET with abort
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 5000);
            try {
                const check = await fetch(urlToCheck, { method: "GET", signal: ctrl.signal });
                clearTimeout(timer);
                if (check.ok) return new NextResponse(null, { status: 200, headers: { "Content-Type": "application/pdf" } });
            } catch {
                clearTimeout(timer);
            }
        }

        // Local file fallback check
        if (!isAlreadyHttp) {
            const candidates = [
                path.resolve(process.cwd(), "media", rawValue),
                path.resolve(process.cwd(), rawValue.replace(/^\/+/, "")),
            ];
            if (candidates.some(p => fs.existsSync(p))) {
                return new NextResponse(null, { status: 200, headers: { "Content-Type": "application/pdf" } });
            }
        }

        return new NextResponse(null, { status: 404 });
    } catch {
        return new NextResponse(null, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id: idStr } = await params;
    const bookId = parseInt(idStr);

    if (isNaN(bookId)) return new NextResponse("Invalid Book ID", { status: 400 });

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || !book.pdfFile) return new NextResponse("Not Found", { status: 404 });

    // Authorization
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "librarian") {
        const hasRecord = await prisma.borrowRecord.findFirst({
            where: {
                userId: parseInt(session.user.id!),
                bookId,
                status: { in: ["borrowed", "issued", "overdue", "returned"] },
            },
        });
        if (!hasRecord && userRole !== "student") {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    const rawValue = book.pdfFile.trim();
    const isAlreadyHttp = /^https?:\/\//i.test(rawValue);

    try {
        // ── 1. Try Cloudinary (Django stores PDFs as "image" resource type) ──
        if (!isAlreadyHttp) {
            const cloudinaryUrl = resolveCloudinaryUrl(rawValue, "image");
            if (cloudinaryUrl && /^https?:\/\//i.test(cloudinaryUrl)) {
                const remote = await fetch(cloudinaryUrl);
                if (remote.ok) {
                    return new NextResponse(remote.body as any, {
                        status: 200,
                        headers: {
                            "Content-Type": "application/pdf",
                            "Content-Disposition": `inline; filename="${encodeURIComponent(book.title)}.pdf"`,
                        },
                    });
                }
                // Cloudinary 404/error — fall through to local file
                console.warn(`Cloudinary PDF not found for book ${bookId} (${cloudinaryUrl}), trying local fallback.`);
            }
        }

        // ── 2. If it's a full http URL (stored directly), proxy it ───────────
        if (isAlreadyHttp) {
            const remote = await fetch(rawValue);
            if (!remote.ok) throw new Error(`Remote PDF fetch failed: ${remote.status}`);
            return new NextResponse(remote.body as any, {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `inline; filename="${encodeURIComponent(book.title)}.pdf"`,
                },
            });
        }

        // Local file fallback (development only)
        const candidates = [
            path.resolve(process.cwd(), "media", rawValue),
            path.resolve(process.cwd(), rawValue.replace(/^\/+/, "")),
        ];

        const filePath = candidates.find(p => fs.existsSync(p));
        if (!filePath) {
            console.error(`PDF not found locally for book ${bookId}. Tried:\n${candidates.join("\n")}`);
            return new NextResponse("PDF file not found on server.", { status: 404 });
        }

        const stats = fs.statSync(filePath);
        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Length": stats.size.toString(),
                "Content-Disposition": `inline; filename="${encodeURIComponent(book.title)}.pdf"`,
            },
        });
    } catch (error) {
        console.error("PDF Serve Error:", error);
        return new NextResponse("Error loading PDF", { status: 500 });
    }
}
