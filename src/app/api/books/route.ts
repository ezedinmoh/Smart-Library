import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { generateQRCode } from "@/lib/qrcode";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || (user.role !== "admin" && user.role !== "librarian")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const isbn = (formData.get("isbn") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const author = (formData.get("author") as string)?.trim();
    const description = (formData.get("description") as string) ?? "";
    const categoryId = formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null;
    const totalCopies = parseInt(formData.get("totalCopies") as string) || 1;
    const publisher = (formData.get("publisher") as string) ?? "";
    const publicationDate = formData.get("publicationDate") as string;
    const pages = formData.get("pages") ? parseInt(formData.get("pages") as string) : null;
    const language = (formData.get("language") as string) || "en";
    const coverImageFile = formData.get("coverImage") as File | null;
    const pdfFileInput = formData.get("pdfFile") as File | null;

    // Validate
    if (!isbn || !title || !author) {
        return NextResponse.json({ errors: { isbn: !isbn ? "ISBN required" : undefined, title: !title ? "Title required" : undefined, author: !author ? "Author required" : undefined } }, { status: 400 });
    }

    const existing = await prisma.book.findFirst({ where: { isbn: { equals: isbn, mode: "insensitive" } } });
    if (existing) return NextResponse.json({ errors: { isbn: `A book with ISBN "${isbn}" already exists.` } }, { status: 400 });

    let coverImageUrl: string | null = null;
    let pdfFileUrl: string | null = null;

    if (coverImageFile && coverImageFile.size > 0) {
        const buf = Buffer.from(await coverImageFile.arrayBuffer());
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const r = await uploadToCloudinary(buf, "covers");
            coverImageUrl = r.url;
        } else {
            coverImageUrl = `data:${coverImageFile.type};base64,${buf.toString("base64")}`;
        }
    }

    if (pdfFileInput && pdfFileInput.size > 0) {
        const buf = Buffer.from(await pdfFileInput.arrayBuffer());
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const r = await uploadToCloudinary(buf, "pdfs", undefined, "raw");
            pdfFileUrl = r.url;
        }
    }

    // Generate QR code
    let qrCodeUrl: string | null = null;
    try {
        const qrBuf = await generateQRCode(isbn, title, author);
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const r = await uploadToCloudinary(qrBuf, "qr_codes");
            qrCodeUrl = r.url;
        } else {
            qrCodeUrl = `data:image/png;base64,${qrBuf.toString("base64")}`;
        }
    } catch { /* non-critical */ }

    const book = await prisma.book.create({
        data: {
            isbn, title, author, description,
            categoryId: categoryId || null,
            totalCopies, availableCopies: totalCopies,
            publisher, pages,
            language: language as any,
            publicationDate: publicationDate ? new Date(publicationDate) : null,
            coverImage: coverImageUrl,
            pdfFile: pdfFileUrl,
            qrCode: qrCodeUrl,
        },
    });

    await logActivity(parseInt(user.id), "book_added", `Added book: "${title}" (ISBN: ${isbn})`);
    return NextResponse.json({ id: book.id }, { status: 201 });
}
