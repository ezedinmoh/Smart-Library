import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";
import ActivityLogFilter from "./ActivityLogFilter";

export const metadata: Metadata = { title: "Activity Log - Smart Library" };

export default async function ActivityLogPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; action?: string }>;
}) {
    await requireAdmin();
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page ?? "1"));
    const pageSize = 30;
    const q = params.q?.trim() || "";
    const actionFilter = params.action?.trim() || "";

    const whereClause: any = {};
    if (actionFilter) {
        whereClause.action = actionFilter;
    }
    if (q) {
        whereClause.OR = [
            { description: { contains: q } },
            { user: { username: { contains: q } } }
        ];
    }

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where: whereClause,
            include: { user: { select: { id: true, username: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.activityLog.count({ where: whereClause }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const ACTION_COLORS: Record<string, string> = {
        book_added: "#10b981", book_updated: "#0ea5e9", book_deleted: "#ef4444",
        book_borrowed: "#8b5cf6", book_returned: "#22c55e",
        request_approved: "#10b981", request_rejected: "#f59e0b",
        payment_completed: "#10b981", user_created: "#0ea5e9", user_role_changed: "#f59e0b",
        other: "#94a3b8",
    };

    return (
        <AppShell>
            <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 1200 }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <nav className="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        <Link href="/dashboard/system">System Admin</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        <span>Activity Log</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        <h1 className="page-title-gradient">Activity Log</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Complete history of all system actions and events</p>
                </div>

                {/* Filter Component */}
                <ActivityLogFilter initialSearch={q} initialAction={actionFilter} />

                {/* Table */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: "var(--primary)" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Activity History</h2>
                        </div>
                        <div style={{ background: "rgba(16,185,129,0.1)", color: "var(--primary)", padding: "4px 12px", borderRadius: 9999, fontSize: "0.8125rem", fontWeight: 700 }}>
                            {total} total records
                        </div>
                    </div>
                    
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Time</th>
                                    <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>User</th>
                                    <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Action</th>
                                    <th style={{ textAlign: "left", padding: "14px 24px", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((l) => {
                                    const color = ACTION_COLORS[l.action] ?? "#94a3b8";
                                    return (
                                        <tr key={l.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.2s" }} className="category-card-hover">
                                            <td style={{ padding: "16px 24px", fontSize: "0.8125rem", color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                                                {formatDateTime(l.createdAt)}
                                            </td>
                                            <td style={{ padding: "16px 24px", fontSize: "0.9375rem", fontWeight: 500 }}>
                                                {l.user ? (
                                                    <Link href={`/users/${l.user.id}/detail`} style={{ color: "var(--primary)", textDecoration: "none" }}>{l.user.username}</Link>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)" }}>System</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "16px 24px" }}>
                                                <span style={{ padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, background: `${color}15`, color, border: `1px solid ${color}30`, textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                                                    {l.action.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px 24px", fontSize: "0.9375rem", color: "var(--text-primary)", maxWidth: 400 }}>
                                                {l.description}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: "center", padding: "64px 24px" }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48, color: "var(--text-muted)", opacity: 0.5, margin: "0 auto 16px" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                            <h4 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>No activity found</h4>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Try adjusting your search filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: 20, borderTop: "1px solid var(--border)" }}>
                            {page > 1 && (
                                <Link href={`/dashboard/activity-log?page=${page - 1}&q=${encodeURIComponent(q)}&action=${encodeURIComponent(actionFilter)}`} className="btn btn-outline" style={{ padding: "8px 16px" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M15 18l-6-6 6-6"/></svg>
                                    Previous
                                </Link>
                            )}
                            <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-secondary)", padding: "0 12px" }}>
                                Page {page} of {totalPages}
                            </span>
                            {page < totalPages && (
                                <Link href={`/dashboard/activity-log?page=${page + 1}&q=${encodeURIComponent(q)}&action=${encodeURIComponent(actionFilter)}`} className="btn btn-outline" style={{ padding: "8px 16px" }}>
                                    Next
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M9 18l6-6-6-6"/></svg>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
