import { requireLibrarianOrAdmin } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import CategoryFormClient from "../CategoryFormClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Add Category - Smart Library" };

export default async function CategoryCreatePage() {
    await requireLibrarianOrAdmin();
    return <AppShell><CategoryFormClient action="Add" /></AppShell>;
}
