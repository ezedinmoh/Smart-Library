"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";

export default function BulkImportUsersClient() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) { showToast("Please select a CSV or Excel file.", "warning"); return; }
        setLoading(true);
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/users/bulk-import", { method: "POST", body: fd });
        const data = await res.json();
        
        if (res.ok) { 
            setResult(data); 
            showToast(`Imported ${data.imported} user(s).`, "success"); 
        } else {
            setResult({ imported: 0, skipped: 0, errors: [data.error || "Failed to import users."] });
            showToast("Import failed.", "error");
        }
        setLoading(false);
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
            <div style={{ marginBottom: 32 }}>
                <nav className="breadcrumb">
                    <Link href="/dashboard">Dashboard</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <Link href="/dashboard/system">System</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <span>Bulk Import Users</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    <h1 className="page-title-gradient">Bulk Import Users</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Import multiple users from a CSV or Excel file</p>
            </div>

            {/* Instructions Card */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, border: "1px solid var(--border)", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    📋 Instructions
                </h3>
                <ol style={{ marginLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 24 }}>
                    <li>Download the template file below</li>
                    <li>Fill in user data (<code>username</code>, <code>email</code>, <code>password</code>, <code>role</code>, etc.)</li>
                    <li>Upload the completed file</li>
                    <li>Users will be created with the specified passwords</li>
                    <li>Inform users to change their passwords after first login</li>
                </ol>
                
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <a href="/api/users/import-template?format=csv" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download CSV Template
                    </a>
                    <a href="/api/users/import-template?format=excel" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(14,165,233,0.1)", color: "#0ea5e9", borderColor: "rgba(14,165,233,0.3)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Download Excel Template
                    </a>
                </div>
            </div>

            {/* Upload Form Card */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                    📤 Upload File
                </h3>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>Select CSV/Excel File (Required)</label>
                        <div style={{ border: `2px dashed ${file ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: 40, textAlign: "center", cursor: "pointer", background: file ? "rgba(16,185,129,0.03)" : "var(--background)", transition: "all 0.2s" }} onClick={() => fileRef.current?.click()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48, color: "var(--text-muted)", margin: "0 auto 16px", display: "block" }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                            {file ? <p style={{ fontWeight: 600, color: "var(--primary)", fontSize: "1.1rem" }}>{file.name}</p> : <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Click to select a data file (.csv, .xlsx) or drag & drop</p>}
                            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                        </div>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: "1rem", display: "flex", justifyContent: "center" }} disabled={loading || !file}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        {loading ? "Importing Users..." : "Import Users"}
                    </button>
                </form>
            </div>

            {/* Results / Errors */}
            {result && (
                <div style={{ marginTop: 24, background: result.errors.length > 0 ? "#FEF2F2" : "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, border: `1px solid ${result.errors.length > 0 ? "#FCA5A5" : "var(--border)"}`, boxShadow: "var(--shadow-sm)" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 20, color: result.errors.length > 0 ? "#DC2626" : "var(--text-primary)" }}>
                        {result.errors.length > 0 ? "⚠️ Import Results with Errors" : "✅ Import Successful"}
                    </h3>
                    
                    <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                        <div style={{ background: result.errors.length > 0 ? "rgba(220,38,38,0.05)" : "rgba(16,185,129,0.1)", padding: "16px 24px", borderRadius: "var(--radius-md)", textAlign: "center", border: `1px solid ${result.errors.length > 0 ? "rgba(220,38,38,0.1)" : "transparent"}` }}>
                            <div style={{ fontSize: "2rem", fontWeight: 800, color: result.errors.length > 0 ? "#DC2626" : "#10b981" }}>{result.imported}</div>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>Successfully Imported</div>
                        </div>
                        <div style={{ background: "rgba(245,158,11,0.1)", padding: "16px 24px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b" }}>{result.skipped}</div>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>Skipped / Failed</div>
                        </div>
                    </div>
                    
                    {result.errors.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 12, color: "#B91C1C" }}>Detailed Errors:</h4>
                            <ul style={{ fontSize: "0.875rem", color: "#991B1B", paddingLeft: 24, lineHeight: 1.6 }}>
                                {result.errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                            {result.errors.length > 50 && <p style={{ fontSize: "0.875rem", color: "#B91C1C", marginTop: 12, fontWeight: 600 }}>...and {result.errors.length - 50} more errors.</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
