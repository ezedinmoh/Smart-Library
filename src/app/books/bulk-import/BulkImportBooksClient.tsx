"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";

export default function BulkImportBooksClient() {
    const fileRef = useRef<HTMLInputElement>(null);
    const zipRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) { showToast("Please select a CSV or Excel file.", "warning"); return; }
        setLoading(true);
        const fd = new FormData(); 
        fd.append("file", file);
        if (zipFile) fd.append("zip_file", zipFile);
        
        const res = await fetch("/api/books/bulk-import", { method: "POST", body: fd });
        const data = await res.json();
        
        if (res.ok) { 
            setResult(data); 
            showToast(`Imported ${data.imported} book(s).`, "success"); 
        } else {
            setResult({ imported: 0, skipped: 0, errors: [data.error || "Failed to import books."] });
            showToast("Import failed.", "error");
        }
        setLoading(false);
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <nav className="breadcrumb">
                    <Link href="/dashboard">Dashboard</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <Link href="/books/manage">Books</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <span>Bulk Import</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    <h1 className="page-title-gradient">Bulk Import Books</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Import multiple books from a CSV or Excel file</p>
            </div>

            {/* Instructions Card */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, border: "1px solid var(--border)", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    📋 Instructions
                </h3>
                <ol style={{ marginLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 20 }}>
                    <li>Download the template file below</li>
                    <li>Fill in your book data (CSV or Excel format)</li>
                    <li><strong>Optional:</strong> Add <code>cover_filename</code> and <code>pdf_filename</code> columns if you want to include files</li>
                    <li><strong>Optional:</strong> Prepare a ZIP file with your cover images and PDFs</li>
                    <li>Upload the CSV/Excel file (and optionally the ZIP file)</li>
                    <li>Review the import results</li>
                </ol>
                
                <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", padding: "16px", marginBottom: 24 }}>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
                        <strong style={{ color: "var(--success)" }}>✨ Media Support:</strong> You can now include cover images and PDF files! 
                        The <code>cover_filename</code> and <code>pdf_filename</code> columns are optional - books will import successfully even if files are not found.
                    </p>
                </div>
                
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <a href="/api/books/import-template?format=csv" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download CSV Template
                    </a>
                    <a href="/api/books/import-template?format=excel" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.1)", color: "var(--success)", borderColor: "rgba(16,185,129,0.3)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Download Excel Template
                    </a>
                </div>
            </div>

            {/* Upload Form Card */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                    📤 Upload Files
                </h3>
                
                <form onSubmit={handleSubmit}>
                    {/* CSV/Excel Input */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>Select CSV/Excel File (Required)</label>
                        <div style={{ border: `2px dashed ${file ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: 24, textAlign: "center", cursor: "pointer", background: file ? "rgba(16,185,129,0.03)" : "var(--background)", transition: "all 0.2s" }} onClick={() => fileRef.current?.click()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 32, height: 32, color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                            {file ? <p style={{ fontWeight: 600, color: "var(--primary)" }}>{file.name}</p> : <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Click to select a data file (.csv, .xlsx)</p>}
                            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                        </div>
                    </div>

                    {/* ZIP Input */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>Select ZIP File with Covers & PDFs (Optional)</label>
                        <div style={{ border: `2px dashed ${zipFile ? "var(--secondary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: 24, textAlign: "center", cursor: "pointer", background: zipFile ? "rgba(14,165,233,0.03)" : "var(--background)", transition: "all 0.2s" }} onClick={() => zipRef.current?.click()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 32, height: 32, color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            {zipFile ? <p style={{ fontWeight: 600, color: "var(--secondary)" }}>{zipFile.name}</p> : <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Click to select a ZIP file (.zip)</p>}
                            <input ref={zipRef} type="file" accept=".zip" style={{ display: "none" }} onChange={e => setZipFile(e.target.files?.[0] ?? null)} />
                        </div>
                    </div>
                    
                    {/* ZIP Instructions */}
                    <div style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: "var(--radius-md)", padding: "20px", marginBottom: 32 }}>
                        <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                            📁 ZIP File Structure (Optional)
                        </h4>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                            If you want to include cover images and PDFs, organize your ZIP file exactly like this:
                        </p>
                        <pre style={{ background: "var(--background)", padding: "16px", borderRadius: "8px", fontSize: "0.8125rem", overflowX: "auto", border: "1px solid var(--border)", fontFamily: "monospace", color: "var(--text-primary)" }}>{`bulk_upload.zip
├── covers/
│   ├── example_book.jpg
│   ├── another_example.jpg
│   └── ...
└── pdfs/
    ├── example_book.pdf
    ├── another_example.pdf
    └── ...`}</pre>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: 12, display: "flex", gap: 8 }}>
                            <span>💡</span> <strong>Tip:</strong> Filenames in your CSV must exactly match the files in the ZIP.
                        </p>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: "1rem", display: "flex", justifyContent: "center" }} disabled={loading || !file}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        {loading ? "Importing Books..." : "Import Books"}
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
