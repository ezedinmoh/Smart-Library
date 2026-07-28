"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, getRoleDisplay } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = { admin: "#10b981", librarian: "#0ea5e9", student: "#8b5cf6" };
const ROLES = ["admin", "librarian", "student"] as const;

export default function UserDetailClient({ user, profile, borrowRecords, totalBorrowed, totalReturned, activeBorrows, overdueBorrows, pendingRequests, totalFines, unpaidFines, validUntil }: any) {
    const router = useRouter();
    const [changingRole, setChangingRole] = useState(false);
    const [newRole, setNewRole] = useState(user.role);
    const [newLimit, setNewLimit] = useState(profile?.maxBooksAllowed ?? 7);
    const [savingLimit, setSavingLimit] = useState(false);
    const initials = ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || user.username.slice(0, 2).toUpperCase();

    async function changeRole() {
        if (newRole === user.role) { setChangingRole(false); return; }
        const ok = await showConfirm(`Change ${user.username}'s role to ${getRoleDisplay(newRole)}?`, "warning");
        if (!ok) return;
        const res = await fetch(`/api/users/${user.id}/role`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
        const d = await res.json();
        if (res.ok) { showToast(`Role changed to ${getRoleDisplay(newRole)}.`, "success"); setChangingRole(false); router.refresh(); }
        else showToast(d.error || "Failed.", "error");
    }

    async function updateLimit() {
        setSavingLimit(true);
        const res = await fetch(`/api/users/${user.id}/borrow-limit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maxBooks: newLimit }) });
        if (res.ok) { showToast("Borrow limit updated.", "success"); router.refresh(); }
        else showToast("Failed.", "error");
        setSavingLimit(false);
    }

    async function toggleActive() {
        const action = user.isActive ? "deactivate" : "activate";
        const ok = await showConfirm(`${user.isActive ? "Deactivate" : "Activate"} ${user.username}?`, "warning");
        if (!ok) return;
        const res = await fetch(`/api/users/${user.id}/${action}`, { method: "POST" });
        if (res.ok) { showToast(`User ${action}d.`, "success"); router.refresh(); }
        else showToast("Failed.", "error");
    }

    async function deleteUser() {
        const ok = await showConfirm(`Permanently delete "${user.username}"? This cannot be undone.`, "danger");
        if (!ok) return;
        const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
        if (res.ok) { showToast("User deleted.", "success"); router.push("/users/list"); }
        else showToast("Failed.", "error");
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                <Link href="/users/list" style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M19 12H5m7-7-7 7 7 7" /></svg>Back to Users
                </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32, alignItems: "start" }}>
                {/* Profile Card */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 32, border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ width: 80, height: 80, background: "linear-gradient(135deg,var(--primary),var(--secondary))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        {profile?.profilePicture
                            ? <img src={profile.profilePicture} alt="Avatar" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
                            : <span style={{ color: "white", fontSize: "1.5rem", fontWeight: 700 }}>{initials}</span>
                        }
                    </div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 4 }}>{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}</h2>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 12 }}>@{user.username}</p>
                    <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: `${ROLE_COLORS[user.role]}20`, color: ROLE_COLORS[user.role], marginBottom: 16 }}>{getRoleDisplay(user.role)}</span>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: user.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: user.isActive ? "#22c55e" : "var(--error)" }}>{user.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                        {[["Active", activeBorrows], ["Overdue", overdueBorrows], ["Total", totalBorrowed], ["Returned", totalReturned]].map(([l, v]) => (
                            <div key={l as string} style={{ background: "var(--background)", borderRadius: "var(--radius)", padding: 12, border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--primary)" }}>{v}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{l}</div>
                            </div>
                        ))}
                    </div>
                    {/* Library card mini */}
                    <div style={{ background: "linear-gradient(135deg,var(--primary),var(--secondary))", borderRadius: "var(--radius)", padding: 14, color: "white", textAlign: "left", marginBottom: 20 }}>
                        <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Library Card</div>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{user.username.toUpperCase()}</div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Valid until: {formatDate(validUntil)}</div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button className="btn btn-secondary" onClick={toggleActive}>{user.isActive ? "Deactivate User" : "Activate User"}</button>
                        <button className="btn btn-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)" }} onClick={deleteUser}>Delete User</button>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Info */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>User Information</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {[["Email", user.email], ["Phone", user.phoneNumber || "—"], ["Address", user.address || "—"], ["Joined", formatDate(user.createdAt)], ["Max Books", profile?.maxBooksAllowed ?? 7], ["Badge", profile?.readingBadge ?? "reader"]].map(([l, v]) => (
                                <div key={l as string}><div style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginBottom: 2 }}>{l}</div><div style={{ fontWeight: 500 }}>{v}</div></div>
                            ))}
                        </div>
                    </div>

                    {/* Role Change */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Role Management</h3>
                            <button className={`btn btn-sm ${changingRole ? "btn-secondary" : "btn-primary"}`} onClick={() => setChangingRole(!changingRole)}>{changingRole ? "Cancel" : "Change Role"}</button>
                        </div>
                        {changingRole ? (
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", flex: 1 }}>
                                    {ROLES.map(r => <option key={r} value={r}>{getRoleDisplay(r)}</option>)}
                                </select>
                                <button className="btn btn-primary btn-sm" onClick={changeRole}>Save</button>
                            </div>
                        ) : (
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Current role: <strong>{getRoleDisplay(user.role)}</strong></p>
                        )}
                    </div>

                    {/* Borrow Limit */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Borrow Limit</h3>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <input type="number" min={1} max={20} value={newLimit} onChange={e => setNewLimit(parseInt(e.target.value))} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", width: 100 }} />
                            <button className="btn btn-primary btn-sm" onClick={updateLimit} disabled={savingLimit}>{savingLimit ? "Saving…" : "Update"}</button>
                        </div>
                        <p style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginTop: 8 }}>Between 1 and 20 books</p>
                    </div>

                    {/* Fines */}
                    {totalFines > 0 && (
                        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Fine Summary</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div><div style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>Total Fines</div><div style={{ fontWeight: 700, color: "var(--error)" }}>ETB {totalFines.toFixed(2)}</div></div>
                                <div><div style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>Unpaid</div><div style={{ fontWeight: 700, color: unpaidFines > 0 ? "var(--error)" : "#22c55e" }}>ETB {unpaidFines.toFixed(2)}</div></div>
                            </div>
                        </div>
                    )}

                    {/* Recent Borrows */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Recent Borrow History</h3>
                        {borrowRecords.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No borrow history.</p> : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                                        {["Book", "Borrow Date", "Due Date", "Status", "Fine"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.813rem", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>
                                        {borrowRecords.map((r: any) => (
                                            <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                                <td style={{ padding: "10px 12px", fontSize: "0.875rem" }}><Link href={`/books/${r.bookId}`} style={{ color: "var(--primary)" }}>{r.book.title}</Link></td>
                                                <td style={{ padding: "10px 12px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{formatDate(r.borrowDate)}</td>
                                                <td style={{ padding: "10px 12px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{formatDate(r.dueDate)}</td>
                                                <td style={{ padding: "10px 12px" }}><span style={{ padding: "3px 8px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: r.status === "returned" ? "rgba(14,165,233,0.1)" : r.status === "overdue" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: r.status === "returned" ? "#0ea5e9" : r.status === "overdue" ? "var(--error)" : "#10b981" }}>{r.status}</span></td>
                                                <td style={{ padding: "10px 12px", fontSize: "0.875rem" }}>{parseFloat(r.fineAmount) > 0 ? `ETB ${parseFloat(r.fineAmount).toFixed(2)}` : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
