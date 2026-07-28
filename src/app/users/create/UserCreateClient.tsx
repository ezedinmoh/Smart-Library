"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";

export default function UserCreateClient() {
    const router = useRouter();
    const [form, setForm] = useState({ username: "", email: "", password: "", firstName: "", lastName: "", role: "student" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; }); }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); setLoading(true);
        const res = await fetch("/api/users/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const data = await res.json();
        if (res.ok) { showToast(`User "${form.username}" created. Verification email sent.`, "success"); router.push("/users/list"); }
        else { if (data.errors) setErrors(data.errors); else showToast(data.error || "Failed.", "error"); }
        setLoading(false);
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
            <div style={{ marginBottom: 24 }}>
                <Link href="/users/list" style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--surface-hover)", borderRadius: "var(--radius)", transition: "all 0.2s" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M19 12H5m7-7-7 7 7 7" /></svg>
                    Back to Users
                </Link>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, var(--primary), var(--secondary))", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                </div>
                <div>
                    <h1 className="page-title-gradient" style={{ margin: 0 }}>Create New User</h1>
                    <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "0.9375rem" }}>Add a new user to the system and send a verification email.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", background: "rgba(0,0,0,0.02)" }}>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            Personal Details
                        </h2>
                    </div>
                    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <FormField label="First Name"><input type="text" style={{ width: "100%" }} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="e.g. Jane" /></FormField>
                            <FormField label="Last Name"><input type="text" style={{ width: "100%" }} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="e.g. Doe" /></FormField>
                        </div>
                    </div>
                </div>

                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", background: "rgba(0,0,0,0.02)" }}>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            Account & Security
                        </h2>
                    </div>
                    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <FormField label="Username *" error={errors.username}><input type="text" style={{ width: "100%" }} value={form.username} onChange={e => set("username", e.target.value)} required placeholder="janedoe99" /></FormField>
                            <FormField label="Email Address *" error={errors.email}><input type="email" style={{ width: "100%" }} value={form.email} onChange={e => set("email", e.target.value)} required placeholder="jane.doe@example.com" /></FormField>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <FormField label="Temporary Password *"><input type="password" style={{ width: "100%" }} value={form.password} onChange={e => set("password", e.target.value)} required minLength={8} placeholder="Min 8 characters" /></FormField>
                            <FormField label="System Role">
                                <select value={form.role} onChange={e => set("role", e.target.value)} style={{ width: "100%" }}>
                                    <option value="student">Student</option>
                                    <option value="librarian">Librarian</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </FormField>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 8, justifyContent: "flex-end" }}>
                    <Link href="/users/list" className="btn btn-secondary" style={{ padding: "12px 24px" }}>Cancel</Link>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "12px 32px", fontSize: "1rem" }}>
                        {loading ? (
                            <><svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Creating…</>
                        ) : "Create User"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="form-group" style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>{label}</label>
            <div>{children}</div>
            {error && <span style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</span>}
        </div>
    );
}
