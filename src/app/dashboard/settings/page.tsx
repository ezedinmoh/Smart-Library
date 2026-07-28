import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import SettingsClient from "./SettingsClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "System Settings - Smart Library" };

export default async function SystemSettingsPage() {
    await requireAdmin();
    const settings = await prisma.systemSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    return <AppShell><SettingsClient settings={serializePrisma(settings)} /></AppShell>;
}
