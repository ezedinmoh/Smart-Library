"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/types";

export default function SharedFooter() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const pathname = usePathname();

  // If on login/register auth pages, don't display main footer
  if (pathname.startsWith("/users/login") || pathname.startsWith("/users/register") || pathname.startsWith("/users/password-reset")) {
    return null;
  }

  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          
          {/* Brand section */}
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 20, height: 20 }}>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <span style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700 }}>SmartLibrary</span>
            </div>
            <p>
              Your intelligent, modern digital library platform for seamlessly discovering, borrowing, and reading books.
            </p>
          </div>

          {/* Dynamic Section 1: Navigation Links based on role */}
          <div className="footer-links">
            <h4>Navigation</h4>
            <Link href="/books">Book Catalog</Link>
            
            {user?.role === "student" && (
              <>
                <Link href="/borrow/my-books">My Borrowed Books</Link>
                <Link href="/borrow/request-list">My Book Requests</Link>
                <Link href="/borrow/history">Borrowing History</Link>
              </>
            )}

            {(user?.role === "admin" || user?.role === "librarian") && (
              <>
                <Link href="/borrow/pending-requests">Pending Borrow Requests</Link>
                <Link href="/borrow/all-records">All Borrow Records</Link>
                <Link href="/books/create">Add New Book</Link>
              </>
            )}

            {!user && (
              <>
                <Link href="/users/login">Sign In</Link>
                <Link href="/users/register">Create Account</Link>
              </>
            )}
          </div>

          {/* Dynamic Section 2: Dashboards & Operations */}
          <div className="footer-links">
            <h4>
              {user ? "Account & Portal" : "Library Features"}
            </h4>
            
            {user ? (
              <>
                <Link href="/users/profile">My Profile</Link>
                <Link href="/dashboard/calendar">Due Dates Calendar</Link>
                <Link href="/users/notifications">Notifications</Link>
                {user.role === "admin" && <Link href="/dashboard/admin">Admin Dashboard</Link>}
                {user.role === "librarian" && <Link href="/dashboard/librarian">Librarian Dashboard</Link>}
                {user.role === "student" && <Link href="/dashboard/student">Student Dashboard</Link>}
              </>
            ) : (
              <>
                <Link href="/#features">Digital Catalog</Link>
                <Link href="/#categories">Explore Categories</Link>
                <Link href="/#request">Request a Book</Link>
              </>
            )}
          </div>

          {/* Section 3: Contact & System Info */}
          <div className="footer-contact">
            <h4>SmartLibrary Support</h4>
            <p>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              support@smartlibrary.com
            </p>
            <p>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              24/7 Digital Access
            </p>
          </div>

        </div>

        {/* Footer bottom bar */}
        <div className="footer-bottom">
          <p>&copy; {year} SmartLibrary. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
