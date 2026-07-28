import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/env";
import type { SessionUser } from "@/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ recordId: string }> }) {
    const { recordId: recordIdStr } = await params;
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(user.id);
    const recordId = parseInt(recordIdStr);

    const record = await prisma.borrowRecord.findUnique({ where: { id: recordId, userId }, include: { book: true } });
    if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    if (parseFloat(record.fineAmount.toString()) <= 0 || record.finePaid) return NextResponse.json({ error: "No fine to pay" }, { status: 400 });

    const txRef = `CHAPA-${recordId}-${Date.now()}`;
    const siteUrl = getSiteUrl();
    // Chapa's server-side callback (POST) needs HTTPS — use a placeholder for local dev
    // since Chapa cannot POST to localhost. This is fine in test mode because payment
    // verification is triggered by the browser redirect (return_url) instead.
    const isLocalDev = siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1");
    const callbackBase = isLocalDev ? "https://smartlibrary-placeholder.vercel.app" : siteUrl;
    const callbackUrl = `${callbackBase}/api/payments/chapa/callback`;
    // return_url is where the USER'S BROWSER is redirected after payment — MUST be your real app
    // with tx_ref attached so callback route can look up the payment.
    const returnUrl = `${siteUrl}/api/payments/chapa/callback?trx_ref=${txRef}`;

    const chapaKey = process.env.CHAPA_SECRET_KEY ?? "";
    const amountEtb = parseFloat(record.fineAmount.toString());

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });

    // Chapa title: max 16 characters
    const chapaTitle = "Library Fine";
    // Chapa description: only letters, numbers, hyphens, underscores, spaces, dots (no colons, etc.)
    const rawDesc = `Fine - ${(record as any).book?.title ?? "book"}`;
    const chapaDesc = rawDesc.replace(/[^a-zA-Z0-9\-_ .]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);

    // Call Chapa API
    try {
        const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
            method: "POST",
            headers: { Authorization: `Bearer ${chapaKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: amountEtb.toString(),
                currency: "ETB",
                email: dbUser?.email ?? "",
                first_name: dbUser?.firstName ?? "",
                last_name: dbUser?.lastName ?? "",
                tx_ref: txRef,
                callback_url: callbackUrl,
                return_url: returnUrl,
                customization: { title: chapaTitle, description: chapaDesc },
            }),
        });
        const data = await res.json();
        if (data.status !== "success") {
            console.error("[Chapa] API error:", JSON.stringify(data));
            return NextResponse.json({ error: data.message ?? data.data ?? "Chapa initialization failed." }, { status: 400 });
        }

        // Create payment record
        const payment = await prisma.payment.create({
            data: { userId, borrowRecordId: recordId, amount: amountEtb, currency: "ETB", paymentMethod: "chapa", transactionId: txRef, status: "pending" },
        });
        await prisma.chapaPayment.create({ data: { paymentId: payment.id, chapaTxRef: txRef, chapaCheckoutUrl: data.data?.checkout_url ?? "" } });

        return NextResponse.json({ success: true, checkout_url: data.data?.checkout_url });
    } catch (err) {
        console.error("[Chapa init]", err);
        return NextResponse.json({ error: "Failed to connect to Chapa." }, { status: 500 });
    }
}
