import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQRCode } from "@/lib/qrcode";
import type { SessionUser } from "@/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const qrBuffer = await generateQRCode(book.isbn, book.title, book.author);
    return new NextResponse(new Uint8Array(qrBuffer), {
        headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="qr_code_${book.isbn}.png"`,
        },
    });
}
