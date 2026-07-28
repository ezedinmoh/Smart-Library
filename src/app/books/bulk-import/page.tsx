import { requireAdmin } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import BulkImportBooksClient from "./BulkImportBooksClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bulk Import Books - Smart Library" };
export default async function BulkImportBooksPage() {
    await requireAdmin();
    return <AppShell><BulkImportBooksClient /></AppShell>;
}
