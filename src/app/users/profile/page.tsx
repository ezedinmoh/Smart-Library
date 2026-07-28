import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import ProfileClient from "./ProfileClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "My Profile - Smart Library" };

export default async function ProfilePage() {
    const sessionUser = await requireAuth();
    const userId = parseInt(sessionUser.id);

    const [user, profile, borrowStats] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.userProfile.findUnique({ where: { userId } }),
        prisma.borrowRecord.aggregate({ where: { userId }, _count: { id: true } }),
    ]);
    if (!user) return null;

    const validUntil = new Date(); validUntil.setFullYear(validUntil.getFullYear() + 4);

    return (
        <AppShell>
            <ProfileClient user={serializePrisma(user)} profile={serializePrisma(profile)} totalBorrowed={borrowStats._count.id} validUntil={serializePrisma(validUntil)} />
        </AppShell>
    );
}
