import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const paymentIntentId = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");

    if (redirectStatus !== "succeeded" || !paymentIntentId) {
        return NextResponse.redirect(new URL("/borrow/my-books?error=payment_failed", req.url));
    }

    try {
        const stripeRecord = await prisma.stripePayment.findUnique({ where: { stripePaymentIntentId: paymentIntentId }, include: { payment: { include: { borrowRecord: true } } } });
        if (!stripeRecord) return NextResponse.redirect(new URL("/borrow/my-books?error=not_found", req.url));

        const payment = stripeRecord.payment;
        if (payment.status === "completed") {
            return NextResponse.redirect(new URL(`/payments/receipt/${payment.id}`, req.url));
        }

        // Verify with Stripe
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== "succeeded") return NextResponse.redirect(new URL("/borrow/my-books?error=payment_not_succeeded", req.url));

        // Mark payment complete
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({ where: { id: payment.id }, data: { status: "completed" } });
            await tx.borrowRecord.update({ where: { id: payment.borrowRecordId }, data: { finePaid: true } });
        });

        await logActivity(payment.userId, "payment_completed", `Stripe payment completed: ETB ${payment.amount} for record #${payment.borrowRecordId}`);
        return NextResponse.redirect(new URL(`/payments/receipt/${payment.id}`, req.url));
    } catch (err) {
        console.error("[Stripe success]", err);
        return NextResponse.redirect(new URL("/borrow/my-books?error=server_error", req.url));
    }
}
