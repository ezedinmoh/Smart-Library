import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";

/**
 * Called after stripe.confirmPayment resolves inline (redirect: "if_required").
 * Verifies the payment intent succeeded and marks the fine as paid.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user as SessionUser | undefined;
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        let body: { paymentIntentId?: string };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { paymentIntentId } = body;
        if (!paymentIntentId) return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 });

        // 1. Verify with Stripe
        let intent;
        try {
            intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (stripeErr: any) {
            console.error("[Stripe confirm] retrieve failed:", stripeErr?.message);
            return NextResponse.json({
                error: stripeErr?.message ?? "Could not retrieve payment intent from Stripe.",
            }, { status: 400 });
        }

        if (intent.status !== "succeeded") {
            return NextResponse.json({
                error: `Payment not completed. Status: ${intent.status}`,
            }, { status: 400 });
        }

        // 2. Find our payment record by Stripe intent ID
        const stripeRecord = await prisma.stripePayment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
            include: { payment: { include: { borrowRecord: true } } },
        });

        if (!stripeRecord) {
            console.error("[Stripe confirm] No local record for intent:", paymentIntentId);
            return NextResponse.json({ error: "Payment record not found. Contact support." }, { status: 404 });
        }

        const payment = stripeRecord.payment;

        // 3. Security: verify user owns this payment
        if (payment.userId !== parseInt(user.id)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 4. Already completed (idempotent)
        if (payment.status === "completed") {
            return NextResponse.json({ paymentId: payment.id });
        }

        // 5. Mark complete atomically
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({ where: { id: payment.id }, data: { status: "completed" } });
            await tx.borrowRecord.update({ where: { id: payment.borrowRecordId }, data: { finePaid: true } });
        });

        await logActivity(
            parseInt(user.id),
            "payment_completed",
            `Stripe payment completed: ETB ${payment.amount} for record #${payment.borrowRecordId}`
        );

        return NextResponse.json({ paymentId: payment.id });

    } catch (err: any) {
        console.error("[Stripe confirm] unexpected error:", err?.message ?? err);
        // Always return JSON — never let Next.js return plain "Internal Server Error"
        return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
    }
}
