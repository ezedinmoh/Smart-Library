import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { SessionUser } from "@/types";
const REUSABLE_STATUSES = ["requires_payment_method", "requires_confirmation", "requires_action"];

export async function POST(_req: NextRequest, { params }: { params: Promise<{ recordId: string }> }) {
    const { recordId: recordIdStr } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(user.id);
    const recordId = parseInt(recordIdStr);

    const [record, settings] = await Promise.all([
        prisma.borrowRecord.findUnique({ where: { id: recordId, userId }, include: { book: true } }),
        prisma.systemSettings.findUnique({ where: { id: 1 } }),
    ]);

    if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    if (parseFloat(record.fineAmount.toString()) <= 0 || record.finePaid) {
        return NextResponse.json({ error: "No fine to pay" }, { status: 400 });
    }

    const etbToUsd = parseFloat((settings?.etbToUsdRate ?? 0.018).toString());
    const amountEtb = parseFloat(record.fineAmount.toString());
    const amountUsd = amountEtb * etbToUsd;
    const totalUsd = Math.max(amountUsd, 0.50);
    const amountCents = Math.round(totalUsd * 100);
    const processingFee = totalUsd - amountUsd;

    // Check for reusable pending payment
    const existing = await prisma.payment.findFirst({
        where: { borrowRecordId: recordId, userId, paymentMethod: "stripe", status: "pending" },
        include: { stripeDetails: true },
        orderBy: { createdAt: "desc" },
    });

    if (existing?.stripeDetails) {
        try {
            const intent = await stripe.paymentIntents.retrieve(existing.stripeDetails.stripePaymentIntentId);
            if (REUSABLE_STATUSES.includes(intent.status)) {
                return NextResponse.json({ success: true, client_secret: intent.client_secret, payment_id: existing.id, amount_usd: totalUsd, processing_fee_usd: processingFee, amount_cents: amountCents, reused: true });
            }
        } catch { /* fall through */ }
    }

    const bookTitle = (record as any).book?.title ?? "book";

    // Create new payment intent
    const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        metadata: { record_id: String(recordId), user_id: String(userId), processing_fee_usd: String(processingFee) },
        description: `Library fine for: ${bookTitle}`,
    });

    // Create payment record
    const payment = await prisma.payment.create({
        data: {
            userId, borrowRecordId: recordId,
            amount: amountEtb, currency: "ETB",
            paymentMethod: "stripe",
            transactionId: `STRIPE-${recordId}-${Date.now()}`,
            status: "pending",
        },
    });

    await prisma.stripePayment.create({ data: { paymentId: payment.id, stripePaymentIntentId: intent.id } });

    return NextResponse.json({ success: true, client_secret: intent.client_secret, payment_id: payment.id, amount_usd: totalUsd, processing_fee_usd: processingFee, amount_cents: amountCents });
}
