import type { UserRole } from "@prisma/client";

// ── Date helpers ──────────────────────────────────────────────────────────────
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function getDaysRemaining(dueDate: Date | string): number {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

export function getDaysOverdue(dueDate: Date | string): number {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

export function isOverdue(dueDate: Date | string, status: string): boolean {
    if (status === "returned") return false;
    return new Date(dueDate) < new Date();
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// ── String helpers ────────────────────────────────────────────────────────────
export function truncateWords(text: string, count: number): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= count) return text;
    return words.slice(0, count).join(" ") + "…";
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function getInitials(firstName: string, lastName: string, username?: string): string {
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (username) return username.slice(0, 2).toUpperCase();
    return "??";
}

export function getFullName(firstName: string, lastName: string, username: string): string {
    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    return name || username;
}

// ── Number helpers ────────────────────────────────────────────────────────────
export function formatCurrency(amount: number | string, currency = "ETB"): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${currency} ${num.toFixed(2)}`;
}

export function formatCurrencyUSD(amount: number | string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
export function isAdmin(role: UserRole) { return role === "admin"; }
export function isLibrarian(role: UserRole) { return role === "librarian"; }
export function isStudent(role: UserRole) { return role === "student"; }
export function isLibrarianOrAdmin(role: UserRole) {
    return role === "admin" || role === "librarian";
}

export function getRoleDisplay(role: UserRole): string {
    const map: Record<UserRole, string> = {
        admin: "Administrator",
        librarian: "Librarian",
        student: "Student",
    };
    return map[role] ?? role;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function getPaginationRange(current: number, total: number, delta = 2): (number | "...")[] {
    const range: (number | "...")[] = [];
    const left = current - delta;
    const right = current + delta;

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= left && i <= right)) {
            range.push(i);
        } else if (i === left - 1 || i === right + 1) {
            range.push("...");
        }
    }
    return range;
}

// ── Class helpers ─────────────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}

// ── ISBN validation ────────────────────────────────────────────────────────────
export function isValidISBN(isbn: string): boolean {
    const clean = isbn.replace(/[-\s]/g, "").toUpperCase();
    if (clean.length === 10) return /^\d{9}[\dX]$/.test(clean);
    if (clean.length === 13) return /^\d{13}$/.test(clean);
    return false;
}

// ── Reading badge ─────────────────────────────────────────────────────────────
export function getReadingBadge(totalBooksRead: number): string {
    if (totalBooksRead >= 20) return "avid_reader";
    if (totalBooksRead >= 10) return "book_lover";
    return "reader";
}

export function getBadgeDisplayName(badge: string): string {
    const map: Record<string, string> = {
        reader: "Reader",
        book_lover: "Book Lover",
        avid_reader: "Avid Reader",
    };
    return map[badge] ?? "Reader";
}

// ── IP extraction ─────────────────────────────────────────────────────────────
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return "unknown";
}

// ── Cloudinary media URLs ─────────────────────────────────────────────────────
const MEDIA_FIELDS: Record<string, "image" | "raw"> = {
    coverImage: "image",
    pdfFile: "raw",
    qrCode: "image",
    profilePicture: "image",
};

/** Resolve Django/Cloudinary public_id paths to full delivery URLs. */
export function resolveCloudinaryUrl(
    value: string | null | undefined,
    resourceType: "image" | "raw" = "image"
): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^(https?:\/\/|data:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/")) return trimmed;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return `/${trimmed}`;

    const publicId = trimmed.replace(/^\/+/, "");
    // PDFs must use "raw" resource type — using "image" causes Cloudinary "not found" errors
    const rType = (publicId.includes("pdfs/") || publicId.toLowerCase().endsWith(".pdf")) ? "raw" : resourceType;
    return `https://res.cloudinary.com/${cloudName}/${rType}/upload/${publicId}`;
}

function resolveMediaFields(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(resolveMediaFields);
    }

    if (value && typeof value === "object" && !(value instanceof Date)) {
        const result: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(value)) {
            if (typeof child === "string" && key in MEDIA_FIELDS) {
                result[key] = resolveCloudinaryUrl(child, MEDIA_FIELDS[key]);
            } else {
                result[key] = resolveMediaFields(child);
            }
        }
        return result;
    }

    return value;
}

function isPrismaDecimal(value: unknown): value is { toNumber(): number } {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as { toNumber?: unknown }).toNumber === "function" &&
        "d" in value &&
        "s" in value
    );
}

// ── Prisma serialization helper ──────────────────────────────────────────────
/** Convert Prisma models (Decimal, Date, media paths) into client-safe plain objects. */
export function serializePrisma<T>(data: T): T {
    const json = JSON.stringify(data, function (key, value) {
        const originalValue = this ? (this as any)[key] : value;
        if (typeof originalValue === "bigint") return originalValue.toString();
        if (isPrismaDecimal(originalValue)) return originalValue.toNumber();
        if (originalValue instanceof Date) return originalValue.toISOString();
        return value;
    });

    return resolveMediaFields(JSON.parse(json)) as T;
}


