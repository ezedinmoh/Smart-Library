import { requireAdmin } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import UserCreateClient from "./UserCreateClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Create User - Smart Library" };

export default async function UserCreatePage() {
    await requireAdmin();
    return <AppShell><UserCreateClient /></AppShell>;
}
