import { requireAuth } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import NotificationsClient from "./NotificationsClient";
import {
  getUserNotifications,
  markAllNotificationsRead,
} from "@/lib/notifications";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Notifications - Smart Library" };

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ mark_read?: string }>;
}) {
  const user = await requireAuth();
  const userId = parseInt(user.id);
  const params = await searchParams;

  if (params.mark_read === "all") {
    await markAllNotificationsRead(userId);
    redirect("/users/notifications");
  }

  const notifications = await getUserNotifications(userId);
  return (
    <AppShell>
      <NotificationsClient notifications={notifications} userRole={user.role} />
    </AppShell>
  );
}
