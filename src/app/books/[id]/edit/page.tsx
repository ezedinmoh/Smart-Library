import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import BookFormClient from "../../BookFormClient";
import { serializePrisma } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Edit Book - Smart Library" };

export default async function BookEditPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();
    const { id: idStr } = await params;
    const [book, categories] = await Promise.all([
        prisma.book.findUnique({ where: { id: parseInt(idStr) } }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);
    if (!book) notFound();
    return <AppShell><BookFormClient categories={categories} book={serializePrisma(book)} action="Edit" /></AppShell>;
}
