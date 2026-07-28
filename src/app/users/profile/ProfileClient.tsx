"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/ToastNotifications";
import { formatDate } from "@/lib/utils";

export default function ProfileClient({ user, profile, totalBorrowed, validUntil }: any) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [form, setForm] = useState({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phoneNumber: user.phoneNumber ?? "",
        address: user.address ?? ""
    });
    const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [avatarUrl, setAvatarUrl] = useState(profile?.profilePicture ?? null);
    const [showOldPw, setShowOldPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const roleLabels: Record<string, string> = { admin: "Administrator", librarian: "Librarian", student: "Student" };
    const roleDisplay = roleLabels[user.role] || user.role;

    async function saveProfile(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) { showToast("Profile updated successfully!", "success"); setEditing(false); router.refresh(); }
            else showToast(data.error || "Failed to update profile.", "error");
        } catch { showToast("Network error. Please try again.", "error"); }
        finally { setSaving(false); }
    }

    async function changePassword(e: React.FormEvent) {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) { showToast("Passwords do not match.", "error"); return; }
        setSaving(true);
        try {
            const res = await fetch("/api/users/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
            });
            const data = await res.json();
            if (res.ok) { showToast("Password updated successfully!", "success"); setChangingPw(false); setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" }); }
            else showToast(data.error || "Failed to update password.", "error");
        } catch { showToast("Network error. Please try again.", "error"); }
        finally { setSaving(false); }
    }

    async function uploadAvatar(file: File) {
        const fd = new FormData();
        fd.append("profile_picture", file);
        try {
            const res = await fetch("/api/users/avatar", { method: "POST", body: fd });
            const data = await res.json();
            if (res.ok) { setAvatarUrl(data.avatar_url); showToast("Profile picture updated!", "success"); router.refresh(); }
            else showToast(data.error || "Failed to upload photo.", "error");
        } catch { showToast("Network error. Please try again.", "error"); }
    }

    function printIdCard() {
        const printArea = document.getElementById("id-card-print-area");
        if (!printArea) { window.print(); return; }
        const win = window.open("", "_blank", "width=520,height=420");
        if (!win) { window.print(); return; }
        win.document.write(`<!DOCTYPE html><html><head><title>Library ID Card - SmartLibrary</title><style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'Inter',sans-serif; background:#f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
            .id-card-front { background:linear-gradient(135deg,#10b981,#0ea5e9); border-radius:16px; padding:24px; color:white; width:380px; box-shadow:0 20px 60px rgba(0,0,0,0.25); }
            .id-card-header { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
            .id-card-logo svg { width:32px; height:32px; stroke:white; fill:none; stroke-width:2; }
            .id-card-org { font-size:1.125rem; font-weight:700; display:block; }
            .id-card-type { font-size:0.75rem; opacity:0.85; display:block; }
            .id-card-body { display:flex; gap:16px; margin-bottom:20px; }
            .id-card-photo { width:80px; height:100px; background:rgba(255,255,255,0.2); border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
            .id-card-photo img { width:100%; height:100%; object-fit:cover; }
            .id-photo-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
            .id-photo-placeholder svg { width:32px; height:32px; stroke:rgba(255,255,255,0.7); fill:none; stroke-width:2; }
            .id-card-details { flex:1; display:flex; flex-direction:column; gap:10px; justify-content:center; }
            .id-label { font-size:0.625rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.07em; display:block; margin-bottom:1px; }
            .id-value { font-size:0.9rem; font-weight:700; display:block; }
            .id-card-footer { display:flex; justify-content:space-between; align-items:flex-end; padding-top:16px; border-top:1px solid rgba(255,255,255,0.25); }
            .barcode-lines { display:flex; gap:2px; height:32px; }
            .barcode-lines span { width:2px; background:rgba(255,255,255,0.9); border-radius:1px; }
            .barcode-lines span:nth-child(odd) { height:100%; }
            .barcode-lines span:nth-child(even) { height:75%; }
            .barcode-lines span:nth-child(3n) { width:3px; }
            .barcode-number { font-size:0.625rem; font-family:monospace; letter-spacing:0.12em; margin-top:5px; opacity:0.85; }
            .qr-code { width:52px; height:52px; background:white; border-radius:5px; padding:4px; }
            .qr-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:2px; width:100%; height:100%; }
            .qr-grid span { background:#0f172a; border-radius:1px; }
            .qr-grid span:nth-child(2n) { background:transparent; }
            .qr-grid span:nth-child(3n) { background:#0f172a; }
            @media print { body { min-height:auto; background:white; padding:5mm; } }
        </style></head><body>${printArea.innerHTML}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 600);
    }

    return (
        <div className="profile-page">
            <main className="profile-main">
                <div className="container">
                    {/* ── Profile Header ── */}
                    <div className="profile-header-section">
                        <div className="profile-cover"><div className="profile-cover-gradient"></div></div>
                        <div className="profile-header-content">
                            <div className="profile-avatar-large">
                                {avatarUrl
                                    ? <img src={avatarUrl} alt={user.username} className="profile-avatar-img" />
                                    : <div className="profile-avatar-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                }
                                <label className="avatar-upload-btn" title="Upload profile picture" onClick={() => fileRef.current?.click()}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </label>
                                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                                    onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }} />
                            </div>
                            <div className="profile-header-info">
                                <h1>{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}</h1>
                                <div className={`profile-role-badge ${user.role}`}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    <span>{roleDisplay}</span>
                                </div>
                                <p className="profile-member-since">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    Member since <span>{formatDate(user.dateJoined)}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Profile Grid ── */}
                    <div className="profile-grid">
                        {/* Personal Information */}
                        <div className="profile-card personal-info">
                            <div className="profile-card-header">
                                <h2>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Personal Information
                                </h2>
                                <button className="edit-btn" onClick={() => setEditing(!editing)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    {editing ? "Cancel" : "Edit"}
                                </button>
                            </div>
                            <div className="profile-card-content">
                                {!editing ? (
                                    <div className="info-grid">
                                        <div className="info-item"><span className="info-label">Full Name</span><span className="info-value">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Not provided"}</span></div>
                                        <div className="info-item"><span className="info-label">Email Address</span><span className="info-value">{user.email}</span></div>
                                        <div className="info-item"><span className="info-label">Phone Number</span><span className="info-value">{user.phoneNumber || "Not provided"}</span></div>
                                        <div className="info-item"><span className="info-label">Username</span><span className="info-value">{user.username}</span></div>
                                        <div className="info-item"><span className="info-label">Address</span><span className="info-value">{user.address || "Not provided"}</span></div>
                                        <div className="info-item"><span className="info-label">Role</span><span className="info-value">{roleDisplay}</span></div>
                                        <div className="info-item"><span className="info-label">Member Since</span><span className="info-value">{formatDate(user.dateJoined)}</span></div>
                                        <div className="info-item"><span className="info-label">Account Status</span><span className="status-badge active"><span className="status-dot"></span>Active</span></div>
                                    </div>
                                ) : (
                                    <form className="info-edit" onSubmit={saveProfile}>
                                        <div className="form-grid">
                                            <div className="form-group"><label>First Name</label><input type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required /></div>
                                            <div className="form-group"><label>Last Name</label><input type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required /></div>
                                            <div className="form-group"><label>Email Address</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                                            <div className="form-group"><label>Phone Number</label><input type="tel" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} /></div>
                                            <div className="form-group full-width"><label>Address</label><textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
                                        </div>
                                        <div className="form-actions">
                                            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Library ID Card */}
                        <div className="profile-card library-card-section">
                            <div className="profile-card-header">
                                <h2>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                                    </svg>
                                    Library ID Card
                                </h2>
                                <button className="btn btn-sm btn-secondary" onClick={printIdCard}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 6 2 18 2 18 9" />
                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                        <rect x="6" y="14" width="12" height="8" />
                                    </svg>
                                    Print ID Card
                                </button>
                            </div>
                            <div className="profile-card-content">
                                <div className="id-card">
                                    {/* id-card-print-area is the element extracted for print */}
                                    <div id="id-card-print-area">
                                        <div className="id-card-front">
                                            <div className="id-card-header">
                                                <div className="id-card-logo">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                    </svg>
                                                </div>
                                                <div className="id-card-title">
                                                    <span className="id-card-org">SmartLibrary</span>
                                                    <span className="id-card-type">Library Membership Card</span>
                                                </div>
                                            </div>
                                            <div className="id-card-body">
                                                <div className="id-card-photo">
                                                    {avatarUrl
                                                        ? <img src={avatarUrl} alt={user.username} className="id-photo-img" />
                                                        : <div className="id-photo-placeholder">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                                            </svg>
                                                        </div>
                                                    }
                                                </div>
                                                <div className="id-card-details">
                                                    <div className="id-detail"><span className="id-label">Name</span><span className="id-value">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}</span></div>
                                                    <div className="id-detail"><span className="id-label">ID Number</span><span className="id-value">LIB-{String(user.id).padStart(4, "0")}</span></div>
                                                    <div className="id-detail"><span className="id-label">Role</span><span className="id-value">{roleDisplay}</span></div>
                                                    <div className="id-detail"><span className="id-label">Valid Until</span><span className="id-value">{formatDate(validUntil)}</span></div>
                                                </div>
                                            </div>
                                            <div className="id-card-footer">
                                                <div className="id-barcode">
                                                    <div className="barcode-lines">
                                                        {Array.from({ length: 30 }).map((_, i) => <span key={i} />)}
                                                    </div>
                                                    <span className="barcode-number">LIB{String(user.id).padStart(4, "0")}</span>
                                                </div>
                                                <div className="id-qr">
                                                    <div className="qr-code">
                                                        <div className="qr-grid">
                                                            {Array.from({ length: 25 }).map((_, i) => <span key={i} />)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="id-card-info">
                                        <p>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                            </svg>
                                            Present this card at the library desk for borrowing services. Keep your card secure and report if lost.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Security */}
                        <div className="profile-card account-security">
                            <div className="profile-card-header">
                                <h2>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    Account Security
                                </h2>
                            </div>
                            <div className="profile-card-content">
                                <div className="security-section">
                                    <div className="security-item">
                                        <div className="security-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </div>
                                        <div className="security-info">
                                            <h4>Password</h4>
                                            <p>Keep your account secure by using a strong password.</p>
                                        </div>
                                        <button className="btn btn-sm btn-secondary" onClick={() => setChangingPw(!changingPw)}>
                                            {changingPw ? "Cancel" : "Change"}
                                        </button>
                                    </div>
                                </div>

                                {changingPw && (
                                    <form className="password-form" onSubmit={changePassword}>
                                        <h3>Change Password</h3>
                                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                                            Enter your current password and choose a new one. If you forgot it, <Link href="/users/login" style={{ color: "var(--primary)", textDecoration: "underline" }}>logout</Link> and use "Forgot Password".
                                        </p>
                                        <div className="form-grid">
                                            {[
                                                { id: "currentPassword", label: "Current Password", val: pwForm.oldPassword, show: showOldPw, setShow: setShowOldPw, set: (v: string) => setPwForm(f => ({ ...f, oldPassword: v })) },
                                                { id: "newPassword", label: "New Password", val: pwForm.newPassword, show: showNewPw, setShow: setShowNewPw, set: (v: string) => setPwForm(f => ({ ...f, newPassword: v })) },
                                                { id: "confirmPassword", label: "Confirm New Password", val: pwForm.confirmPassword, show: showConfirmPw, setShow: setShowConfirmPw, set: (v: string) => setPwForm(f => ({ ...f, confirmPassword: v })) },
                                            ].map(({ id, label, val, show, setShow, set }) => (
                                                <div key={id} className="form-group full-width">
                                                    <label htmlFor={id}>{label}</label>
                                                    <div className="password-input-wrapper">
                                                        <input type={show ? "text" : "password"} id={id} required value={val} onChange={e => set(e.target.value)} />
                                                        <button type="button" className="password-toggle" onClick={() => setShow(!show)}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                {show
                                                                    ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                                                                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                                                                }
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="form-actions">
                                            <button type="button" className="btn btn-secondary" onClick={() => setChangingPw(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Updating…" : "Update Password"}</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="profile-footer">
                <div className="container">
                    <p>&copy; 2026 SmartLibrary. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
