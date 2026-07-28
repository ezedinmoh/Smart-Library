"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActivityLogFilter({ initialSearch, initialAction }: { initialSearch: string; initialAction: string }) {
    const router = useRouter();
    const [q, setQ] = useState(initialSearch);
    const [action, setAction] = useState(initialAction);

    function handleFilter(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (action) params.set("action", action);
        router.push(`/dashboard/activity-log?${params.toString()}`);
    }

    function clearFilter() {
        setQ("");
        setAction("");
        router.push(`/dashboard/activity-log`);
    }

    return (
        <form onSubmit={handleFilter} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "2", minWidth: 240 }}>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Search Logs</label>
                    <div style={{ position: "relative" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "var(--text-muted)" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input 
                            type="text" 
                            placeholder="Search descriptions, usernames..." 
                            value={q} 
                            onChange={e => setQ(e.target.value)} 
                            style={{ width: "100%", padding: "12px 16px 12px 44px", fontFamily: "'Inter', sans-serif", fontSize: "0.9375rem", color: "var(--text-primary)", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", outline: "none", transition: "border-color 0.2s" }} 
                            onFocus={e => e.target.style.borderColor = "var(--primary)"}
                            onBlur={e => e.target.style.borderColor = "var(--border)"}
                        />
                    </div>
                </div>
                
                <div style={{ flex: "1", minWidth: 180 }}>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Action Type</label>
                    <select 
                        value={action} 
                        onChange={e => setAction(e.target.value)} 
                        style={{ width: "100%", padding: "12px 16px", fontFamily: "'Inter', sans-serif", fontSize: "0.9375rem", color: "var(--text-primary)", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", outline: "none", transition: "border-color 0.2s", appearance: "none" }}
                        onFocus={e => e.target.style.borderColor = "var(--primary)"}
                        onBlur={e => e.target.style.borderColor = "var(--border)"}
                    >
                        <option value="">All Actions</option>
                        <option value="book_borrowed">Book Borrowed</option>
                        <option value="book_returned">Book Returned</option>
                        <option value="book_added">Book Added</option>
                        <option value="book_updated">Book Updated</option>
                        <option value="book_deleted">Book Deleted</option>
                        <option value="user_login">User Login</option>
                        <option value="user_registered">User Registered</option>
                        <option value="request_approved">Request Approved</option>
                        <option value="request_rejected">Request Rejected</option>
                    </select>
                </div>
                
                <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 8, display: "inline-block", verticalAlign: "middle" }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                        Filter
                    </button>
                    {(q || action) && (
                        <button type="button" onClick={clearFilter} className="btn btn-outline" style={{ padding: "12px 24px" }}>
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
