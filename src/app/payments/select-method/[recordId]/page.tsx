import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import PaymentMethodClient from "./PaymentMethodClient";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Pay Fine - Smart Library" };

export default async function SelectPaymentMethodPage({ params }: { params: Promise<{ recordId: string }> }) {
    const user = await requireAuth();
    const userId = parseInt(user.id);
    const { recordId: recordIdStr } = await params;
    const recordId = parseInt(recordIdStr);

    const [record, settings] = await Promise.all([
        prisma.borrowRecord.findUnique({ where: { id: recordId, userId }, include: { book: true } }),
        prisma.systemSettings.findUnique({ where: { id: 1 } }),
    ]);

    if (!record) notFound();
    if (parseFloat(record.fineAmount.toString()) <= 0) redirect("/borrow/my-books");
    if (record.finePaid) redirect("/borrow/my-books");

    const etbToUsd = parseFloat((settings?.etbToUsdRate ?? 0.018).toString());
    const amountEtb = parseFloat(record.fineAmount.toString());
    const amountUsd = amountEtb * etbToUsd;
    const stripeMinimum = 0.50;
    const processingFee = amountUsd < stripeMinimum ? stripeMinimum - amountUsd : 0;
    const totalUsd = Math.max(amountUsd + processingFee, stripeMinimum);

    return (
        <AppShell>
            <PaymentMethodClient
                record={{ id: record.id, fineAmount: amountEtb, book: { title: record.book.title, author: record.book.author } }}
                amountUsd={Math.round(amountUsd * 100) / 100}
                processingFeeUsd={Math.round(processingFee * 100) / 100}
                totalUsd={Math.round(totalUsd * 100) / 100}
                totalUsdCents={Math.round(totalUsd * 100)}
                stripePublicKey={process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? process.env.STRIPE_PUBLIC_KEY ?? ""}
                isTestMode={
                    ((process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? process.env.STRIPE_PUBLIC_KEY ?? "")).startsWith("pk_test_") ||
                    (process.env.CHAPA_SECRET_KEY ?? "").startsWith("CHASECK_TEST-")
                }
                userFullName={[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}
                userEmail={user.email ?? ""}
            />
        </AppShell>
    );
}
