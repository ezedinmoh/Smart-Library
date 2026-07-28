"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { showToast } from "@/components/ui/ToastNotifications";
import { showConfirm } from "@/components/ui/ConfirmModal";
import { formatDate, getRoleDisplay } from "@/lib/utils";

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    admin: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
    librarian: { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
    student: { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6" },
};

export default function UsersListClient({ users, total, page, pageSize, searchParams, roleCounts }: any) {
    const router = useRouter();
    const pathname = usePathname();
    const [, start] = useTransition();
    const [selected, setSelected] = useState<number[]>([]);
    const totalPages = Math.ceil(total / pageSize);

    function update(p: Record<string, string>) {
        const sp = new URLSearchParams(searchParams);
        Object.entries(p).forEach(([k, v]) => v ? sp.set(k, v) : sp.delete(k));
        sp.delete("page");
        start(() => router.push(`${pathname}?${sp.toString()}`));
    }

    function toggleSelect(id: number) {
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    }

    function toggleAll() {
        setSelected(s => s.length === users.length ? [] : users.map((u: any) => u.id));
    }

    async function batchAction(action: string) {
        if (!selected.length) return;
        const label = action === "deactivate" ? "deactivate" : action === "activate" ? "activate" : "delete";
        const ok = await showConfirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${selected.length} selected user(s)?`, action === "delete" ? "danger" : "warning");
        if (!ok) return;
        const res = await fetch(`/api/users/batch/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selected }) });
        if (res.ok) { showToast(`${selected.length} user(s) ${label}d.`, "success"); setSelected([]); router.refresh(); }
        else showToast("Failed.", "error");
    }

    async function deactivate(id: number, username: string) {
        const ok = await showConfirm(`Deactivate "${username}"?`, "warning");
        if (!ok) return;
        const res = await fetch(`/api/users/${id}/deactivate`, { method: "POST" });
        if (res.ok) { showToast(`"${username}" deactivated.`, "success"); router.refresh(); }
        else showToast("Failed.", "error");
    }

    async function activate(id: number, username: string) {
        const res = await fetch(`/api/users/${id}/activate`, { method: "POST" });
        if (res.ok) { showToast(`"${username}" activated.`, "success"); router.refresh(); }
        else showToast("Failed.", "error");
    }

    async function deleteUser(id: number, username: string) {
        const ok = await showConfirm(`Permanently delete "${username}"? This cannot be undone.`, "danger");
        if (!ok) return;
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (res.ok) { showToast(`"${username}" deleted.`, "success"); router.refresh(); }
        else showToast("Failed.", "error");
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            {/* Header — matches Django users_list.html */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <nav className="breadcrumb">
                        <Link href="/dashboard">Dashboard</Link>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        <span>Manage Users</span>
                    </nav>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" /></svg>
                        <h1 className="page-title-gradient">Manage Users</h1>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>{total} user{total !== 1 ? "s" : ""} in the system</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/users/create" className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                        Create User
                    </Link>
                    <a href="/api/users/export/csv" className="btn btn-secondary btn-sm">Export CSV</a>
                    <a href="/api/users/export/excel" className="btn btn-secondary btn-sm">Export Excel</a>
                </div>
            </div>

            {/* Role Summary Stat Cards */}
            <div className="manage-users-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {([
                    { label: "Total Users", count: roleCounts.total, role: "", gradFrom: "#8b5cf6", gradTo: "#7c3aed", icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/>' },
                    { label: "Admins", count: roleCounts.admin, role: "admin", gradFrom: "#ef4444", gradTo: "#dc2626", icon: '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1"/>' },
                    { label: "Librarians", count: roleCounts.librarian, role: "librarian", gradFrom: "#f59e0b", gradTo: "#d97706", icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
                    { label: "Students", count: roleCounts.student, role: "student", gradFrom: "#0ea5e9", gradTo: "#0284c7", icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
                ] as any[]).map(({ label, count, role, gradFrom, gradTo, icon }) => {
                    const isActive = searchParams.role === role && role !== "";
                    return (
                        <button key={label} onClick={() => update({ role })} style={{ background: isActive ? "rgba(16,185,129,0.06)" : "var(--surface)", border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: "18px 20px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 22, height: 22 }} dangerouslySetInnerHTML={{ __html: icon }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.625rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>{count}</div>
                                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                    <div className="search-box" style={{ borderRadius: "var(--radius)", background: "var(--background)", border: "1px solid var(--border)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input type="text" placeholder="Search users by username, email, name..." defaultValue={searchParams.search ?? ""} onChange={e => update({ search: e.target.value })} style={{ width: "100%" }} />
                    </div>
                </div>
                <div style={{ position: "relative", minWidth: 160 }}>
                    <select value={searchParams.role ?? ""} onChange={e => update({ role: e.target.value })} style={{ width: "100%", padding: "10px 36px 10px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", appearance: "none", cursor: "pointer", fontWeight: 500 }}>
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="librarian">Librarian</option>
                        <option value="student">Student</option>
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, pointerEvents: "none", color: "var(--text-muted)" }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
                <div style={{ position: "relative", minWidth: 160 }}>
                    <select value={searchParams.status ?? ""} onChange={e => update({ status: e.target.value })} style={{ width: "100%", padding: "10px 36px 10px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--background)", color: "var(--text-primary)", appearance: "none", cursor: "pointer", fontWeight: 500 }}>
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, pointerEvents: "none", color: "var(--text-muted)" }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {(searchParams.search || searchParams.role || searchParams.status) && <button className="btn btn-secondary" onClick={() => router.push(pathname)} style={{ padding: "10px 16px" }}>Clear Filters</button>}
            </div>

            {/* Batch Actions */}
            {selected.length > 0 && (
                <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{selected.length} selected</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => batchAction("activate")}>Activate</button>
                    <button className="btn btn-sm" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }} onClick={() => batchAction("deactivate")}>Deactivate</button>
                    <button className="btn btn-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)" }} onClick={() => batchAction("delete")}>Delete</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Clear</button>
                </div>
            )}

            {/* Table */}
            <div className="users-table-card" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                {/* Table title bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                        <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Users</span>
                        <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 700, fontSize: "0.8125rem", padding: "2px 10px", borderRadius: 9999 }}>{total}</span>
                    </div>
                </div>
                <div className="table-scroll-wrapper" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--background)", borderBottom: "2px solid var(--border)" }}>
                                <th style={{ padding: "10px 16px", width: 40 }}><input type="checkbox" checked={selected.length === users.length && users.length > 0} onChange={toggleAll} style={{ width: 16, height: 16, accentColor: "#10b981", cursor: "pointer" }} /></th>
                                {["User", "Email", "Role", "Status", "Borrowed", "Joined", "Actions"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: "64px", textAlign: "center" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48, opacity: 0.2, display: "block", margin: "0 auto 12px" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>No users found matching your criteria</p>
                                </td></tr>
                            ) : users.map((u: any) => {
                                const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS.student;
                                const initials = ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || u.username?.[0]?.toUpperCase() || "U";
                                return (
                                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border-light)", background: selected.includes(u.id) ? "rgba(16,185,129,0.03)" : "transparent", transition: "background 0.15s" }}
                                        onMouseEnter={e => { if (!selected.includes(u.id)) e.currentTarget.style.background = "var(--surface-hover)"; }}
                                        onMouseLeave={e => { if (!selected.includes(u.id)) e.currentTarget.style.background = "transparent"; }}>
                                        <td style={{ padding: "14px 16px" }}><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ width: 16, height: 16, accentColor: "#10b981", cursor: "pointer" }} /></td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${rc.color}, ${rc.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9375rem", flexShrink: 0 }}>{initials}</div>
                                                <div>
                                                    <Link href={`/users/${u.id}/detail`} style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", fontSize: "0.9375rem", marginBottom: 1, textDecoration: "none" }}>{[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username}</Link>
                                                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>@{u.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{u.email}</td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ padding: "4px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: rc.bg, color: rc.color, border: `1px solid ${rc.color}33` }}>{getRoleDisplay(u.role)}</span>
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ padding: "4px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: u.isActive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: u.isActive ? "var(--primary)" : "var(--error)", border: `1px solid ${u.isActive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>{u.isActive ? "Active" : "Inactive"}</span>
                                        </td>
                                        <td style={{ padding: "14px 16px", fontSize: "0.875rem" }}>
                                            <div style={{ fontWeight: 600 }}>{u.profile?.currentlyBorrowed ?? 0} <span style={{ color: "var(--text-muted)", fontSize: "0.813rem", fontWeight: 400 }}>books</span></div>
                                        </td>
                                        <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatDate(u.createdAt)}</td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <UActionBtn href={`/users/${u.id}/detail`} color="#10b981" title="View">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                </UActionBtn>
                                                {u.isActive
                                                    ? <UActionBtn color="#f59e0b" title="Deactivate" onClick={() => deactivate(u.id, u.username)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0" /></svg>
                                                    </UActionBtn>
                                                    : <UActionBtn color="#10b981" title="Activate" onClick={() => activate(u.id, u.username)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                                    </UActionBtn>
                                                }
                                                <UActionBtn color="#ef4444" title="Delete" onClick={() => deleteUser(u.id, u.username)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                </UActionBtn>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination info + controls */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} users
                        </span>
                        <div style={{ display: "flex", gap: 5 }}>
                            {page > 1 && <Link href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                                style={paginBtnStyle(false)}>← Prev</Link>}
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                                <Link key={p} href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                                    style={paginBtnStyle(p === page)}>{p}</Link>
                            ))}
                            {page < totalPages && <Link href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                                style={paginBtnStyle(false)}>Next →</Link>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function paginBtnStyle(active: boolean): React.CSSProperties {
    return { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 34, padding: "0 10px", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", border: "1px solid var(--border)", background: active ? "#10b981" : "var(--background)", color: active ? "white" : "var(--text-secondary)", transition: "all 0.2s" };
}

function UActionBtn({ href, color, title, onClick, children }: { href?: string; color: string; title: string; onClick?: () => void; children: React.ReactNode }) {
    const base: React.CSSProperties = { width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "none", cursor: "pointer", transition: "all 0.18s", background: `${color}18`, color, textDecoration: "none", flexShrink: 0 };
    const enter = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = color; (e.currentTarget as HTMLElement).style.color = "white"; };
    const leave = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = `${color}18`; (e.currentTarget as HTMLElement).style.color = color; };
    if (href) return <Link href={href} title={title} style={base} onMouseEnter={enter} onMouseLeave={leave}>{children}</Link>;
    return <button title={title} style={base} onMouseEnter={enter} onMouseLeave={leave} onClick={onClick}>{children}</button>;
}
