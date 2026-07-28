import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQRCode } from "@/lib/qrcode";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { SessionUser } from "@/types";

/**
 * POST /api/books/regenerate-qr
 * Admin only — regenerate and re-upload QR codes for all books
 * whose qrCode field is missing or is a relative path (not a full URL).
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find books with missing or broken QR codes (not a full https URL)
    const books = await prisma.book.findMany({
        select: { id: true, isbn: true, title: true, author: true, qrCode: true },
    });

    const toFix = books.filter(b => !b.qrCode || !/^https?:\/\//i.test(b.qrCode));

    let fixed = 0;
    const errors: string[] = [];

    for (const book of toFix) {
        try {
            const qrBuf = await generateQRCode(book.isbn, book.title, book.author);
            const { url } = await uploadToCloudinary(qrBuf, "qr_codes", `qr_${book.isbn}`);
            await prisma.book.update({ where: { id: book.id }, data: { qrCode: url } });
            fixed++;
        } catch (e: any) {
            errors.push(`Book ${book.id} (${book.title}): ${e.message}`);
        }
    }

    return NextResponse.json({
        message: `Fixed ${fixed} of ${toFix.length} books`,
        errors: errors.length ? errors : undefined,
    });
}
