"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, getDaysOverdue } from "@/lib/utils";

export default function NotificationCenterClient({ overdueRecords, dueSoonRecords, unpaidFines, allUsers }: any) {
    const router = useRouter();
    const [sending, setSending] = useState(false);

    // Selections
    const [selectedDue, setSelectedDue] = useState<number[]>([]);
    const [selectedOverdue, setSelectedOverdue] = useState<number[]>([]);
    const [selectedUnpaid, setSelectedUnpaid] = useState<number[]>([]);

    // Custom Email State
    const [customRecipientType, setCustomRecipientType] = useState("all");
    const [customSubject, setCustomSubject] = useState("");
    const [customBody, setCustomBody] = useState("");
    const [customSelectedUsers, setCustomSelectedUsers] = useState<number[]>([]);
    const [pickerSearch, setPickerSearch] = useState("");

    const totalUnpaidAmount = unpaidFines.reduce((sum: number, r: any) => sum + parseFloat(r.fineAmount.toString()), 0);

    const handleSelectAll = (records: any[], selected: number[], setSelected: any) => {
        if (selected.length === records.length) setSelected([]);
        else setSelected(records.map(r => r.id));
    };

    const handleSelectOne = (id: number, selected: number[], setSelected: any) => {
        if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
        else setSelected([...selected, id]);
    };

    async function sendBulkReminders(endpoint: string, typeName: string, selectedIds: number[], allRecordsLength: number, sendAll: boolean) {
        if (!sendAll && selectedIds.length === 0) {
            showToast("Please select at least one user first.", "warning");
            return;
        }

        const msg = sendAll 
            ? `Send ${typeName} to ALL ${allRecordsLength} users?` 
            : `Send ${typeName} to selected users?`;
            
        const confirmed = await showConfirm(msg, typeName.includes("overdue") ? "danger" : "warning");
        if (!confirmed) return;

        setSending(true);
        const ids = sendAll ? [] : selectedIds;
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recordIds: ids, sendAll })
        });
        const d = await res.json();
        
        if (res.ok) {
            showToast(`Sent ${d.count || ids.length} ${typeName}.`, "success");
            // Clear selections
            if (endpoint.includes("due-soon")) setSelectedDue([]);
            if (endpoint.includes("overdue")) setSelectedOverdue([]);
            if (endpoint.includes("unpaid")) setSelectedUnpaid([]);
        } else {
            showToast("Failed to send reminders.", "error");
        }
        setSending(false);
    }

    async function sendSingleReminder(endpoint: string, recordId: number, username: string, typeName: string) {
        const confirmed = await showConfirm(`Send ${typeName} to ${username}?`, typeName.includes("overdue") ? "danger" : "warning");
        if (!confirmed) return;

        setSending(true);
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recordIds: [recordId], sendAll: false })
        });
        const d = await res.json();
        
        if (res.ok) {
            showToast(`Sent ${typeName} to ${username}.`, "success");
        } else {
            showToast("Failed to send reminder.", "error");
        }
        setSending(false);
    }

    async function handleCustomEmailSend(e: React.FormEvent) {
        e.preventDefault();
        
        if (customRecipientType === "specific" && customSelectedUsers.length === 0) {
            showToast("Please select at least one user.", "warning");
            return;
        }

        let label = "all active users";
        if (customRecipientType === "students") label = "all students";
        if (customRecipientType === "librarians") label = "all librarians";
        if (customRecipientType === "specific") label = `${customSelectedUsers.length} selected users`;

        const confirmed = await showConfirm(`Send "${customSubject}" to ${label}?`, "success");
        if (!confirmed) return;

        setSending(true);
        const res = await fetch("/api/dashboard/reminders/custom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipientType: customRecipientType,
                subject: customSubject,
                body: customBody,
                specificUserIds: customSelectedUsers
            })
        });

        if (res.ok) {
            const d = await res.json();
            showToast(`Custom email sent to ${d.count} users.`, "success");
            setCustomSubject("");
            setCustomBody("");
            setCustomSelectedUsers([]);
        } else {
            showToast("Failed to send custom email.", "error");
        }
        setSending(false);
    }

    const filteredUsers = allUsers.filter((u: any) => 
        (u.username.toLowerCase().includes(pickerSearch.toLowerCase()) || 
         u.email.toLowerCase().includes(pickerSearch.toLowerCase()) || 
         (u.firstName + " " + u.lastName).toLowerCase().includes(pickerSearch.toLowerCase()))
    );

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <nav className="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        <span>Notification Center</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        <h1 className="page-title-gradient">Notification Center</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Send email notifications manually — individually or in bulk</p>
                </div>
            </div>

            {/* Summary Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 32 }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-sm)", transition: "transform 0.2s", cursor: "default" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "rgba(245,158,11,0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b", lineHeight: 1, marginBottom: 4 }}>{dueSoonRecords.length}</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>Due Within 3 Days</div>
                        <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginTop: 2 }}>Reminder emails pending</div>
                    </div>
                </div>
                
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-sm)", transition: "transform 0.2s", cursor: "default" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "rgba(239,68,68,0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ef4444", lineHeight: 1, marginBottom: 4 }}>{overdueRecords.length}</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>Overdue Books</div>
                        <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginTop: 2 }}>Overdue notifications pending</div>
                    </div>
                </div>

                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-sm)", transition: "transform 0.2s", cursor: "default" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0ea5e9", lineHeight: 1, marginBottom: 4 }}>{unpaidFines.length}</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>Unpaid Fines</div>
                        <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginTop: 2 }}>Total: ETB {totalUnpaidAmount.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Section 1: Due Soon */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        Due-Date Reminders
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", fontSize: "0.813rem", fontWeight: 700, borderRadius: 9999, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>{dueSoonRecords.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleSelectAll(dueSoonRecords, selectedDue, setSelectedDue)}>
                            {selectedDue.length === dueSoonRecords.length && dueSoonRecords.length > 0 ? "Deselect All" : "Select All"}
                        </button>
                        <button className="btn btn-sm" style={{ background: "#f59e0b", color: "white" }} disabled={sending} onClick={() => sendBulkReminders("/api/dashboard/reminders/due-soon", "due-date reminders", selectedDue, dueSoonRecords.length, false)}>
                            Send Selected
                        </button>
                        <button className="btn btn-sm" style={{ background: "#f59e0b", color: "white" }} disabled={sending} onClick={() => sendBulkReminders("/api/dashboard/reminders/due-soon", "due-date reminders", selectedDue, dueSoonRecords.length, true)}>
                            Send All
                        </button>
                    </div>
                </div>
                {dueSoonRecords.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 32px", color: "var(--text-muted)" }}>
                        <p style={{ fontSize: "0.9375rem" }}>No books due within the next 3 days.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                                <tr>
                                    <th style={{ padding: "14px 20px", width: 40 }}><input type="checkbox" checked={selectedDue.length === dueSoonRecords.length && dueSoonRecords.length > 0} onChange={() => handleSelectAll(dueSoonRecords, selectedDue, setSelectedDue)} style={{ accentColor: "var(--primary)" }} /></th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>User</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Book</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Due Date</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Status</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dueSoonRecords.map((rec: any) => (
                                    <tr key={rec.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.2s" }} className="category-card-hover">
                                        <td style={{ padding: "14px 20px" }}><input type="checkbox" checked={selectedDue.includes(rec.id)} onChange={() => handleSelectOne(rec.id, selectedDue, setSelectedDue)} style={{ accentColor: "var(--primary)" }} /></td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.813rem" }}>
                                                    {rec.user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{rec.user.username}</div>
                                                    <div style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>{rec.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rec.book.title}</div>
                                        </td>
                                        <td style={{ padding: "14px 20px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{formatDate(rec.dueDate)}</td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <span style={{ padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Due Soon</span>
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <button className="btn btn-sm" style={{ background: "#f59e0b", color: "white" }} disabled={sending} onClick={() => sendSingleReminder("/api/dashboard/reminders/due-soon", rec.id, rec.user.username, "due-date reminder")}>
                                                Send
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Section 2: Overdue */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        Overdue Notifications
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", fontSize: "0.813rem", fontWeight: 700, borderRadius: 9999, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{overdueRecords.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleSelectAll(overdueRecords, selectedOverdue, setSelectedOverdue)}>
                            {selectedOverdue.length === overdueRecords.length && overdueRecords.length > 0 ? "Deselect All" : "Select All"}
                        </button>
                        <button className="btn btn-sm" style={{ background: "#ef4444", color: "white" }} disabled={sending} onClick={() => sendBulkReminders("/api/dashboard/reminders/overdue", "overdue notices", selectedOverdue, overdueRecords.length, false)}>
                            Send Selected
                        </button>
                        <button className="btn btn-sm" style={{ background: "#ef4444", color: "white" }} disabled={sending} onClick={() => sendBulkReminders("/api/dashboard/reminders/overdue", "overdue notices", selectedOverdue, overdueRecords.length, true)}>
                            Send All
                        </button>
                    </div>
                </div>
                {overdueRecords.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 32px", color: "var(--text-muted)" }}>
                        <p style={{ fontSize: "0.9375rem" }}>No overdue books at the moment.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                                <tr>
                                    <th style={{ padding: "14px 20px", width: 40 }}><input type="checkbox" checked={selectedOverdue.length === overdueRecords.length && overdueRecords.length > 0} onChange={() => handleSelectAll(overdueRecords, selectedOverdue, setSelectedOverdue)} style={{ accentColor: "var(--primary)" }} /></th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>User</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Book</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Due Date</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Days Overdue</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Fine</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdueRecords.map((rec: any) => (
                                    <tr key={rec.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.2s" }} className="category-card-hover">
                                        <td style={{ padding: "14px 20px" }}><input type="checkbox" checked={selectedOverdue.includes(rec.id)} onChange={() => handleSelectOne(rec.id, selectedOverdue, setSelectedOverdue)} style={{ accentColor: "var(--primary)" }} /></td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.813rem" }}>
                                                    {rec.user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{rec.user.username}</div>
                                                    <div style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>{rec.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rec.book.title}</div>
                                        </td>
                                        <td style={{ padding: "14px 20px", fontSize: "0.875rem", color: "var(--error)" }}>{formatDate(rec.dueDate)}</td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <span style={{ padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{getDaysOverdue(rec.dueDate)} days</span>
                                        </td>
                                        <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--error)" }}>{parseFloat(rec.fineAmount.toString()).toFixed(2)}</td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <button className="btn btn-sm" style={{ background: "#ef4444", color: "white" }} disabled={sending} onClick={() => sendSingleReminder("/api/dashboard/reminders/overdue", rec.id, rec.user.username, "overdue notice")}>
                                                Send
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Section 3: Unpaid Fines */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
                        Unpaid Fine Notices
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", fontSize: "0.813rem", fontWeight: 700, borderRadius: 9999, background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>{unpaidFines.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleSelectAll(unpaidFines, selectedUnpaid, setSelectedUnpaid)}>
                            {selectedUnpaid.length === unpaidFines.length && unpaidFines.length > 0 ? "Deselect All" : "Select All"}
                        </button>
                        <button className="btn btn-sm" style={{ background: "#0ea5e9", color: "white" }} disabled={sending} onClick={() => sendBulkReminders("/api/dashboard/reminders/unpaid", "unpaid fine notices", selectedUnpaid, unpaidFines.length, false)}>
                            Send Selected
                        </button>
                        <button className="btn btn-sm" style={{ background: "#0ea5e9", color: "white" }} disabled={sending} onClick={() => sendBulkReminders("/api/dashboard/reminders/unpaid", "unpaid fine notices", selectedUnpaid, unpaidFines.length, true)}>
                            Send All
                        </button>
                    </div>
                </div>
                {unpaidFines.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 32px", color: "var(--text-muted)" }}>
                        <p style={{ fontSize: "0.9375rem" }}>No unpaid fines at the moment.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                                <tr>
                                    <th style={{ padding: "14px 20px", width: 40 }}><input type="checkbox" checked={selectedUnpaid.length === unpaidFines.length && unpaidFines.length > 0} onChange={() => handleSelectAll(unpaidFines, selectedUnpaid, setSelectedUnpaid)} style={{ accentColor: "var(--primary)" }} /></th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>User</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Book</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Fine (ETB)</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Status</th>
                                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaidFines.map((rec: any) => (
                                    <tr key={rec.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.2s" }} className="category-card-hover">
                                        <td style={{ padding: "14px 20px" }}><input type="checkbox" checked={selectedUnpaid.includes(rec.id)} onChange={() => handleSelectOne(rec.id, selectedUnpaid, setSelectedUnpaid)} style={{ accentColor: "var(--primary)" }} /></td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.813rem" }}>
                                                    {rec.user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{rec.user.username}</div>
                                                    <div style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>{rec.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rec.book.title}</div>
                                        </td>
                                        <td style={{ padding: "14px 20px", fontSize: "1rem", fontWeight: 700, color: "var(--error)" }}>{parseFloat(rec.fineAmount.toString()).toFixed(2)}</td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <span style={{ padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Unpaid</span>
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <button className="btn btn-sm" style={{ background: "#0ea5e9", color: "white" }} disabled={sending} onClick={() => sendSingleReminder("/api/dashboard/reminders/unpaid", rec.id, rec.user.username, "fine notice")}>
                                                Send
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Section 4: Custom Email */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "1rem", fontWeight: 700, color: "var(--primary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        Custom Email
                    </div>
                </div>
                <div style={{ padding: "24px" }}>
                    <form onSubmit={handleCustomEmailSend}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8 }}>Recipients</label>
                                <select 
                                    value={customRecipientType} 
                                    onChange={e => { setCustomRecipientType(e.target.value); setCustomSelectedUsers([]); }} 
                                    style={{ width: "100%", padding: "12px 16px", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s" }}
                                    onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
                                >
                                    <option value="all">All Active Users</option>
                                    <option value="students">Students Only</option>
                                    <option value="librarians">Librarians Only</option>
                                    <option value="specific">Specific Users</option>
                                </select>
                                <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginTop: 6 }}>Use <code>{`{name}`}</code> and <code>{`{username}`}</code> in the message.</div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8 }}>Subject</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={customSubject} 
                                    onChange={e => setCustomSubject(e.target.value)} 
                                    placeholder="Email subject..." 
                                    style={{ width: "100%", padding: "12px 16px", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s" }}
                                    onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                                    onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
                                />
                            </div>
                        </div>

                        {customRecipientType === "specific" && (
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8 }}>Selected Users ({customSelectedUsers.length})</label>
                                
                                {/* Selected Users Chips */}
                                {customSelectedUsers.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, padding: "12px", background: "var(--background)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                                        {customSelectedUsers.map(id => {
                                            const u = allUsers.find((user: any) => user.id === id);
                                            if (!u) return null;
                                            return (
                                                <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9999, padding: "4px 10px 4px 6px", fontSize: "0.8125rem", fontWeight: 500, boxShadow: "var(--shadow-sm)" }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), #0ea5e9)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 700 }}>
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    {u.username}
                                                    <button type="button" onClick={() => handleSelectOne(id, customSelectedUsers, setCustomSelectedUsers)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", padding: 2, marginLeft: 2, borderRadius: "50%" }} onMouseEnter={e => e.currentTarget.style.color = "var(--error)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
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
                                                const isSelected = customSelectedUsers.includes(u.id);
                                                return (
                                                    <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid var(--border-light)", cursor: "pointer", transition: "all 0.15s", background: isSelected ? "rgba(16,185,129,0.05)" : "transparent" }} className="category-card-hover">
                                                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`, borderRadius: 4, background: isSelected ? "var(--primary)" : "var(--surface)", transition: "all 0.2s" }}>
                                                            {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>}
                                                            <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(u.id, customSelectedUsers, setCustomSelectedUsers)} style={{ opacity: 0, position: "absolute", width: "100%", height: "100%", cursor: "pointer" }} />
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

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8 }}>Message</label>
                            <textarea 
                                required 
                                rows={6} 
                                value={customBody} 
                                onChange={e => setCustomBody(e.target.value)} 
                                placeholder="Write your message here...&#10;&#10;Use {name} for the user's full name, {username} for their username." 
                                style={{ width: "100%", padding: "12px 16px", background: "var(--background)", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", color: "var(--text-primary)", outline: "none", resize: "vertical", transition: "border-color 0.2s" }}
                                onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button type="submit" disabled={sending} className="btn btn-primary" style={{ padding: "10px 24px" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                Send Email
                            </button>
                            <button type="button" onClick={() => { setCustomSubject(""); setCustomBody(""); setCustomSelectedUsers([]); setCustomRecipientType("all"); }} className="btn btn-secondary" style={{ padding: "10px 24px" }}>
                                Clear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
