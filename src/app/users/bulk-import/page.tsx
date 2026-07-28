import { requireAdmin } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import BulkImportUsersClient from "./BulkImportUsersClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bulk Import Users - Smart Library" };
export default async function BulkImportUsersPage() {
    await requireAdmin();
    return <AppShell><BulkImportUsersClient /></AppShell>;
}
