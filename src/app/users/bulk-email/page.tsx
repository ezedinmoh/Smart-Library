import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import BulkEmailClient from "./BulkEmailClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Bulk Email - Smart Library" };
export default async function BulkEmailPage() {
    await requireAdmin();
    const users = await prisma.user.findMany({ 
        where: { isActive: true },
        select: { id: true, username: true, email: true, firstName: true, lastName: true, role: true }
    });
    return <AppShell><BulkEmailClient userCount={users.length} allUsers={users} /></AppShell>;
}
