"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/ToastNotifications";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/types";

/* Level → icon paths */
const ICONS: Record<string, React.ReactNode> = {
    error: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    danger: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    warning: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    success: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
};

export default function NotificationsClient({ notifications, userRole }: { notifications: Notification[]; userRole?: string }) {
    const router = useRouter();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    async function markRead(key: string, type: string) {
        await fetch("/api/users/notifications/mark-read", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, type })
        });
        router.refresh();
    }

    async function deleteNotif(key: string, type: string) {
        const res = await fetch("/api/users/notifications/delete", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, type })
        });
        if (res.ok) router.refresh();
        else showToast("Failed to delete.", "error");
    }

    async function clearAll() {
        await fetch("/api/users/notifications/clear-all", { method: "POST" });
        showToast("All notifications cleared.", "success");
        router.refresh();
    }

    return (
        <div className="notifications-page-main">
            {/* ── Page Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        <Link href="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Dashboard</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M9 18l6-6-6-6" /></svg>
                        <span>Notifications</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: 28, height: 28, flexShrink: 0 }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <h1 className="page-title-gradient" style={{ fontSize: "1.875rem", fontWeight: 800 }}>Notifications</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Stay updated with your library activity</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {unreadCount > 0 && (
                        <Link href="/users/notifications?mark_read=all" className="btn btn-secondary btn-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12" /></svg>
                            Mark All as Read
                        </Link>
                    )}
                    {notifications.length > 0 && (
                        <button className="btn btn-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)" }} onClick={clearAll}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* ── Notification Center Banner (admin / librarian) ── */}
            {(userRole === "admin" || userRole === "librarian") && (
                <Link href="/dashboard/notification-center" style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
                    <div style={{ background: "linear-gradient(135deg,#f093fb,#f5576c)", borderRadius: "var(--radius-lg)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, boxShadow: "0 4px 20px rgba(240,147,251,0.3)", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                            <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 26, height: 26 }}>
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: 3 }}>Notification Center</div>
                                <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>Send due-date reminders, overdue alerts &amp; unpaid fine notices to users</div>
                            </div>
                        </div>
                        <div style={{ color: "white", fontWeight: 600, fontSize: "0.9rem", flexShrink: 0 }}>Manage &amp; Send →</div>
                    </div>
                </Link>
            )}

            {/* ── Notifications Card ── */}
            <div className="notif-list-card">
                <div className="notif-card-header">
                    <div className="notif-header-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        All Notifications
                        <span className="notif-count-badge">{notifications.length}</span>
                    </div>
                    {unreadCount > 0 && <span className="notif-unread-badge">{unreadCount} unread</span>}
                </div>

                {notifications.length === 0 ? (
                    <div className="notif-empty-state">
                        <div className="notif-empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>All Caught Up!</h3>
                        <p style={{ color: "var(--text-secondary)" }}>You have no notifications at the moment.</p>
                    </div>
                ) : (
                    notifications.map(n => {
                        const lvl = n.level || "info";
                        const icon = ICONS[lvl] ?? ICONS.info;
                        return (
                            <div key={n.key} className={`notif-item-row${!n.isRead ? " notif-unread" : ""} level-${lvl}`}>
                                {/* Icon */}
                                <div className={`notif-icon-circle ${lvl}`}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                                </div>

                                {/* Body */}
                                <div className="notif-body">
                                    <div className="notif-top-row">
                                        <div style={{ flex: 1 }}>
                                            <div className="notif-title-text">
                                                {n.title}
                                                {!n.isRead && <span className="notif-new-badge">New</span>}
                                            </div>
                                            <div className="notif-msg-text">{n.message}</div>
                                            {n.fine != null && (
                                                <div className="notif-fine-text">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                                    Fine: ETB {n.fine}
                                                </div>
                                            )}
                                            <div className="notif-date-text">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                {formatDateTime(n.createdAt)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="notif-actions-row">
                                            {n.url && (
                                                <Link href={n.url} className="btn btn-secondary btn-sm" onClick={() => markRead(n.key, n.type)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    View
                                                </Link>
                                            )}
                                            {!n.isRead && (
                                                <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.1)", color: "var(--primary)", border: "1px solid rgba(16,185,129,0.3)" }} onClick={() => markRead(n.key, n.type)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12" /></svg>
                                                    Mark Read
                                                </button>
                                            )}
                                            <button className="btn btn-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)" }} onClick={() => deleteNotif(n.key, n.type)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
