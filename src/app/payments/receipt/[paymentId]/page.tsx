import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Payment Receipt - Smart Library" };

import PrintButton from "@/components/ui/PrintButton";

export default async function ReceiptPage({ params }: { params: Promise<{ paymentId: string }> }) {
    const user = await requireAuth();
    const { paymentId } = await params;
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { borrowRecord: { include: { book: true } }, user: true },
    });
    if (!payment || payment.userId !== parseInt(user.id)) notFound();

    return (
        <AppShell>
            <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 40, border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ width: 80, height: 80, background: "rgba(16,185,129,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 40, height: 40 }}><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h1 className="page-title-gradient">Payment Successful!</h1>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Your fine has been paid successfully.</p>

                    <div style={{ background: "var(--background)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)", textAlign: "left", marginBottom: 32 }}>
                        <h3 style={{ fontSize: "0.938rem", fontWeight: 600, marginBottom: 16 }}>Receipt Details</h3>
                        {[
                            ["Transaction ID", payment.transactionId],
                            ["Book", payment.borrowRecord.book.title],
                            ["Amount Paid", `${payment.currency} ${parseFloat(payment.amount.toString()).toFixed(2)}`],
                            ["Payment Method", payment.paymentMethod === "stripe" ? "Stripe (Card)" : "Chapa"],
                            ["Status", "Completed ✓"],
                            ["Date", formatDateTime(payment.createdAt)],
                        ].map(([l, v]) => (
                            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)", fontSize: "0.875rem" }}>
                                <span style={{ color: "var(--text-secondary)" }}>{l}</span>
                                <span style={{ fontWeight: 500 }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <Link href="/borrow/my-books" className="btn btn-primary">Back to My Books</Link>
                        <Link href="/payments/history" className="btn btn-secondary">Payment History</Link>
                        <PrintButton className="btn btn-secondary">Print Receipt</PrintButton>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
