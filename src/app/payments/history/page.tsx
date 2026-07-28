import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Payment History - Smart Library" };

export default async function PaymentHistoryPage() {
    const user = await requireAuth();
    const payments = await prisma.payment.findMany({
        where: { userId: parseInt(user.id) },
        include: { borrowRecord: { include: { book: true } } },
        orderBy: { createdAt: "desc" },
    });

    const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
        completed: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
        pending: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
        failed: { bg: "rgba(239,68,68,0.1)", color: "var(--error)" },
        cancelled: { bg: "rgba(100,116,139,0.1)", color: "var(--text-muted)" },
    };

    return (
        <AppShell>
            <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
                <h1 className="page-title-gradient">Payment History</h1>
                {payments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64, color: "var(--text-muted)", margin: "0 auto 16px", display: "block" }}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>No payments yet</h3>
                        <p style={{ color: "var(--text-secondary)" }}>Your payment history will appear here.</p>
                    </div>
                ) : (
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "var(--background)", borderBottom: "2px solid var(--border)" }}>
                                        {["Date", "Book", "Amount", "Method", "Status", "Receipt"].map(h => (
                                            <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "0.813rem", fontWeight: 600, color: "var(--text-secondary)" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(p => {
                                        const s = STATUS_STYLES[p.status] ?? STATUS_STYLES.pending;
                                        return (
                                            <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{formatDateTime(p.createdAt)}</td>
                                                <td style={{ padding: "12px 16px", fontSize: "0.875rem" }}>{p.borrowRecord.book.title}</td>
                                                <td style={{ padding: "12px 16px", fontSize: "0.875rem", fontWeight: 600 }}>{p.currency} {parseFloat(p.amount.toString()).toFixed(2)}</td>
                                                <td style={{ padding: "12px 16px", fontSize: "0.875rem" }}>{p.paymentMethod === "stripe" ? "Stripe" : "Chapa"}</td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    <span style={{ padding: "3px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: s.bg, color: s.color }}>
                                                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px 16px" }}>
                                                    {p.status === "completed" && <Link href={`/payments/receipt/${p.id}`} className="btn btn-secondary btn-sm">View</Link>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
