"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/ToastNotifications";

export default function SettingsClient({ settings }: { settings: any }) {
    const router = useRouter();
    const [form, setForm] = useState({
        defaultBorrowLimit: settings.defaultBorrowLimit,
        finePerDay: parseFloat(settings.finePerDay.toString()),
        etbToUsdRate: parseFloat(settings.etbToUsdRate.toString()),
        maxBorrowDays: settings.maxBorrowDays,
        applyToAll: false,
    });
    const [saving, setSaving] = useState(false);

    function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); setSaving(true);
        const res = await fetch("/api/dashboard/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) { showToast("Settings updated successfully.", "success"); router.refresh(); }
        else showToast("Failed to update settings.", "error");
        setSaving(false);
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 640 }}>
            <div style={{ marginBottom: 32 }}>
                <nav className="breadcrumb">
                    <a href="/dashboard">Dashboard</a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <span>System Settings</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" /></svg>
                    <h1 className="page-title-gradient">System Settings</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Configure library system parameters</p>
            </div>
            <form onSubmit={handleSubmit}>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 32, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 28, boxShadow: "var(--shadow-sm)" }}>
                    {[
                        { label: "Default Borrow Limit", key: "defaultBorrowLimit", type: "number", min: 1, max: 20, help: "Max books a user can borrow at once (1–20)" },
                        { label: "Fine Per Day (ETB)", key: "finePerDay", type: "number", min: 0, step: "0.01", help: "Daily fine amount for overdue books in Ethiopian Birr" },
                        { label: "Max Borrow Days", key: "maxBorrowDays", type: "number", min: 1, max: 90, help: "How many days a book can be borrowed (1–90)" },
                        { label: "ETB to USD Rate", key: "etbToUsdRate", type: "number", min: 0, step: "0.0001", help: "Exchange rate: 1 ETB = X USD (e.g. 0.0180)" },
                    ].map(({ label, key, type, min, max, step, help }) => (
                        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{label}</label>
                            <input
                                type={type} min={min} max={max} step={step ?? "1"}
                                value={(form as any)[key]}
                                onChange={e => set(key, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                                style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", fontSize: "0.9375rem", transition: "border-color 0.2s, box-shadow 0.2s", outline: "none" }}
                                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.1)"; }}
                                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                            />
                            <p style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>{help}</p>
                        </div>
                    ))}

                    <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.01))", borderRadius: "var(--radius-lg)", padding: 20, border: "1px solid rgba(16,185,129,0.2)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, right: 0, width: 64, height: 64, background: "rgba(16,185,129,0.1)", borderRadius: "0 0 0 100%", pointerEvents: "none" }} />
                        <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 12, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            Current Configuration
                        </h4>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>Borrow limit: <strong style={{ color: "var(--text-primary)" }}>{form.defaultBorrowLimit} books</strong></span>
                            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>Fine: <strong style={{ color: "var(--text-primary)" }}>ETB {form.finePerDay}/day</strong></span>
                            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>Max days: <strong style={{ color: "var(--text-primary)" }}>{form.maxBorrowDays} days</strong></span>
                            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>Rate: <strong style={{ color: "var(--text-primary)" }}>1 ETB = ${form.etbToUsdRate} USD</strong></span>
                        </div>
                    </div>

                    <div style={{ padding: 20, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: "var(--radius-md)" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                            <input type="checkbox" checked={form.applyToAll} onChange={e => set("applyToAll", e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--primary)" }} />
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>Apply borrow limit to all existing users</span>
                        </label>
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 8, marginLeft: 30, marginBottom: 0 }}>
                            If checked, all existing users will be updated to the new borrow limit. Otherwise, only new users will be affected.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: "10px 24px", fontSize: "0.9375rem", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                            {saving ? "Saving…" : "Save Settings"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
