import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import BookFormClient from "../BookFormClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Add Book - Smart Library" };

export default async function BookCreatePage() {
    await requireLibrarianOrAdmin();
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return <AppShell><BookFormClient categories={categories} action="Add" /></AppShell>;
}
