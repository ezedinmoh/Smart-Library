"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe as StripeInstance, StripeElements } from "@stripe/stripe-js";

interface Props {
    record: { id: number; fineAmount: number; book: { title: string; author: string } };
    amountUsd: number;
    processingFeeUsd: number;
    totalUsd: number;
    totalUsdCents: number;
    stripePublicKey: string;
    isTestMode: boolean;
    userFullName: string;
    userEmail: string;
}

function copyToClipboard(text: string) {
    try {
        navigator.clipboard.writeText(text).catch(() => {
            // Fallback for unfocused document (e.g. DevTools open)
            const el = document.createElement("textarea");
            el.value = text;
            el.style.position = "fixed";
            el.style.opacity = "0";
            document.body.appendChild(el);
            el.focus();
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
        });
    } catch {
        // Silent fail — user can copy manually
    }
}

export default function PaymentMethodClient({
    record, amountUsd, processingFeeUsd, totalUsd, totalUsdCents,
    stripePublicKey, isTestMode, userFullName, userEmail,
}: Props) {
    const router = useRouter();
    const [selected, setSelected] = useState<"stripe" | "chapa" | null>(null);

    // Stripe state
    const [stripeReady, setStripeReady] = useState(false);
    const [stripeLoading, setStripeLoading] = useState(false);
    const [stripeSubmitting, setStripeSubmitting] = useState(false);
    const [stripeError, setStripeError] = useState("");
    const [stripeClientSecret, setStripeClientSecret] = useState("");
    const stripeInstanceRef = useRef<StripeInstance | null>(null);  // single instance
    const stripeElementsRef = useRef<StripeElements | null>(null);
    const paymentMountedRef = useRef(false);

    // Chapa state
    const [chapaLoading, setChapaLoading] = useState(false);

    // When Stripe is selected, init the Elements form
    useEffect(() => {
        if (selected !== "stripe" || stripeReady || stripeLoading) return;

        async function initStripe() {
            setStripeLoading(true);
            setStripeError("");
            try {
                // 1. Create payment intent
                const res = await fetch(`/api/payments/stripe/create-intent/${record.id}`, { method: "POST" });
                const data = await res.json();
                if (!res.ok) {
                    setStripeError(data.error || "Failed to initialize payment.");
                    return;
                }
                const clientSecret = data.client_secret;
                setStripeClientSecret(clientSecret);

                // 2. Load Stripe via official SDK — store in ref so submit uses same instance
                const stripe = await loadStripe(stripePublicKey);
                if (!stripe) { setStripeError("Stripe failed to load."); return; }
                stripeInstanceRef.current = stripe;

                // 3. Mount Elements using client_secret pattern (must match confirmPayment)
                //    On localhost (HTTP), hide wallet/redirect methods that require HTTPS
                const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
                const appearance = {
                    theme: document.documentElement.getAttribute("data-theme") === "dark" ? "night" as const : "stripe" as const,
                    variables: { colorPrimary: "#10b981" },
                };
                // Pass clientSecret to elements() — this is the correct pattern when the
                // intent is already created server-side. DO NOT also pass mode/amount here.
                const elements = stripe.elements({ clientSecret, appearance });
                stripeElementsRef.current = elements;

                // Mount payment element after DOM renders
                setTimeout(() => {
                    const el = elements.create("payment", {
                        layout: "tabs",
                        // On localhost (HTTP), hide wallet/redirect methods that require HTTPS
                        ...(isLocalhost && {
                            paymentMethodOrder: ["card"],
                            wallets: { applePay: "never", googlePay: "never" },
                        }),
                        defaultValues: { billingDetails: { name: userFullName, email: userEmail } },
                    });
                    const container = document.getElementById("stripe-payment-element");
                    if (container && !paymentMountedRef.current) {
                        el.mount("#stripe-payment-element");
                        paymentMountedRef.current = true;
                    }
                    setStripeReady(true);
                }, 100);

            } catch (err) {
                setStripeError("Failed to initialize Stripe.");
                console.error(err);
            } finally {
                setStripeLoading(false);
            }
        }

        initStripe();
    }, [selected]);

    // Reset Stripe when deselected
    useEffect(() => {
        if (selected !== "stripe") {
            paymentMountedRef.current = false;
            stripeInstanceRef.current = null;
            stripeElementsRef.current = null;
            setStripeReady(false);
            setStripeClientSecret("");
            setStripeError("");
        }
    }, [selected]);

    async function handleStripeSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!stripeElementsRef.current || !stripeClientSecret) return;
        setStripeSubmitting(true);
        setStripeError("");

        try {
            // Use the SAME Stripe instance that created the elements
            const stripe = stripeInstanceRef.current;
            if (!stripe) { setStripeError("Stripe not initialized."); return; }

            // Submit elements first (validation)
            const { error: submitError } = await stripeElementsRef.current.submit();
            if (submitError) { setStripeError(submitError.message || "Payment details invalid."); return; }

            // Confirm payment — use redirect: "if_required" to avoid HTTPS requirement for localhost
            const returnUrl = `${window.location.origin}/api/payments/stripe/success`;
            // Note: clientSecret is already bound to the elements instance — do NOT pass it again here.
            // Passing clientSecret to both elements() and confirmPayment() causes a Stripe error.
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements: stripeElementsRef.current,
                confirmParams: {
                    return_url: returnUrl,
                    payment_method_data: { billing_details: { name: userFullName, email: userEmail } },
                },
                redirect: "if_required",
            });

            if (error) {
                setStripeError(error.message || "Payment failed. Please try again.");
            } else if (paymentIntent?.status === "succeeded") {
                // Payment succeeded inline — confirm on server
                const confirmRes = await fetch(`/api/payments/stripe/confirm`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
                });
                const confirmData = await confirmRes.json();
                if (confirmRes.ok && confirmData.paymentId) {
                    showToast("Payment successful!", "success");
                    router.push(`/payments/receipt/${confirmData.paymentId}`);
                } else {
                    setStripeError(confirmData.error || "Payment confirmed but server verification failed. Contact support.");
                }
            } else if (paymentIntent?.status === "requires_action") {
                // 3D Secure or redirect needed — this case uses the return_url
                showToast("Redirecting for authentication…", "info");
            }
        } catch (err) {
            console.error(err);
            setStripeError("An unexpected error occurred.");
        } finally {
            setStripeSubmitting(false);
        }
    }

    async function handleChapa() {
        setChapaLoading(true);
        try {
            const res = await fetch(`/api/payments/chapa/initialize/${record.id}`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || "Failed to initialize Chapa payment.", "error");
                return;
            }
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                showToast("No checkout URL returned from Chapa.", "error");
            }
        } catch {
            showToast("Network error. Please try again.", "error");
        } finally {
            setChapaLoading(false);
        }
    }

    return (
        <div className="page-content" style={{ paddingTop: 140, paddingBottom: 60 }}>
            <div className="container" style={{ maxWidth: 800 }}>
                <div style={{ marginBottom: 28 }}>
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== "undefined" && window.history.length > 1) {
                                router.back();
                            } else {
                                router.push("/borrow/my-books");
                            }
                        }}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            padding: "10px 20px",
                            borderRadius: 9999,
                            color: "var(--text-primary)",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "var(--shadow-sm)"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--primary)";
                            e.currentTarget.style.transform = "translateX(-3px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.transform = "translateX(0)";
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: "var(--primary)" }}>
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to My Books
                    </button>
                </div>

                {/* Page Header */}
                <div className="page-header" style={{ textAlign: "center", marginBottom: 36 }}>
                    <div className="page-title" style={{ justifyContent: "center", marginBottom: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 32, height: 32, color: "var(--primary)" }}>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                            <path d="M12 18V6" />
                        </svg>
                        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: 0 }}>Pay <span className="gradient-text">Library Fine</span></h1>
                    </div>
                    <p className="page-description" style={{ fontSize: "1.063rem", margin: 0 }}>Choose your preferred payment method to settle your fine</p>
                </div>

            {/* Fine Summary Banner */}
            <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", padding: 24, borderRadius: "var(--radius-lg)", marginBottom: 32, textAlign: "center" }}>
                <div style={{ fontSize: "1.125rem", opacity: 0.9 }}>Total Amount Due</div>
                <div style={{ fontSize: "3rem", fontWeight: 700, margin: "16px 0" }}>ETB {record.fineAmount.toFixed(2)}</div>
                <div style={{ fontSize: "1.125rem", opacity: 0.9 }}>≈ ${amountUsd.toFixed(2)} USD</div>
            </div>

            {/* Book Info */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: 20, background: "var(--surface)", borderRadius: "var(--radius)", marginBottom: 32, border: "1px solid var(--border)" }}>
                <div style={{ width: 60, height: 80, background: "linear-gradient(135deg,#10b981,#0ea5e9)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 30, height: 30 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                </div>
                <div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 4 }}>{record.book.title}</h3>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>by {record.book.author}</p>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 32, marginBottom: 24 }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 24 }}>Select Payment Method</h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                    {/* Stripe card */}
                    <div onClick={() => setSelected("stripe")} style={{ border: `2px solid ${selected === "stripe" ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: 24, cursor: "pointer", transition: "all 0.3s ease", textAlign: "center", background: selected === "stripe" ? "rgba(16,185,129,0.05)" : "transparent" }}
                        onMouseEnter={e => { if (selected !== "stripe") (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }}
                        onMouseLeave={e => { if (selected !== "stripe") (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                        <div style={{ width: 60, height: 60, margin: "0 auto 16px", background: "linear-gradient(135deg,#635bff,#4f46e5)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 32, height: 32 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                        </div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>Stripe</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 12 }}>Cards, Apple Pay, Google Pay &amp; more</div>
                        <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--primary)" }}>${totalUsd.toFixed(2)} USD</div>
                        {processingFeeUsd > 0 && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>Includes ${processingFeeUsd.toFixed(2)} processing fee</div>}
                    </div>

                    {/* Chapa card */}
                    <div onClick={() => setSelected("chapa")} style={{ border: `2px solid ${selected === "chapa" ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: 24, cursor: "pointer", transition: "all 0.3s ease", textAlign: "center", background: selected === "chapa" ? "rgba(16,185,129,0.05)" : "transparent" }}
                        onMouseEnter={e => { if (selected !== "chapa") (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }}
                        onMouseLeave={e => { if (selected !== "chapa") (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                        <div style={{ width: 60, height: 60, margin: "0 auto 16px", background: "linear-gradient(135deg,#10b981,#059669)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 32, height: 32 }}><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                        </div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>Chapa</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 12 }}>Telebirr, CBE Birr, M-Pesa</div>
                        <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--primary)" }}>ETB {record.fineAmount.toFixed(2)}</div>
                    </div>
                </div>

                {/* Stripe Form */}
                {selected === "stripe" && (
                    <div>
                        {/* Test mode info */}
                        {isTestMode && (
                            <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "var(--radius)", padding: 16, marginBottom: 20 }}>
                                <strong style={{ color: "var(--secondary)", display: "block", marginBottom: 10 }}>🧪 Test Mode — Use Test Card</strong>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "white", padding: 12, borderRadius: 8, fontSize: "0.813rem" }}>
                                    {[["Card Number", "4242 4242 4242 4242"], ["Expiry", "12/34"], ["CVC", "123"], ["ZIP", "12345"]].map(([label, val]) => (
                                        <div key={label}>
                                            <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: 2 }}>{label}</div>
                                            <div style={{ fontFamily: "monospace", color: "var(--secondary)", fontWeight: 600, padding: "4px 8px", background: "rgba(14,165,233,0.1)", borderRadius: 4, cursor: "pointer" }}
                                                onClick={() => copyToClipboard(val.replace(/\s/g, ""))}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Processing fee info */}
                        {processingFeeUsd > 0 && (
                            <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "var(--radius)", padding: 12, marginBottom: 16 }}>
                                <strong style={{ color: "var(--secondary)", display: "block", marginBottom: 8 }}>Payment Breakdown</strong>
                                <div style={{ background: "white", padding: 10, borderRadius: 6, fontSize: "0.813rem", display: "flex", flexDirection: "column", gap: 4 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Fine Amount:</span><span>${amountUsd.toFixed(2)} USD</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Processing Fee:</span><span>${processingFeeUsd.toFixed(2)} USD</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: 4 }}><span>Total:</span><span>${totalUsd.toFixed(2)} USD</span></div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleStripeSubmit}>
                            {/* Stripe Elements mount point */}
                            {stripeLoading && (
                                <div style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem", border: "1px dashed var(--border)", borderRadius: "var(--radius)", marginBottom: 16 }}>
                                    <div style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                                    Loading secure payment form…
                                </div>
                            )}
                            <div id="stripe-payment-element" style={{ minHeight: stripeReady ? 120 : 0, marginBottom: stripeReady ? 16 : 0 }} />

                            {stripeError && (
                                <div style={{ color: "var(--error)", fontSize: "0.875rem", marginBottom: 12, padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius)" }}>
                                    {stripeError}
                                </div>
                            )}

                            <button id="stripe-submit-button" name="stripe-submit-button" type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
                                disabled={!stripeReady || stripeSubmitting}>
                                {stripeSubmitting ? (
                                    <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Processing…</>
                                ) : (
                                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> Pay ${totalUsd.toFixed(2)} USD</>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Chapa Form */}
                {selected === "chapa" && (
                    <div>
                        {isTestMode && (
                            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius)", padding: 16, marginBottom: 20 }}>
                                <strong style={{ color: "var(--primary)", display: "block", marginBottom: 10 }}>🧪 Test Mode — Use Test Phone Numbers</strong>
                                <div style={{ background: "white", padding: 12, borderRadius: 8, fontSize: "0.813rem" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                        {[["Telebirr", "0900123456"], ["CBE Birr", "0900123456"], ["Awash Bank", "0900123456"], ["M-Pesa", "0700123456"]].map(([name, num]) => (
                                            <div key={name}>
                                                <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: 2 }}>{name}</div>
                                                <div style={{ fontFamily: "monospace", color: "var(--primary)", fontWeight: 600, padding: "4px 8px", background: "rgba(16,185,129,0.1)", borderRadius: 4, cursor: "pointer" }}
                                                    onClick={() => copyToClipboard(num)}>{num}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: 10, padding: 10, background: "rgba(245,158,11,0.1)", borderRadius: 6, fontSize: "0.813rem", color: "var(--text-secondary)" }}>
                                        <strong style={{ color: "var(--warning)" }}>⚠ Important:</strong> After clicking Pay, you'll be redirected to Chapa. You <strong>must use one of the test numbers above</strong> — real numbers won't work in test mode.
                                    </div>
                                </div>
                            </div>
                        )}
                        <button id="chapa-submit-button" name="chapa-submit-button" type="button" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleChapa} disabled={chapaLoading}>
                            {chapaLoading ? (
                                <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Redirecting…</>
                            ) : (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> Pay ETB {record.fineAmount.toFixed(2)}</>
                            )}
                        </button>
                    </div>
                )}

                {!selected && (
                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled>
                        Select a payment method above
                    </button>
                )}
            </div>

            <div style={{ textAlign: "center" }}>
                <Link href="/borrow/my-books" className="btn btn-secondary">Cancel</Link>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
