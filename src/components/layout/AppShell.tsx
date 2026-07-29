import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserNotifications, getNotificationCount } from "@/lib/notifications";
import { ToastContainer } from "@/components/ui/ToastNotifications";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import Navbar from "./Navbar";
import SharedFooter from "./Footer";
import type { SessionUser } from "@/types";

interface Props {
    children: React.ReactNode;
}

export default async function AppShell({ children }: Props) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    let pendingCount = 0;
    let notifCount = 0;
    let notifications: any[] = [];
    let unpaidFinesCount = 0;

    if (user) {
        const userId = parseInt(user.id);

        if (user.role === "student") {
            const now = new Date();
            unpaidFinesCount = await prisma.borrowRecord.count({
                where: {
                    userId,
                    status: "issued",
                    dueDate: { lt: now },
                },
            });
        }

        // Pending book requests count (for nav badge)
        if (user.role === "admin" || user.role === "librarian") {
            pendingCount = await prisma.bookRequest.count({ where: { status: "pending" } });
        }

        // Notifications
        try {
            notifications = await getUserNotifications(userId);
            notifCount = notifications.filter((n) => !n.isRead).length;
        } catch {
            // non-critical
        }
    }

    return (
        <>
            <Navbar
                pendingCount={pendingCount}
                notifCount={notifCount}
                notifications={notifications}
                unpaidFinesCount={unpaidFinesCount}
            />
            <ToastContainer />
            <ConfirmModal />
            <main className="app-main">
                {children}
            </main>
            <SharedFooter />
        </>
    );
}
