import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import CategoryFormClient from "../../CategoryFormClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Edit Category - Smart Library" };

export default async function CategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
    await requireLibrarianOrAdmin();
    const { id: idStr } = await params;
    const category = await prisma.category.findUnique({ where: { id: parseInt(idStr) } });
    if (!category) notFound();
    return <AppShell><CategoryFormClient action="Edit" category={category} /></AppShell>;
}
