"use client";
import { useState } from "react";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";

export default function BulkEmailClient({ userCount, allUsers }: { userCount: number, allUsers: any[] }) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [targetRole, setTargetRole] = useState("all");
    const [loading, setLoading] = useState(false);

    // Custom Specific Users State
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [pickerSearch, setPickerSearch] = useState("");

    const handleSelectOne = (id: number) => {
        if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(x => x !== id));
        else setSelectedUsers([...selectedUsers, id]);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (targetRole === "specific" && selectedUsers.length === 0) {
            showToast("Please select at least one user.", "warning");
            return;
        }
        if (!subject.trim() || !message.trim()) { 
            showToast("Subject and message are required.", "warning"); 
            return; 
        }

        let label = "all active users";
        if (targetRole === "student") label = "all students";
        if (targetRole === "librarian") label = "all librarians";
        if (targetRole === "admin") label = "all admins";
        if (targetRole === "specific") label = `${selectedUsers.length} selected users`;

        const ok = await showConfirm(`Send "${subject}" to ${label}?`, "success");
        if (!ok) return;

        setLoading(true);
        const res = await fetch("/api/users/bulk-email", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ 
                subject, 
                message, 
                targetRole,
                specificUserIds: selectedUsers 
            }) 
        });
        const data = await res.json();
        
        if (res.ok) { 
            showToast(`Email sent to ${data.count} user(s)!`, "success"); 
            setSubject(""); 
            setMessage(""); 
            setSelectedUsers([]);
            setTargetRole("all");
        } else {
            showToast(data.error || "Failed.", "error");
        }
        setLoading(false);
    }

    const filteredUsers = allUsers?.filter((u: any) => 
        (u.username.toLowerCase().includes(pickerSearch.toLowerCase()) || 
         u.email.toLowerCase().includes(pickerSearch.toLowerCase()) || 
         (u.firstName + " " + u.lastName).toLowerCase().includes(pickerSearch.toLowerCase()))
    ) || [];

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 840 }}>
            <div style={{ marginBottom: 32 }}>
                <nav className="breadcrumb">
                    <Link href="/dashboard">Dashboard</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <Link href="/users/list">Users</Link>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    <span>Bulk Email</span>
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    <h1 className="page-title-gradient">Bulk Email Users</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Send beautiful HTML emails to multiple users at once.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    
                    {/* Header bar */}
                    <div style={{ display: "flex", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid var(--border)", background: "rgba(16,185,129,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "1rem", fontWeight: 700, color: "var(--primary)" }}>
                            Email Composer
                        </div>
                    </div>

                    <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Target Audience</label>
                                <select 
                                    value={targetRole} 
                                    onChange={e => { setTargetRole(e.target.value); setSelectedUsers([]); }} 
                                    style={{ width: "100%", padding: "12px 16px", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s" }}
                                    onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
                                >
                                    <option value="all">All Active Users ({userCount})</option>
                                    <option value="student">Students Only</option>
                                    <option value="librarian">Librarians Only</option>
                                    <option value="admin">Admins Only</option>
                                    <option value="specific">Specific Users</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Subject *</label>
                                <input 
                                    type="text" 
                                    value={subject} 
                                    onChange={e => setSubject(e.target.value)} 
                                    required 
                                    placeholder="Email subject line" 
                                    style={{ width: "100%", padding: "12px 16px", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s" }} 
                                    onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
                                />
                            </div>
                        </div>

                        {targetRole === "specific" && (
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Selected Users ({selectedUsers.length})</label>
                                
                                {/* Selected Users Chips */}
                                {selectedUsers.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, padding: "12px", background: "var(--background)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                                        {selectedUsers.map(id => {
                                            const u = allUsers?.find((user: any) => user.id === id);
                                            if (!u) return null;
                                            return (
                                                <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9999, padding: "4px 10px 4px 6px", fontSize: "0.8125rem", fontWeight: 500, boxShadow: "var(--shadow-sm)" }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), #0ea5e9)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 700 }}>
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    {u.username}
                                                    <button type="button" onClick={() => handleSelectOne(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", padding: 2, marginLeft: 2, borderRadius: "50%" }} onMouseEnter={e => e.currentTarget.style.color = "var(--error)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* User Picker Search */}
                                <div style={{ border: "2px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--background)", overflow: "hidden", transition: "border-color 0.2s" }} id="user-picker-container">
                                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: "var(--text-muted)" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                        <input 
                                            type="text" 
                                            placeholder="Search by name, username, or email..." 
                                            value={pickerSearch} 
                                            onChange={e => setPickerSearch(e.target.value)} 
                                            style={{ width: "100%", border: "none", background: "transparent", fontSize: "0.875rem", outline: "none", color: "var(--text-primary)" }}
                                            onFocus={() => { document.getElementById("user-picker-container")!.style.borderColor = "var(--primary)"; }}
                                            onBlur={() => { document.getElementById("user-picker-container")!.style.borderColor = "var(--border)"; }}
                                        />
                                    </div>

                                    {/* User List */}
                                    <div style={{ maxHeight: 260, overflowY: "auto", background: "var(--background)" }}>
                                        {filteredUsers.length === 0 ? (
                                            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24, opacity: 0.5 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                No users found matching "{pickerSearch}"
                                            </div>
                                        ) : (
                                            filteredUsers.map((u: any) => {
                                                const isSelected = selectedUsers.includes(u.id);
                                                return (
                                                    <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid var(--border-light)", cursor: "pointer", transition: "all 0.15s", background: isSelected ? "rgba(16,185,129,0.05)" : "transparent" }} className="category-card-hover">
                                                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`, borderRadius: 4, background: isSelected ? "var(--primary)" : "var(--surface)", transition: "all 0.2s" }}>
                                                            {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>}
                                                            <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(u.id)} style={{ opacity: 0, position: "absolute", width: "100%", height: "100%", cursor: "pointer" }} />
                                                        </div>
                                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.875rem", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}>
                                                            {u.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{u.firstName ? `${u.firstName} ${u.lastName}` : u.username} {isSelected && <span style={{ marginLeft: 8, fontSize: "0.6875rem", background: "var(--primary)", color: "white", padding: "2px 6px", borderRadius: 9999, fontWeight: 700, textTransform: "uppercase" }}>Selected</span>}</div>
                                                            <div style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>{u.email} <span style={{ margin: "0 4px" }}>•</span> Role: {u.role}</div>
                                                        </div>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>Message *</label>
                                <div style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>
                                    Tags: <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: 4 }}>{`{name}`}</code> <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: 4 }}>{`{username}`}</code>
                                </div>
                            </div>
                            <textarea 
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                                required 
                                rows={8} 
                                placeholder="Write your message here… HTML templates will be applied automatically." 
                                style={{ width: "100%", padding: "12px 16px", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", color: "var(--text-primary)", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
                                onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border-light)" }}>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "10px 24px" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: "middle" }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                {loading ? "Sending…" : "Send Email"}
                            </button>
                            <Link href="/users/list" className="btn btn-secondary" style={{ padding: "10px 24px" }}>Cancel</Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
