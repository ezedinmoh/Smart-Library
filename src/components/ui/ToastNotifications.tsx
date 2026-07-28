"use client";

import { useEffect, useRef } from "react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

/* ─── Singleton event bus ─────────────────────────────────────────────────── */
type ToastListener = (toast: Toast) => void;
const listeners: Set<ToastListener> = new Set();

export function showToast(message: string, type: ToastType = "info", _duration = 5000) {
    const id = Math.random().toString(36).slice(2);
    listeners.forEach((fn) => fn({ id, message, type }));
}

/* ─── Icon maps ───────────────────────────────────────────────────────────── */
const icons: Record<ToastType, string> = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
};
const titles: Record<ToastType, string> = {
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export function ToastContainer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const shownRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        function handleToast({ id, message, type }: Toast) {
            const key = `${type}:${message}`;
            if (shownRef.current.has(key)) return;
            shownRef.current.add(key);
            setTimeout(() => shownRef.current.delete(key), 6000);

            const container = containerRef.current;
            if (!container) return;

            const el = document.createElement("div");
            el.className = `toast toast-${type}`;
            el.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
          <div class="toast-title">${titles[type]}</div>
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.classList.add('removing');setTimeout(()=>this.parentElement.remove(),300)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
            container.appendChild(el);
            setTimeout(() => {
                el.classList.add("removing");
                setTimeout(() => el.remove(), 300);
            }, 5000);
        }

        listeners.add(handleToast);
        return () => { listeners.delete(handleToast); };
    }, []);

    // Auto-show flash messages passed via data attributes on page load
    useEffect(() => {
        const msgs = document.querySelectorAll<HTMLElement>(".django-message-data");
        msgs.forEach((el) => {
            const message = el.dataset.message ?? "";
            const tags = el.dataset.tags ?? "";
            let type: ToastType = "info";
            if (tags.includes("success")) type = "success";
            else if (tags.includes("error") || tags.includes("danger")) type = "error";
            else if (tags.includes("warning")) type = "warning";
            showToast(message, type);
            el.remove();
        });
    }, []);

    // Auto-show flash messages passed via URL query parameters
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const error = params.get("error");
            const success = params.get("success");
            const message = params.get("message");
            const warning = params.get("warning");
            const info = params.get("info");

            const messageMap: Record<string, string> = {
                payment_failed: "Payment failed. Please try again.",
                payment_not_succeeded: "Payment was not successful.",
                not_found: "Resource not found.",
                server_error: "A server error occurred. Please try again.",
                no_txref: "Invalid transaction reference.",
            };

            const getMsg = (val: string) => messageMap[val] || val;

            if (error) showToast(getMsg(error), "error");
            if (success) showToast(getMsg(success), "success");
            if (message) showToast(getMsg(message), "info");
            if (warning) showToast(getMsg(warning), "warning");
            if (info) showToast(getMsg(info), "info");

            // Clean up the URL query parameters so they don't pop up again on refresh
            if (error || success || message || warning || info) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }, []);

    return (
        <div
            ref={containerRef}
            id="toastContainer"
            style={{
                position: "fixed",
                top: 80,
                right: 20,
                zIndex: 10000,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: 400,
                pointerEvents: "none",
            }}
        />
    );
}

/* ─── Flash message renderer (server-side flash via searchParams) ─────────── */
export function FlashMessages({ messages }: { messages: { text: string; type: ToastType }[] }) {
    useEffect(() => {
        messages.forEach(({ text, type }) => showToast(text, type));
    }, [messages]);
    return null;
}
