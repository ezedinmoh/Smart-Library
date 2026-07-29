import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import type { SessionUser } from "@/types";
import Link from "next/link";
import type { Metadata } from "next";
import { serializePrisma } from "@/lib/utils";
import BookGridClient from "./BookGridClient";

export const metadata: Metadata = {
  title: "Home - Smart Library",
  description: "SmartLibrary — your modern digital library. Discover, borrow, and track thousands of books.",
};

export default async function HomePage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  // Authenticated users → role dashboard
  if (user) {
    if (user.role === "admin") redirect("/dashboard/admin");
    if (user.role === "librarian") redirect("/dashboard/librarian");
    redirect("/dashboard/student");
  }

  // Stats for landing page
  const [totalBooks, totalUsers, categoriesRaw, featuredBooks, heroBooks] = await Promise.all([
    prisma.book.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.category.findMany({
      take: 6,
      orderBy: { books: { _count: "desc" } },
      include: { _count: { select: { books: true } } },
    }),
    prisma.book.findMany({
      where: { availableCopies: { gt: 0 } },
      orderBy: [{ timesBorrowed: "desc" }, { rating: "desc" }],
      take: 6,
      include: { category: true },
    }),
    prisma.book.findMany({
      orderBy: [{ timesBorrowed: "desc" }, { rating: "desc" }],
      take: 3,
    }),
  ]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let dailyBorrows = await prisma.borrowRecord.count({
    where: { borrowDate: { gte: today } },
  });
  if (dailyBorrows === 0) {
    const last30 = new Date(today); last30.setDate(last30.getDate() - 30);
    const total30 = await prisma.borrowRecord.count({ where: { borrowDate: { gte: last30 } } });
    dailyBorrows = Math.floor(total30 / 30);
  }

  const categoriesStats = categoriesRaw.map((c) => ({ ...c, book_count: c._count.books }));

  return (
    <AppShell>
      <HomePage_Content
        totalBooks={totalBooks}
        totalUsers={totalUsers}
        dailyBorrows={dailyBorrows}
        categoriesStats={categoriesStats}
        featuredBooks={serializePrisma(featuredBooks)}
        heroBooks={serializePrisma(heroBooks)}
      />
    </AppShell>
  );
}

