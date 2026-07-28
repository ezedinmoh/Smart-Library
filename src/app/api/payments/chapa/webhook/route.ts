import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
    // Chapa sends GET in test mode
    const txRef = req.nextUrl.searchParams.get("trx_ref") ?? req.nextUrl.searchParams.get("tx_ref");
    const status = req.nextUrl.searchParams.get("status");
    if (txRef && status === "success") await confirmChapa(txRef);
    return NextResponse.json({ received: true });
}

export async function POST(req: NextRequest) {
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const txRef = body.trx_ref ?? body.tx_ref;
    if (txRef) await confirmChapa(txRef);
    return NextResponse.json({ received: true });
}

async function confirmChapa(txRef: string) {
    try {
        const chapaRecord = await prisma.chapaPayment.findUnique({
            where: { chapaTxRef: txRef },
            include: { payment: true },
        });
        if (!chapaRecord || chapaRecord.payment.status === "completed") return;
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({ where: { id: chapaRecord.paymentId }, data: { status: "completed" } });
            await tx.borrowRecord.update({ where: { id: chapaRecord.payment.borrowRecordId }, data: { finePaid: true } });
        });
        await logActivity(chapaRecord.payment.userId, "payment_completed", `Chapa webhook: payment completed ${txRef}`);
    } catch (err) { console.error("[Chapa webhook]", err); }
}
