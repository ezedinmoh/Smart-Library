"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function AnalyticsClient({ monthlyLabels, monthlyData, categoryStats, roleStats, availableBooks, unavailableBooks, dailyLabels, dailyBorrows, dailyReturns, topBooks, totalFines, unpaidFines }: any) {

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {/* Header — matches Django analytics.html */}
      <div style={{ marginBottom: 32 }}>
        <nav className="breadcrumb">
          <a href="/dashboard">Dashboard</a>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          <span>Analytics</span>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          <h1 className="page-title-gradient">Analytics</h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Library performance metrics and insights</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 40 }}>
        {[
          ["Total Fines (ETB)", totalFines.toFixed(2), "#ef4444"],
          ["Unpaid Fines (ETB)", unpaidFines.toFixed(2), "#f59e0b"],
          ["Available Books", availableBooks, "#10b981"],
          ["Out of Stock", unavailableBooks, "#ef4444"],
          ["Admins", roleStats.admin, "#10b981"],
          ["Librarians", roleStats.librarian, "#0ea5e9"],
          ["Students", roleStats.student, "#8b5cf6"],
        ].map(([l, v, c]) => (
          <div key={l as string} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 20, border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: c as string, marginBottom: 4 }}>{v}</div>
            <div style={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Monthly Borrow Trend */}
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 20 }}>Monthly Borrow Trend (Last 12 Months)</h2>
        <SimpleBarChart labels={monthlyLabels} data={monthlyData} color="var(--primary)" />
      </div>

      {/* Daily Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 20 }}>Daily Activity (Last 7 Days)</h2>
          <SimpleGroupedChart labels={dailyLabels} series={[{ label: "Borrows", data: dailyBorrows, color: "var(--primary)" }, { label: "Returns", data: dailyReturns, color: "var(--secondary)" }]} />
        </div>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 20 }}>Book Availability</h2>
          <SimplePieChart slices={[{ label: "Available", value: availableBooks, color: "#10b981" }, { label: "Out of Stock", value: unavailableBooks, color: "#ef4444" }]} />
        </div>
      </div>

      {/* Category Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 20 }}>Books per Category</h2>
          {categoryStats.slice(0, 8).map((c: any, i: number) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: "0.813rem", width: 120, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              <div style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${categoryStats[0]?.book_count > 0 ? (c.book_count / categoryStats[0].book_count) * 100 : 0}%`, height: "100%", background: `hsl(${i * 40},70%,55%)`, borderRadius: 5 }} />
              </div>
              <span style={{ fontSize: "0.813rem", width: 24, textAlign: "right", flexShrink: 0 }}>{c.book_count}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 20 }}>Top 10 Most Borrowed</h2>
          {topBooks.map((b: any, i: number) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", width: 16, flexShrink: 0 }}>{i + 1}.</span>
              <Link href={`/books/${b.id}`} style={{ flex: 1, fontSize: "0.813rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--primary)" }}>{b.title}</Link>
              <span style={{ fontSize: "0.813rem", fontWeight: 600, flexShrink: 0 }}>{b.timesBorrowed}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimpleBarChart({ labels, data, color }: { labels: string[]; data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{v}</span>
          <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: `${(v / max) * 120}px`, minHeight: v > 0 ? 4 : 0, transition: "height 0.3s" }} />
          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2, transform: "rotate(-30deg)", transformOrigin: "top center", marginTop: 4, width: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function SimpleGroupedChart({ labels, series }: { labels: string[]; series: { label: string; data: number[]; color: string }[] }) {
  const max = Math.max(...series.flatMap(s => s.data), 1);
  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        {series.map(s => <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem" }}><div style={{ width: 12, height: 12, background: s.color, borderRadius: 2 }} />{s.label}</div>)}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 100 }}>
              {series.map(s => (
                <div key={s.label} style={{ width: 10, background: s.color, borderRadius: "2px 2px 0 0", height: `${(s.data[i] / max) * 90}px`, minHeight: s.data[i] > 0 ? 2 : 0 }} />
              ))}
            </div>
            <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimplePieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  let acc = 0;
  const paths = slices.map(sl => {
    const pct = sl.value / total;
    const start = acc; acc += pct;
    const x1 = Math.cos(2 * Math.PI * start - Math.PI / 2) * 100 + 120;
    const y1 = Math.sin(2 * Math.PI * start - Math.PI / 2) * 100 + 120;
    const x2 = Math.cos(2 * Math.PI * acc - Math.PI / 2) * 100 + 120;
    const y2 = Math.sin(2 * Math.PI * acc - Math.PI / 2) * 100 + 120;
    const large = pct > 0.5 ? 1 : 0;
    return { ...sl, d: `M120,120 L${x1},${y1} A100,100 0 ${large},1 ${x2},${y2} Z` };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width="120" height="120" viewBox="0 0 240 240">
        {paths.map(p => <path key={p.label} d={p.d} fill={p.color} />)}
      </svg>
      <div>{slices.map(s => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 14, height: 14, background: s.color, borderRadius: 3, flexShrink: 0 }} />
          <span style={{ fontSize: "0.875rem" }}>{s.label}: <strong>{s.value}</strong></span>
        </div>
      ))}</div>
    </div>
  );
}