/* ─── Presentational component ─── */
function HomePage_Content({ totalBooks, totalUsers, dailyBorrows, categoriesStats, featuredBooks, heroBooks }: any) {
  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    "Technology": <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></>,
    "Computer Science": <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></>,
    "Science": <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
    "Literature": <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
    "Fiction": <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
    "History": <><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>,
    "Business": <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    "Economics": <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  };
  const defaultIcon = <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>;
  const gradients = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

  return (
    <>
      {/* ── Hero ───────────────────────────────────── */}
      <section className="hero" id="home">
        <div className="hero-bg">
          <div className="hero-glow glow-1" />
          <div className="hero-glow glow-2" />
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">
              <span className="hero-badge-dot" />
              Welcome to the Future of Libraries
            </span>
            <h1>Discover Your Next <span className="gradient-text">Great Read</span></h1>
            <p>Access thousands of books, manage your reading journey, and connect with a community of passionate readers. Your personal library, reimagined.</p>
            <div className="hero-buttons">
              <Link href="/users/register" className="btn btn-primary btn-lg">
                Get Started Free
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/books" className="btn btn-secondary btn-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                Explore Library
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat"><span className="stat-number">{totalBooks}+</span><span className="stat-label">Books Available</span></div>
              <div className="stat-divider" />
              <div className="stat"><span className="stat-number">{totalUsers}+</span><span className="stat-label">Active Members</span></div>
              <div className="stat-divider" />
              <div className="stat"><span className="stat-number">{dailyBorrows}+</span><span className="stat-label">Daily Borrows</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-books">
              {heroBooks.map((book: any, i: number) => (
                <div key={book.id} className={`hero-book-card book-${i + 1}`}>
                  <div className={`hero-book-cover ${gradients[i]}`}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 16, textAlign: "center" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 44, height: 44, marginBottom: 10, opacity: 0.9 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                      <span style={{ color: "white", fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.4 }}>{book.title.split(" ").slice(0, 4).join(" ")}</span>
                      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.75rem", marginTop: 6 }}>{book.author.split(" ").slice(0, 3).join(" ")}</span>
                    </div>
                  </div>
                  <div className="hero-book-info"><h4>{book.title.split(" ").slice(0, 4).join(" ")}</h4><p>{book.author.split(" ").slice(0, 3).join(" ")}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Scroll Down Indicator */}
        <a href="#features" className="hero-scroll-indicator" aria-label="Scroll down to features">
          <span className="scroll-text">Explore Features</span>
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
          <svg className="scroll-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2>Everything You Need for a <span className="gradient-text">Smart Library</span></h2>
            <p>Powerful tools designed to enhance your reading experience and library management</p>
          </div>
          <div className="features-grid">
            {[
              { icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>, title: "Vast Collection", desc: "Access over 50,000 books across various genres, from classic literature to modern bestsellers." },
              { icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, title: "24/7 Access", desc: "Browse and borrow books anytime, anywhere. Your library never closes." },
              { icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, title: "Secure System", desc: "Role-based access control ensures secure management for admins, librarians, and students." },
              { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, title: "Community", desc: "Connect with fellow readers, share reviews, and discover new favorites." },
              { icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />, title: "Smart Recommendations", desc: "Get personalized book suggestions based on your reading history and preferences." },
              { icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>, title: "Progress Tracking", desc: "Track your reading progress, set goals, and celebrate your achievements." },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className={`feature-icon gradient-bg-${i + 1}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{f.icon}</svg></div>
                <h3>{f.title}</h3><p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────── */}
      <section className="categories" id="categories">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Categories</span>
            <h2>Browse by <span className="gradient-text">Category</span></h2>
            <p>Find your next read from our carefully curated collections</p>
          </div>
          <div className="categories-grid">
            {categoriesStats.map((cat: any) => (
              <Link key={cat.id} href={`/books/categories/${cat.id}`} className="category-card">
                <div className="category-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{CATEGORY_ICONS[cat.name] ?? defaultIcon}</svg></div>
                <h3>{cat.name}</h3>
                <p>{cat.book_count} Book{cat.book_count !== 1 ? "s" : ""}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Books ─────────────────────────── */}
      <section className="books" id="books">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Featured Books</span>
            <h2>Popular <span className="gradient-text">Books</span></h2>
            <p>Discover our most borrowed and highly rated books</p>
          </div>
          <BookGridClient books={featuredBooks} />
          <div className="view-all"><Link href="/books" className="btn btn-primary">View All Books</Link></div>
        </div>
      </section>

      {/* ── My Books / Track Your Reading Journey ─── */}
      <section className="my-books" id="my-books">
        <div className="container">
          <div className="my-books-content">
            <div className="my-books-text">
              <span className="section-badge">My Books</span>
              <h2>Track Your <span className="gradient-text">Reading Journey</span></h2>
              <p>Keep track of all your borrowed books, due dates, and reading history in one beautiful dashboard. Never miss a return date again.</p>
              <ul className="feature-list">
                {[
                  "View all currently borrowed books at a glance",
                  "Get notified before books are due",
                  "Browse your complete borrowing history",
                  "Request new books with one click",
                  "Track your reading goals and progress",
                ].map((item) => (
                  <li key={item}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/users/register" className="btn btn-primary">
                Get Started Free
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {/* Dashboard preview mockup */}
            <div className="dashboard-preview">
              <div className="dashboard-header">
                <div className="dashboard-dots">
                  <span /><span /><span />
                </div>
                <span>My Library Dashboard</span>
              </div>
              <div className="dashboard-content">
                <div className="dashboard-stat">
                  <span className="number">12</span>
                  <span className="label">Books Read</span>
                </div>
                <div className="dashboard-stat">
                  <span className="number">3</span>
                  <span className="label">Borrowed</span>
                </div>
                <div className="dashboard-stat">
                  <span className="number">1</span>
                  <span className="label">Due Soon</span>
                </div>
              </div>
              <div className="dashboard-recent">
                <h4>Recent Activity</h4>
                {[
                  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", badge: "badge-reading", status: "Reading" },
                  { title: "Clean Code", author: "Robert C. Martin", badge: "badge-due", status: "Due in 3d" },
                  { title: "Atomic Habits", author: "James Clear", badge: "badge-done", status: "Returned" },
                ].map((b, i) => (
                  <div key={i} className="recent-book-item">
                    <div className={`recent-book-cover ${gradients[i]}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    </div>
                    <div className="recent-book-info">
                      <h5>{b.title}</h5>
                      <p>{b.author}</p>
                    </div>
                    <span className={`recent-book-badge ${b.badge}`}>{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Request Book ──────────────────────────── */}
      <section className="request-book" id="request">
        <div className="container">
          <div className="request-content">
            <div className="request-form-preview">
              <h4>Request a Book</h4>
              <div className="form-preview-field"><span className="field-label">Book Title</span><span className="field-value">Search for a book...</span></div>
              <div className="form-preview-field"><span className="field-label">Your Name</span><span className="field-value">Your full name</span></div>
              <div className="form-preview-btn">Submit Request</div>
            </div>
            <div className="request-text">
              <span className="section-badge">Book Requests</span>
              <h2>Request Any <span className="gradient-text">Book</span> You Need</h2>
              <p>Can&apos;t find what you&apos;re looking for? Submit a book request and our librarians will get it for you.</p>
              <div className="request-steps">
                {[["Search", "Find the book you want in our catalog"], ["Request", "Submit a borrowing request with one click"], ["Pick Up", "Get notified when your book is ready"]].map(([title, desc], i) => (
                  <div key={i} className="step">
                    <div className="step-number">{i + 1}</div>
                    <div className="step-text"><h4>{title}</h4><p>{desc}</p></div>
                  </div>
                ))}
              </div>
              <Link href="/users/register" className="btn btn-primary">Get Started Free</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────── */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Reading?</h2>
            <p>Join thousands of readers who have already discovered their next great book through SmartLibrary.</p>
            <div className="cta-buttons">
              <Link href="/users/register" className="btn btn-white">Get Started Free</Link>
              <Link href="/books" className="btn btn-ghost">Browse Books</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
