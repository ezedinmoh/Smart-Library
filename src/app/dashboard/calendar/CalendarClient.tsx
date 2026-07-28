"use client";
import { useState } from "react";
import Link from "next/link";

interface CalEvent { title: string; start: string; color: string; url: string; status: string; fine: number; }

export default function CalendarClient({ events }: { events: CalEvent[] }) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    function prevMonth() { setCurrentMonth(new Date(year, month - 1, 1)); }
    function nextMonth() { setCurrentMonth(new Date(year, month + 1, 1)); }

    function getEventsForDay(day: number): CalEvent[] {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return events.filter(e => e.start === dateStr);
    }

    const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            {/* Header — matches Django calendar.html */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 28, height: 28 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <h1 className="page-title-gradient">Due Dates Calendar</h1>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Track upcoming and overdue book return dates</p>
            </div>

            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                    <button className="btn btn-secondary btn-sm" onClick={prevMonth}>← Prev</button>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{monthName}</h2>
                    <button className="btn btn-secondary btn-sm" onClick={nextMonth}>Next →</button>
                </div>

                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)" }}>
                    {days.map(d => <div key={d} style={{ padding: "10px", textAlign: "center", fontSize: "0.813rem", fontWeight: 600, color: "var(--text-muted)" }}>{d}</div>)}
                </div>

                {/* Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                    {/* Empty cells */}
                    {Array.from({ length: firstDay }, (_, i) => (
                        <div key={`empty-${i}`} style={{ minHeight: 80, borderRight: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)", background: "var(--surface)" }} />
                    ))}
                    {/* Days */}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDay(day);
                        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                        return (
                            <div key={day} style={{ minHeight: 80, padding: 6, borderRight: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)", background: isToday ? "rgba(16,185,129,0.05)" : "transparent" }}>
                                <div style={{ fontSize: "0.875rem", fontWeight: isToday ? 700 : 400, marginBottom: 4, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday ? "var(--primary)" : "transparent", color: isToday ? "white" : "var(--text-primary)" }}>{day}</div>
                                {dayEvents.map((ev, idx) => (
                                    <Link key={idx} href={ev.url} style={{ display: "block", marginBottom: 2, padding: "2px 6px", borderRadius: 4, fontSize: "0.625rem", fontWeight: 500, background: `${ev.color}20`, color: ev.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none" }}
                                        title={`${ev.title}${ev.fine > 0 ? ` | Fine: ETB ${ev.fine.toFixed(2)}` : ""}`}>
                                        {ev.title}
                                    </Link>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 14, height: 14, background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", borderRadius: 3 }} />
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Due date</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 14, height: 14, background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", borderRadius: 3 }} />
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Overdue</span>
                </div>
            </div>

            {/* Upcoming */}
            {events.length > 0 && (
                <div style={{ marginTop: 32 }}>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 16 }}>Upcoming Due Dates</h2>
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                        {events.sort((a, b) => a.start.localeCompare(b.start)).slice(0, 10).map((ev, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "1px solid var(--border-light)" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{ev.title}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ev.start}</div>
                                </div>
                                {ev.fine > 0 && <span style={{ fontSize: "0.813rem", color: "var(--error)", fontWeight: 600 }}>ETB {ev.fine.toFixed(2)}</span>}
                                <span style={{ padding: "3px 10px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: `${ev.color}20`, color: ev.color }}>{ev.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
