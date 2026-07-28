"use client";

import { useEffect, useRef } from "react";

type ConfirmType = "danger" | "warning" | "success";
type ConfirmListener = (message: string, type: ConfirmType, resolve: (v: boolean) => void) => void;

const listeners: Set<ConfirmListener> = new Set();

export function showConfirm(message: string, type: ConfirmType = "warning"): Promise<boolean> {
    return new Promise((resolve) => {
        listeners.forEach((fn) => fn(message, type, resolve));
    });
}

export function ConfirmModal() {
    const modalRef = useRef<HTMLDivElement>(null);
    const resolveRef = useRef<((v: boolean) => void) | null>(null);

    useEffect(() => {
        function handler(message: string, type: ConfirmType, resolve: (v: boolean) => void) {
            resolveRef.current = resolve;
            const modal = modalRef.current;
            if (!modal) return;

            const titleEl = modal.querySelector<HTMLElement>("#confirmTitle")!;
            const msgEl = modal.querySelector<HTMLElement>("#confirmMessage")!;
            const iconEl = modal.querySelector<HTMLElement>("#confirmIcon")!;
            const okBtn = modal.querySelector<HTMLElement>("#confirmOk")!;

            msgEl.textContent = message;

            const styles: Record<ConfirmType, { bg: string; color: string; title: string }> = {
                danger: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", title: "Confirm Action" },
                warning: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", title: "Please Confirm" },
                success: { bg: "rgba(16,185,129,0.1)", color: "#10b981", title: "Confirm" },
            };
            const s = styles[type];
            titleEl.textContent = s.title;
            iconEl.style.background = s.bg;
            iconEl.style.color = s.color;
            (okBtn as HTMLButtonElement).style.background = s.color;

            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
        }

        listeners.add(handler);
        return () => { listeners.delete(handler); };
    }, []);

    function close(value: boolean) {
        const modal = modalRef.current;
        if (modal) modal.style.display = "none";
        document.body.style.overflow = "";
        resolveRef.current?.(value);
        resolveRef.current = null;
    }

    return (
        <div
            ref={modalRef}
            id="confirmModal"
            style={{
                display: "none",
                position: "fixed",
                inset: 0,
                zIndex: 10001,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                alignItems: "center",
                justifyContent: "center",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
        >
            <div
                id="confirmModalContent"
                style={{
                    background: "var(--bg-white, #ffffff)",
                    borderRadius: 16,
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                    maxWidth: 440,
                    width: "90%",
                    animation: "modalSlideIn 0.3s ease-out",
                }}
            >
                <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid var(--border-color,#e5e7eb)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            id="confirmIcon"
                            style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        </div>
                        <h3 id="confirmTitle" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary,#1f2937)", margin: 0 }} />
                    </div>
                </div>
                <div style={{ padding: "20px 24px" }}>
                    <p id="confirmMessage" style={{ fontSize: "0.9375rem", color: "var(--text-secondary,#6b7280)", lineHeight: 1.6, margin: 0 }} />
                </div>
                <div style={{ padding: "16px 24px 24px", display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button
                        id="confirmCancel"
                        onClick={() => close(false)}
                        style={{ padding: "10px 20px", borderRadius: 8, fontSize: "0.9375rem", fontWeight: 600, border: "1px solid var(--border-color,#e5e7eb)", background: "var(--bg-white,#fff)", color: "var(--text-secondary,#6b7280)", cursor: "pointer" }}
                    >
                        Cancel
                    </button>
                    <button
                        id="confirmOk"
                        onClick={() => close(true)}
                        style={{ padding: "10px 20px", borderRadius: 8, fontSize: "0.9375rem", fontWeight: 600, border: "none", cursor: "pointer", color: "white" }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
