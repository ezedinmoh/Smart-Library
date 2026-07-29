"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import type { SessionUser } from "@/types";

interface Props {
    pendingCount?: number;
    notifCount?: number;
    notifications?: Array<{ key: string; title: string; message: string; level: string; icon: string; fine?: number | null; isRead: boolean; type: string; url?: string }>;
    unpaidFinesCount?: number;
}

export default function Navbar({ pendingCount = 0, notifCount = 0, notifications = [], unpaidFinesCount = 0 }: Props) {
    const { data: session } = useSession();
    const user = session?.user as SessionUser | undefined;
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [adminDropOpen, setAdminDropOpen] = useState(false);
    const [sysDropOpen, setSysDropOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    // Mobile accordion states
    const [mobileAdminOpen, setMobileAdminOpen] = useState(false);
    const [mobileSysOpen, setMobileSysOpen] = useState(false);
    const [mobileLibOpen, setMobileLibOpen] = useState(false);

    const isHomePage = pathname === "/";
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem("theme") as "light" | "dark" | null;
        if (saved) {
            setTheme(saved);
            document.documentElement.setAttribute("data-theme", saved);
        }
    }, []);

    // Close sidebar and all dropdowns on route change
    useEffect(() => { 
        setSidebarOpen(false); 
        setProfileOpen(false); 
        setNotifOpen(false);
        setAdminDropOpen(false); 
        setSysDropOpen(false);
    }, [pathname]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (!navRef.current?.contains(e.target as Node)) {
                setProfileOpen(false); 
                setNotifOpen(false);
                setAdminDropOpen(false); 
                setSysDropOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Lock body scroll when sidebar open
    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [sidebarOpen]);

    function toggleTheme() {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        localStorage.setItem("theme", next);
        document.documentElement.setAttribute("data-theme", next);
    }

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    const SunIcon = () => (
        <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    );
    const MoonIcon = () => (
        <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );

    const fullName = user ? (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.username) : "";

    return (
        <>
            <nav className="navbar" id="navbar" ref={navRef}>
                <div className="nav-container">
                    {/* Logo */}
                    <Link href="/" className="logo">
                        <div className="logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                        <span>SmartLibrary</span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="nav-links" id="navLinks">
                        {!user && isHomePage ? (
                            <>
                                <a href="#home" className="nav-link">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: "inline-block", marginRight: 5, verticalAlign: "text-bottom" }}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                    Home
                                </a>
                                <a href="#features" className="nav-link">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: "inline-block", marginRight: 5, verticalAlign: "text-bottom" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    Features
                                </a>
                                <a href="#categories" className="nav-link">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: "inline-block", marginRight: 5, verticalAlign: "text-bottom" }}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                    Categories
                                </a>
                                <a href="#books" className="nav-link">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: "inline-block", marginRight: 5, verticalAlign: "text-bottom" }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                                    Books
                                </a>
                                <a href="#request" className="nav-link">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: "inline-block", marginRight: 5, verticalAlign: "text-bottom" }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                    Request Book
                                </a>
                            </>
                        ) : (
                            <>
                                <Link href="/books" className={`nav-link${isActive("/books") ? " active" : ""}`}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                    Books
                                </Link>
                                {user?.role === "student" && (
                                    <>
                                        <Link href="/borrow/my-books" className={`nav-link${isActive("/borrow/my-books") ? " active" : ""}`}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                            My Books
                                        </Link>
                                        <Link href="/borrow/request-list" className={`nav-link${isActive("/borrow/request-list") ? " active" : ""}`}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
                                            My Requests
                                        </Link>
                                        {unpaidFinesCount > 0 && (
                                            <Link href="/borrow/unpaid-fines" className={`nav-link unpaid-fines-link${isActive("/borrow/unpaid-fines") ? " active" : ""}`} style={{ color: "#ef4444", fontWeight: 600 }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                                                Unpaid Fines ({unpaidFinesCount})
                                            </Link>
                                        )}
                                    </>
                                )}
                                {(user?.role === "admin" || user?.role === "librarian") && (
                                    <>
                                        {/* Administration dropdown */}
                                        <div className={`nav-dropdown${adminDropOpen ? " active" : ""}`} onMouseEnter={() => setAdminDropOpen(true)} onMouseLeave={() => setAdminDropOpen(false)}>
                                            <button className="nav-link dropdown-trigger" onClick={(e) => { e.preventDefault(); setAdminDropOpen(!adminDropOpen); setSysDropOpen(false); setProfileOpen(false); setNotifOpen(false); }} style={{ fontWeight: 500 }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                                {user.role === "admin" ? "Administration" : "Library Operations"}
                                                <svg className="chevron-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                                            </button>
                                            <DesktopAdminMenu user={user} pendingCount={pendingCount} close={() => setAdminDropOpen(false)} />
                                        </div>
                                        {user.role === "admin" && (
                                            <div className={`nav-dropdown${sysDropOpen ? " active" : ""}`} onMouseEnter={() => setSysDropOpen(true)} onMouseLeave={() => setSysDropOpen(false)}>
                                                <button className="nav-link dropdown-trigger" onClick={(e) => { e.preventDefault(); setSysDropOpen(!sysDropOpen); setAdminDropOpen(false); setProfileOpen(false); setNotifOpen(false); }} style={{ fontWeight: 500 }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" /></svg>
                                                    System Actions
                                                    <svg className="chevron-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                                                </button>
                                                <DesktopSystemMenu close={() => setSysDropOpen(false)} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Nav Actions (desktop) */}
                    <div className="nav-actions">
                        {user ? (
                            <>
                                {(user.role === "admin" || user.role === "librarian") && (
                                    <Link href="/dashboard/notification-center" className="nav-notif-center" title="Notification Center"
                                        style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #0ea5e9)", border: "none", cursor: "pointer", textDecoration: "none", flexShrink: 0, marginRight: "0.25rem" }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 18, height: 18 }}>
                                            <line x1="22" y1="2" x2="11" y2="13" />
                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                        </svg>
                                    </Link>
                                )}

                                {/* Notification Bell — hover toggles popup, click redirects */}
                                <div className={`notification-wrapper${notifOpen ? " active" : ""}`} style={{ position: "relative" }} onMouseEnter={() => setNotifOpen(true)} onMouseLeave={() => setNotifOpen(false)}>
                                    <Link href="/users/notifications" className="icon-btn notification-btn" id="notificationBtn" onClick={() => { setNotifOpen(false); setProfileOpen(false); setAdminDropOpen(false); setSysDropOpen(false); }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                        {notifCount > 0 && <span className="notification-badge">{notifCount}</span>}
                                    </Link>

                                    {/* Notification Popup Menu */}
                                    <div>
                                        <NotifPopup notifications={notifications} close={() => setNotifOpen(false)} />
                                    </div>
                                </div>

                                <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme"><SunIcon /><MoonIcon /></button>

                                {/* Profile Dropdown */}
                                <div className={`profile-dropdown${profileOpen ? " active" : ""}`} id="profileDropdown" onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)}>
                                    <button className="profile-btn" id="profileBtn" onClick={(e) => { e.preventDefault(); setProfileOpen(!profileOpen); setNotifOpen(false); setAdminDropOpen(false); setSysDropOpen(false); }}>
                                        <div className="avatar">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                        <span className="profile-name">{fullName}</span>
                                        <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </button>

                                    {/* Profile Menu Popup */}
                                    <ProfileMenu user={user} close={() => setProfileOpen(false)} />
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/users/login" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                                    Login
                                </Link>
                                <Link href="/users/register" className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
                                    Sign Up
                                </Link>
                                <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme"><SunIcon /><MoonIcon /></button>
                            </>
                        )}

                        {/* Mobile menu trigger */}
                        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar */}
            <div className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
            <div className={`mobile-sidebar${sidebarOpen ? " open" : ""}`} id="mobileSidebar">
                <div className="sidebar-header">
                    <Link href="/" className="sidebar-logo" onClick={() => setSidebarOpen(false)}>
                        <div className="logo-icon" style={{ width: 34, height: 34 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 18, height: 18 }}>
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>SmartLibrary</span>
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="sidebar-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                            <SunIcon /><MoonIcon />
                        </button>
                        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 20, height: 20 }}>
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {user && (
                    <div className="sidebar-user">
                        <div className="avatar" style={{ width: 44, height: 44 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "0.938rem" }}>{fullName}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{user.role}</div>
                        </div>
                    </div>
                )}

                <nav className="sidebar-nav">
                    {!user && isHomePage && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Navigation</div>
                            {[["#home", "Home"], ["#features", "Features"], ["#categories", "Categories"], ["#books", "Books"], ["#request", "Request Book"]].map(([href, label]) => (
                                <a key={href} href={href} className="sidebar-link" onClick={() => setSidebarOpen(false)}>{label}</a>
                            ))}
                        </div>
                    )}

                    {!user && !isHomePage && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Navigation</div>
                            <SidebarLink href="/books" label="Books" onClick={() => setSidebarOpen(false)} />
                        </div>
                    )}

                    {user?.role === "student" && (
                        <>
                            <div className="sidebar-section">
                                <div className="sidebar-section-title">Library</div>
                                <SidebarLink href="/books" label="Browse Books" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/borrow/my-books" label="My Books" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/borrow/request-list" label="My Requests" onClick={() => setSidebarOpen(false)} />
                                {unpaidFinesCount > 0 && (
                                    <SidebarLink href="/borrow/unpaid-fines" label={`Unpaid Fines (${unpaidFinesCount})`} onClick={() => setSidebarOpen(false)} />
                                )}
                                <SidebarLink href="/borrow/history" label="Borrow History" onClick={() => setSidebarOpen(false)} />
                            </div>
                            <div className="sidebar-section">
                                <div className="sidebar-section-title">Account</div>
                                <SidebarLink href="/dashboard/student" label="My Dashboard" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/users/profile" label="My Profile" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/users/notifications" label={notifCount > 0 ? `Notifications (${notifCount})` : "Notifications"} onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/dashboard/calendar" label="Due Dates Calendar" onClick={() => setSidebarOpen(false)} />
                            </div>
                        </>
                    )}

                    {user?.role === "admin" && (
                        <>
                            <div className="sidebar-section">
                                <div className="sidebar-section-title">Book Management</div>
                                <SidebarLink href="/books" label="Browse Books" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/books/create" label="Add Book" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/books/categories" label="Categories" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/books/manage" label="Manage Books" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/books/manage-stock" label="Manage Stock" onClick={() => setSidebarOpen(false)} />
                            </div>
                            <div className="sidebar-section">
                                <button className="sidebar-accordion-btn" onClick={() => setMobileAdminOpen(!mobileAdminOpen)}>
                                    <span className="sidebar-section-title" style={{ margin: 0 }}>Administration</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`sidebar-chevron${mobileAdminOpen ? " open" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                                </button>
                                {mobileAdminOpen && (
                                    <>
                                        <SidebarLink href="/users/list" label="Manage Users" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/users/create" label="Create User" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/borrow/pending-requests" label={pendingCount > 0 ? `Pending Requests (${pendingCount})` : "Pending Requests"} onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/borrow/all-records" label="All Borrows" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/borrow/overdue" label="Overdue Books" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/admin" label="Admin Dashboard" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/reports" label="Reports" onClick={() => setSidebarOpen(false)} nested />
                                    </>
                                )}
                            </div>
                            <div className="sidebar-section">
                                <button className="sidebar-accordion-btn" onClick={() => setMobileSysOpen(!mobileSysOpen)}>
                                    <span className="sidebar-section-title" style={{ margin: 0 }}>System Actions</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`sidebar-chevron${mobileSysOpen ? " open" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                                </button>
                                {mobileSysOpen && (
                                    <>
                                        <SidebarLink href="/dashboard/settings" label="System Settings" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/system" label="System Administration" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/activity-log" label="Activity Log" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/analytics" label="Analytics" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/reservations" label="Reservations" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/books/bulk-import" label="Bulk Import Books" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/users/bulk-import" label="Bulk Import Users" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/users/bulk-email" label="Bulk Email Users" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/backup/create" label="Create Backup" onClick={() => setSidebarOpen(false)} nested />
                                    </>
                                )}
                            </div>
                            <div className="sidebar-section">
                                <div className="sidebar-section-title">Account</div>
                                <SidebarLink href="/users/profile" label="My Profile" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/users/notifications" label={notifCount > 0 ? `Notifications (${notifCount})` : "Notifications"} onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/dashboard/notification-center" label="Notification Center" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/dashboard/calendar" label="Due Dates Calendar" onClick={() => setSidebarOpen(false)} />
                            </div>
                        </>
                    )}

                    {user?.role === "librarian" && (
                        <>
                            <div className="sidebar-section">
                                <button className="sidebar-accordion-btn" onClick={() => setMobileLibOpen(!mobileLibOpen)}>
                                    <span className="sidebar-section-title" style={{ margin: 0 }}>Library Operations</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`sidebar-chevron${mobileLibOpen ? " open" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                                </button>
                                {mobileLibOpen && (
                                    <>
                                        <SidebarLink href="/books" label="Books" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/books/create" label="Add Book" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/books/categories" label="Manage Categories" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/borrow/pending-requests" label={pendingCount > 0 ? `Pending Requests (${pendingCount})` : "Pending Requests"} onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/borrow/all-records" label="All Borrows" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/borrow/issue-return" label="Issue/Return Books" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/books/manage-stock" label="Manage Stock" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/calendar" label="Due Dates Calendar" onClick={() => setSidebarOpen(false)} nested />
                                        <SidebarLink href="/dashboard/librarian" label="Dashboard" onClick={() => setSidebarOpen(false)} nested />
                                    </>
                                )}
                            </div>
                            <div className="sidebar-section">
                                <div className="sidebar-section-title">Account</div>
                                <SidebarLink href="/users/profile" label="My Profile" onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/users/notifications" label={notifCount > 0 ? `Notifications (${notifCount})` : "Notifications"} onClick={() => setSidebarOpen(false)} />
                                <SidebarLink href="/dashboard/notification-center" label="Notification Center" onClick={() => setSidebarOpen(false)} />
                            </div>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    {user ? (
                        <button className="sidebar-logout-btn" onClick={() => { setSidebarOpen(false); signOut({ callbackUrl: "/" }); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Logout
                        </button>
                    ) : (
                        <div style={{ display: "flex", gap: 10 }}>
                            <Link href="/users/login" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setSidebarOpen(false)}>Login</Link>
                            <Link href="/users/register" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setSidebarOpen(false)}>Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function SidebarLink({ href, label, onClick, nested }: { href: string; label: string; onClick: () => void; nested?: boolean }) {
    return (
        <Link href={href} className={`sidebar-link${nested ? " nested" : ""}`} onClick={onClick}>
            {label}
        </Link>
    );
}

function DesktopAdminMenu({ user, pendingCount, close }: { user: SessionUser; pendingCount: number; close: () => void }) {
    if (user.role === "librarian") return (
        <div className="dropdown-content desktop-dropdown">
            <DropItem href="/books/create" close={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Add Book
            </DropItem>
            <DropItem href="/books/categories" close={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                Manage Categories
            </DropItem>
            <div className="dropdown-divider" />
            <DropItem href="/borrow/pending-requests" close={close} badge={pendingCount}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Pending Requests
            </DropItem>
            <DropItem href="/borrow/all-records" close={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
                All Borrows
            </DropItem>
            <DropItem href="/borrow/issue-return" close={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4" /><path d="M4 20v-7a4 4 0 0 1 4-4h12" /></svg>
                Issue / Return Books
            </DropItem>
            <DropItem href="/books/manage-stock" close={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                Manage Stock
            </DropItem>
            <DropItem href="/dashboard/calendar" close={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Due Dates Calendar
            </DropItem>
            <DropItem href="/dashboard/librarian" close={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                Dashboard
            </DropItem>
        </div>
    );
    return (
        <div className="dropdown-content desktop-dropdown">
            <div className="dropdown-section"><div className="dropdown-section-title">Book Management</div>
                <DropItem href="/books/create" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> Add Book
                </DropItem>
                <DropItem href="/books/categories" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg> Manage Categories
                </DropItem>
                <DropItem href="/books/manage" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> Manage Books
                </DropItem>
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-section"><div className="dropdown-section-title">User Management</div>
                <DropItem href="/users/list" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> Manage Users
                </DropItem>
                <DropItem href="/users/create" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg> Create User
                </DropItem>
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-section"><div className="dropdown-section-title">Borrow Management</div>
                <DropItem href="/borrow/pending-requests" close={close} badge={pendingCount}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> Pending Requests
                </DropItem>
                <DropItem href="/borrow/all-records" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg> All Borrows
                </DropItem>
                <DropItem href="/borrow/overdue" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> Overdue Books
                </DropItem>
                <DropItem href="/books/manage-stock" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg> Manage Stock
                </DropItem>
                <DropItem href="/dashboard/admin" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> Admin Dashboard
                </DropItem>
                <DropItem href="/dashboard/reports" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> Reports
                </DropItem>
            </div>
        </div>
    );
}

function DesktopSystemMenu({ close }: { close: () => void }) {
    return (
        <div className="dropdown-content desktop-dropdown">
            <div className="dropdown-section"><div className="dropdown-section-title">System</div>
                <DropItem href="/dashboard/settings" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg> System Settings
                </DropItem>
                <DropItem href="/dashboard/system" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> System Administration
                </DropItem>
                <DropItem href="/dashboard/activity-log" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> Activity Log
                </DropItem>
                <DropItem href="/dashboard/reservations" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> Manage Reservations
                </DropItem>
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-section"><div className="dropdown-section-title">Analytics</div>
                <DropItem href="/dashboard/analytics" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg> Analytics
                </DropItem>
                <DropItem href="/dashboard/reports" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> Reports
                </DropItem>
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-section"><div className="dropdown-section-title">Bulk Operations</div>
                <DropItem href="/books/bulk-import" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Bulk Import Books
                </DropItem>
                <DropItem href="/users/bulk-import" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Bulk Import Users
                </DropItem>
                <DropItem href="/users/bulk-email" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> Bulk Email Users
                </DropItem>
                <DropItem href="/dashboard/backup/create" close={close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg> Create Backup
                </DropItem>
            </div>
        </div>
    );
}

/* ─── Profile Menu matching Python Django html & icons ─── */
function ProfileMenu({ user, close }: { user: SessionUser; close: () => void }) {
    return (
        <div className="profile-menu" id="profileMenu">
            <Link href="/users/profile" className="dropdown-item" onClick={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
                My Profile
            </Link>
            <Link href="/dashboard/calendar" className="dropdown-item" onClick={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Due Dates Calendar
            </Link>

            {user.role === "admin" && (
                <>
                    <Link href="/dashboard/admin" className="dropdown-item" onClick={close}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Admin Dashboard
                    </Link>
                    <Link href="/dashboard/notification-center" className="dropdown-item" onClick={close}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Notification Center
                    </Link>
                </>
            )}

            {user.role === "librarian" && (
                <>
                    <Link href="/dashboard/librarian" className="dropdown-item" onClick={close}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Librarian Dashboard
                    </Link>
                    <Link href="/dashboard/notification-center" className="dropdown-item" onClick={close}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Notification Center
                    </Link>
                </>
            )}

            {user.role === "student" && (
                <>
                    <Link href="/dashboard/student" className="dropdown-item" onClick={close}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        My Dashboard
                    </Link>
                    <Link href="/borrow/history" className="dropdown-item" onClick={close}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Borrow History
                    </Link>
                </>
            )}

            <div className="dropdown-divider" />
            <button
                className="dropdown-item logout"
                style={{ border: "none", background: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
                onClick={() => { close(); signOut({ callbackUrl: "/" }); }}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
            </button>
        </div>
    );
}

/* ─── Notification Popup matching Python Django html & icons ─── */
function NotifPopup({ notifications, close }: { notifications: Props["notifications"]; close: () => void }) {
    const unread = notifications?.filter(n => !n.isRead) ?? [];

    async function markOneRead(key: string, type: string) {
        await fetch("/api/users/notifications/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, type })
        });
        // Redirect to notifications page after marking read
        window.location.href = "/users/notifications";
    }

    return (
        <div className="notification-popup">
            <div className="notification-popup-header" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontSize: "0.938rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: "var(--primary)" }}>
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    Notifications
                </h4>
                <span className="notification-count-badge" style={{ background: "var(--error)", color: "white", fontSize: "0.75rem", fontWeight: 700, borderRadius: 9999, padding: "2px 8px" }}>
                    {unread.length} new
                </span>
            </div>

            <div className="notification-popup-body" style={{ maxHeight: 320, overflowY: "auto" }}>
                {unread.length === 0 ? (
                    <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        No new notifications
                    </div>
                ) : (
                    unread.map(n => (
                        <div key={n.key} className="notification-popup-item" style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-light)", fontSize: "0.875rem" }}>
                            <strong style={{ display: "block", marginBottom: 2 }}>{n.title}</strong>
                            <p style={{ color: "var(--text-secondary)", margin: "0 0 6px 0", fontSize: "0.813rem", lineHeight: 1.4 }}>
                                {n.message.split(" ").slice(0, 15).join(" ")}{n.message.split(" ").length > 15 ? "…" : ""}
                            </p>
                            {n.fine != null && <span style={{ fontSize: "0.75rem", color: "var(--error)", fontWeight: 600, display: "block", marginBottom: 6 }}>Fine: ETB {n.fine}</span>}
                            <div style={{ display: "flex", gap: 6 }}>
                                <button
                                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: "rgba(16,185,129,0.1)", color: "var(--primary)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                                    onClick={() => markOneRead(n.key, n.type)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>
                                    Read
                                </button>
                                <Link href="/users/notifications" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }} onClick={close}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    View
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="notification-popup-footer" style={{ padding: "12px 18px", display: "flex", gap: 8, borderTop: "1px solid var(--border)" }}>
                <Link href="/users/notifications?mark_read=all" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={close}>
                    Mark All Read
                </Link>
                <Link href="/users/notifications" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={close}>
                    View All
                </Link>
            </div>
        </div>
    );
}

function DropItem({ href, children, badge, close }: { href: string; children: React.ReactNode; badge?: number; close: () => void }) {
    return (
        <Link href={href} className="dropdown-item" onClick={close}>
            {children}
            {badge != null && badge > 0 && <span style={{ marginLeft: "auto", background: "var(--error)", color: "white", fontSize: "0.7rem", fontWeight: 700, borderRadius: 9999, padding: "2px 7px" }}>{badge}</span>}
        </Link>
    );
}
