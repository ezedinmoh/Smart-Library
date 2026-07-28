import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Reports - Smart Library" };

export default async function ReportsPage() {
    await requireAdmin();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Batch 1: monthly & count data (5 queries)
    const [thisMonthBorrows, thisMonthReturns, thisMonthRequests, thisMonthFinesAgg, lastMonthBorrows] = await Promise.all([
        prisma.borrowRecord.count({ where: { borrowDate: { gte: thisMonthStart } } }),
        prisma.borrowRecord.count({ where: { returnDate: { gte: thisMonthStart } } }),
        prisma.bookRequest.count({ where: { requestDate: { gte: thisMonthStart } } }),
        prisma.borrowRecord.aggregate({ where: { fineAmount: { gt: 0 }, borrowDate: { gte: thisMonthStart } }, _sum: { fineAmount: true } }),
        prisma.borrowRecord.count({ where: { borrowDate: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ]);

    // Batch 2: overall stats & fines (6 queries)
    const [totalBorrows, totalFinesAgg, unpaidFinesAgg, totalUsers, totalBooks, overdueCount] = await Promise.all([
        prisma.borrowRecord.count(),
        prisma.borrowRecord.aggregate({ where: { fineAmount: { gt: 0 } }, _sum: { fineAmount: true } }),
        prisma.borrowRecord.aggregate({ where: { fineAmount: { gt: 0 }, finePaid: false }, _sum: { fineAmount: true } }),
        prisma.user.count(),
        prisma.book.count(),
        prisma.borrowRecord.count({ where: { status: "overdue" } }),
    ]);

    // Batch 3: detailed lists (3 queries)
    const [topBooks, topStudents, overdueFinesAgg] = await Promise.all([
        prisma.book.findMany({ where: { timesBorrowed: { gt: 0 } }, orderBy: { timesBorrowed: "desc" }, take: 10 }),
        prisma.user.findMany({ where: { role: "student" }, include: { _count: { select: { borrowRecords: true } } }, orderBy: { borrowRecords: { _count: "desc" } }, take: 10 }),
        prisma.borrowRecord.aggregate({ where: { status: "overdue", fineAmount: { gt: 0 } }, _sum: { fineAmount: true } }),
    ]);

    const trend = thisMonthBorrows - lastMonthBorrows;

    return (
        <AppShell>
            <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
                {/* Header — matches Django reports.html */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <nav className="breadcrumb">
                            <Link href="/dashboard">Dashboard</Link>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                            <span>Reports</span>
                        </nav>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                            <h1 className="page-title-gradient">Reports</h1>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Library statistics and downloadable reports</p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <a href="/api/dashboard/export/overdue/csv" className="btn btn-secondary btn-sm" style={{ padding: "8px 16px" }}>Overdue CSV</a>
                        <a href="/api/dashboard/export/overdue/pdf" className="btn btn-secondary btn-sm" style={{ padding: "8px 16px" }}>Overdue PDF</a>
                        <a href="/api/dashboard/export/fines/pdf" className="btn btn-primary btn-sm" style={{ padding: "8px 16px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                            Fines PDF
                        </a>
                    </div>
                </div>

                {/* This Month */}
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: 20, height: 20 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    This Month <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-muted)", marginLeft: 4 }}>({formatDate(thisMonthStart)})</span>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20, marginBottom: 40 }}>
                    {[
                        ["Borrows", thisMonthBorrows, `${trend >= 0 ? "+" : ""}${trend} vs last month`, "#10b981", "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))"],
                        ["Returns", thisMonthReturns, "", "#0ea5e9", "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(14,165,233,0.02))"],
                        ["Requests", thisMonthRequests, "", "#8b5cf6", "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.02))"],
                        ["Fines (ETB)", parseFloat((thisMonthFinesAgg._sum.fineAmount ?? 0).toString()).toFixed(2), "", "#f59e0b", "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))"],
                    ].map(([l, v, sub, c, bg]) => (
                        <div key={l as string} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                            <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: bg as string, pointerEvents: "none" }} />
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: c as string, marginBottom: 4, letterSpacing: "-0.02em" }}>{v}</div>
                                {sub ? <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                    {(trend >= 0) ? <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
                                    {sub}
                                </div> : <div style={{ fontSize: "0.813rem", visibility: "hidden" }}>Spacer</div>}
                                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overall */}
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                    All Time Statistics
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20, marginBottom: 40 }}>
                    {[
                        ["Total Borrows", totalBorrows, "#10b981", "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))"],
                        ["Total Fines (ETB)", parseFloat((totalFinesAgg._sum.fineAmount ?? 0).toString()).toFixed(2), "#ef4444", "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))"],
                        ["Unpaid Fines (ETB)", parseFloat((unpaidFinesAgg._sum.fineAmount ?? 0).toString()).toFixed(2), "#f59e0b", "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))"],
                        ["Total Users", totalUsers, "#0ea5e9", "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(14,165,233,0.02))"],
                        ["Total Books", totalBooks, "#8b5cf6", "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.02))"],
                        ["Overdue Now", overdueCount, "#ef4444", "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))"],
                        ["Overdue Fines (ETB)", parseFloat((overdueFinesAgg._sum.fineAmount ?? 0).toString()).toFixed(2), "#ef4444", "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))"],
                    ].map(([l, v, c, bg]) => (
                        <div key={l as string} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                            <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: bg as string, pointerEvents: "none" }} />
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: c as string, marginBottom: 4, letterSpacing: "-0.02em" }}>{v}</div>
                                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>
                    {/* Top Books */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--background)" }}>
                            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                Top 10 Borrowed Books
                            </h2>
                            <a href="/api/dashboard/export/top-books/pdf" className="btn btn-secondary btn-sm" style={{ padding: "6px 12px" }}>Export PDF</a>
                        </div>
                        <div style={{ padding: "8px 0" }}>
                            {topBooks.map((b: any, i: number) => (
                                <Link key={b.id} href={`/books/${b.id}`} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px", borderBottom: i < topBooks.length - 1 ? "1px solid var(--border-light)" : "none", textDecoration: "none" }} className="category-card-hover">
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < 3 ? "rgba(245,158,11,0.1)" : "var(--background)", color: i < 3 ? "#f59e0b" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.813rem", fontWeight: 700 }}>{i + 1}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{b.title}</div>
                                        <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>{b.author}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--primary)" }}>{b.timesBorrowed}</div>
                                        <div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>Borrows</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Top Students */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--background)" }}>
                            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                Top 10 Active Members
                            </h2>
                            <a href="/api/dashboard/export/top-members/pdf" className="btn btn-secondary btn-sm" style={{ padding: "6px 12px" }}>Export PDF</a>
                        </div>
                        <div style={{ padding: "8px 0" }}>
                            {topStudents.map((s: any, i: number) => (
                                <Link key={s.id} href={`/users/${s.id}/detail`} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px", borderBottom: i < topStudents.length - 1 ? "1px solid var(--border-light)" : "none", textDecoration: "none" }} className="category-card-hover">
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < 3 ? "rgba(14,165,233,0.1)" : "var(--background)", color: i < 3 ? "#0ea5e9" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.813rem", fontWeight: 700 }}>{i + 1}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{s.username}</div>
                                        <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>{s.email}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--primary)" }}>{s._count.borrowRecords}</div>
                                        <div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>Borrows</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
