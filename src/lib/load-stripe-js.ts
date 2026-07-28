declare global {
    interface Window {
        Stripe?: (key: string) => StripeInstance;
    }
}

export interface StripeElements {
    create(type: string, options?: StripeCreatePaymentElementOptions): StripeElement;
    submit(): Promise<{ error?: StripeError }>;
}

export interface StripeElement {
    mount(selector: string | HTMLElement): void;
    unmount(): void;
    destroy(): void;
    on(event: string, handler: (event: unknown) => void): void;
}

export interface StripeCreatePaymentElementOptions {
    layout?: string;
    paymentMethodOrder?: string[];
    wallets?: { applePay?: "never" | "auto"; googlePay?: "never" | "auto" };
    defaultValues?: { billingDetails?: { name?: string; email?: string } };
    [key: string]: unknown;
}

export interface StripeError {
    type?: string;
    message?: string;
    code?: string;
}

export interface StripeInstance {
    elements(options: {
        mode: "payment";
        amount: number;
        currency: string;
        appearance?: Record<string, unknown>;
    }): StripeElements;
    confirmPayment(options: {
        elements: StripeElements;
        clientSecret: string;
        confirmParams: {
            return_url: string;
            payment_method_data?: { billing_details?: { name?: string; email?: string } };
        };
        redirect?: "if_required" | "always";
    }): Promise<{ error?: StripeError; paymentIntent?: { status: string; id: string } }>;
}

function loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.Stripe) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Stripe.js"));
        document.head.appendChild(script);
    });
}

export async function getStripe(publishableKey: string): Promise<StripeInstance | null> {
    await loadStripeScript();
    return window.Stripe?.(publishableKey) ?? null;
}
