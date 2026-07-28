import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: idStr } = await params;
    const id = parseInt(idStr);
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

    const existing = await prisma.book.findFirst({ where: { isbn: { equals: isbn, mode: "insensitive" }, id: { not: id } } });
    if (existing) return NextResponse.json({ errors: { isbn: `A book with ISBN "${isbn}" already exists.` } }, { status: 400 });

    let coverImageUrl: string | undefined;
    let pdfFileUrl: string | undefined;

    if (coverImageFile && coverImageFile.size > 0) {
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
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
            const { uploadToCloudinary } = await import("@/lib/cloudinary");
            const r = await uploadToCloudinary(buf, "pdfs", undefined, "image");
            pdfFileUrl = r.url;
        }
    }

    const book = await prisma.book.update({
        where: { id },
        data: {
            isbn: isbn!, title: title!, author: author!, description,
            categoryId: categoryId || null, totalCopies, publisher, pages,
            language: language as any,
            publicationDate: publicationDate ? new Date(publicationDate) : null,
            ...(coverImageUrl && { coverImage: coverImageUrl }),
            ...(pdfFileUrl && { pdfFile: pdfFileUrl }),
        },
    });

    await logActivity(parseInt(user.id), "book_updated", `Updated book: "${book.title}" (ISBN: ${book.isbn})`);
    return NextResponse.json({ id: book.id });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params;
    const book = await prisma.book.findUnique({
        where: { id: parseInt(idStr) },
        include: { category: true, reviews: { include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } } } },
    });
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(book);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.book.delete({ where: { id } });
    await logActivity(parseInt(user.id), "book_deleted", `Deleted book: "${book.title}" (ISBN: ${book.isbn})`);
    return NextResponse.json({ success: true });
}
