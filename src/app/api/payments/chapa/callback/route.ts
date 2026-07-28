import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

async function verifyChapa(txRef: string): Promise<boolean> {
    try {
        const res = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
            headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY ?? ""}` },
        });
        const data = await res.json();
        return data.status === "success" && data.data?.status === "success";
    } catch { return false; }
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const txRef = searchParams.get("trx_ref") ?? searchParams.get("tx_ref") ?? searchParams.get("reference") ?? searchParams.get("transaction_id");
    const status = searchParams.get("status");

    if (!txRef) return NextResponse.redirect(new URL("/borrow/my-books?error=no_txref", req.url));

    try {
        const chapaRecord = await prisma.chapaPayment.findUnique({ where: { chapaTxRef: txRef }, include: { payment: { include: { borrowRecord: true } } } });
        if (!chapaRecord) return NextResponse.redirect(new URL("/borrow/my-books?error=not_found", req.url));

        const payment = chapaRecord.payment;
        if (payment.status === "completed") return NextResponse.redirect(new URL(`/payments/receipt/${payment.id}`, req.url));

        const verified = status === "success" || await verifyChapa(txRef);
        if (!verified) return NextResponse.redirect(new URL(`/payments/select-method/${payment.borrowRecordId}?error=payment_failed`, req.url));

        await prisma.$transaction(async (tx) => {
            await tx.payment.update({ where: { id: payment.id }, data: { status: "completed" } });
            await tx.borrowRecord.update({ where: { id: payment.borrowRecordId }, data: { finePaid: true } });
        });

        await logActivity(payment.userId, "payment_completed", `Chapa payment completed: ETB ${payment.amount} for record #${payment.borrowRecordId}`);
        return NextResponse.redirect(new URL(`/payments/receipt/${payment.id}`, req.url));
    } catch (err) {
        console.error("[Chapa callback]", err);
        return NextResponse.redirect(new URL("/borrow/my-books?error=server_error", req.url));
    }
}
