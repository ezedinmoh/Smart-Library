import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import ManageStockClient from "./ManageStockClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Manage Stock - Smart Library" };

export default async function ManageStockPage() {
    await requireLibrarianOrAdmin();

    const books = await prisma.book.findMany({
        include: { category: true },
        orderBy: { title: "asc" },
    });

    const stats = {
        totalBooks: books.length,
        totalCopies: books.reduce((s, b) => s + b.totalCopies, 0),
        totalAvailable: books.reduce((s, b) => s + b.availableCopies, 0),
        outOfStock: books.filter(b => b.availableCopies === 0).length,
        lowStock: books.filter(b => b.availableCopies > 0 && b.availableCopies <= 2).length,
    };

    return <AppShell><ManageStockClient books={serializePrisma(books)} stats={stats} /></AppShell>;
}
