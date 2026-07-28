import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") ?? "";
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object as Stripe.PaymentIntent;
        try {
            const stripeRecord = await prisma.stripePayment.findUnique({
                where: { stripePaymentIntentId: intent.id },
                include: { payment: true },
            });
            if (stripeRecord && stripeRecord.payment.status !== "completed") {
                await prisma.$transaction(async (tx) => {
                    await tx.payment.update({ where: { id: stripeRecord.paymentId }, data: { status: "completed" } });
                    await tx.borrowRecord.update({ where: { id: stripeRecord.payment.borrowRecordId }, data: { finePaid: true } });
                });
                await logActivity(stripeRecord.payment.userId, "payment_completed", `Stripe webhook: payment completed ${intent.id}`);
            }
        } catch (err) { console.error("[Stripe webhook]", err); }
    }

    return NextResponse.json({ received: true });
}
