import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import PDFReaderClient from "./PDFReaderClient";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Read Book - Smart Library" };

export default async function PDFReaderPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requireAuth();
    const { id: idStr } = await params;
    const bookId = parseInt(idStr);
    const userId = parseInt(user.id);

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) notFound();
    if (!book.pdfFile) redirect(`/books/${bookId}`);

    // Access control
    let canRead = false;
    if (user.role === "admin" || user.role === "librarian") {
        canRead = true;
    } else {
        const hasRecord = await prisma.borrowRecord.findFirst({
            where: {
                userId,
                bookId,
                status: { in: ["borrowed", "issued", "overdue", "returned"] }
            }
        });
        canRead = !!hasRecord || user.role === "student";
    }
    if (!canRead) redirect(`/books/${bookId}`);

    // Always route through our API proxy — it handles Cloudinary + local fallback
    // and enforces auth server-side. Never hand the raw pdfFile path to the client.
    return (
        <AppShell>
            <PDFReaderClient
                book={{
                    id: book.id,
                    title: book.title,
                    author: book.author || undefined,
                    coverImage: undefined,
                }}
            />
        </AppShell>
    );
}
