"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface Props {
    book: {
        id: number;
        title: string;
        author?: string;
        coverImage?: string;
    };
}

export default function PDFReaderClient({ book }: Props) {
    const pdfSrc = `/api/books/${book.id}/pdf`;
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Pre-check that the API actually returns a PDF before loading the iframe
    useEffect(() => {
        fetch(pdfSrc, { method: "HEAD" })
            .then(res => {
                if (res.ok) {
                    setStatus("ready");
                } else if (res.status === 404) {
                    setStatus("error");
                    setErrorMsg("The PDF file for this book is not yet available on the server.");
                } else if (res.status === 401 || res.status === 403) {
                    setStatus("error");
                    setErrorMsg("You don't have permission to read this book.");
                } else {
                    setStatus("error");
                    setErrorMsg(`Could not load PDF (server error ${res.status}).`);
                }
            })
            .catch(() => {
                setStatus("error");
                setErrorMsg("Network error — could not reach the PDF server.");
            });
    }, [pdfSrc]);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    };

    return (
        <div ref={containerRef} style={{ background: "var(--background)", minHeight: "85vh", display: "flex", flexDirection: "column", padding: "16px 24px 32px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>

            {/* Toolbar */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
                    <Link href={`/books/${book.id}`} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                            <path d="M19 12H5m7-7-7 7 7 7" />
                        </svg>
                        Back
                    </Link>
                    <div style={{ minWidth: 0 }}>
                        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {book.title}
                        </h1>
                        {book.author && <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>by {book.author}</p>}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={toggleFullscreen} className="btn btn-sm" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" }} title="Toggle Fullscreen">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                    </button>
                    {status === "ready" && (
                        <>
                            <a href={pdfSrc} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                New Tab
                            </a>
                            <a href={pdfSrc} download={`${book.title}.pdf`} className="btn btn-sm btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download PDF
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* PDF Viewer */}
            <div style={{ flex: 1, minHeight: 700, background: "#0f172a", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

                {status === "loading" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "#94a3b8" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48, animation: "spin 1s linear infinite" }}>
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        <p style={{ margin: 0 }}>Loading PDF…</p>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {status === "ready" && (
                    <iframe
                        ref={iframeRef}
                        src={pdfSrc}
                        title={book.title}
                        style={{ width: "100%", height: "100%", minHeight: 700, border: "none", flex: 1, background: "#ffffff", display: "block" }}
                        allowFullScreen
                    />
                )}

                {status === "error" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, color: "white", textAlign: "center", gap: 12 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ width: 56, height: 56 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>PDF Not Available</h3>
                        <p style={{ fontSize: "0.9rem", opacity: 0.75, maxWidth: 420, margin: 0 }}>{errorMsg}</p>
                        <Link href={`/books/${book.id}`} className="btn btn-secondary" style={{ marginTop: 8 }}>
                            Back to Book
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
