/**
 * SQLite → PostgreSQL migration script for Smart Library
 * Uses better-sqlite3 (read) + Prisma (write) for type-safe migration.
 *
 * Run from project root:
 *   pnpm tsx prisma/migrate-sqlite.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { PrismaClient } from "@prisma/client";

const SQLITE_PATH = path.resolve(process.cwd(), "db.sqlite3");

const prisma = new PrismaClient({
    log: ["error"],
});

const db = new Database(SQLITE_PATH, { readonly: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBool(val: unknown): boolean {
    if (val === null || val === undefined) return false;
    if (typeof val === "boolean") return val;
    return val === 1 || val === "1" || val === "true";
}

function toDecimal(val: unknown): number {
    if (val === null || val === undefined) return 0;
    return parseFloat(String(val)) || 0;
}

function toDateOrNull(val: unknown): Date | null {
    if (!val || val === "") return null;
    try {
        const d = new Date(String(val));
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

function toDate(val: unknown): Date {
    return toDateOrNull(val) ?? new Date();
}

function tables(): Set<string> {
    const rows = db
        .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'django_%'"
        )
        .all() as Array<{ name: string }>;
    return new Set(rows.map((r) => r.name));
}

function has(table: string): boolean {
    return tables().has(table);
}

function all<T = Record<string, unknown>>(table: string): T[] {
    if (!has(table)) return [];
    return db.prepare(`SELECT * FROM "${table}"`).all() as T[];
}

function count(table: string): number {
    if (!has(table)) return 0;
    const r = db.prepare(`SELECT COUNT(*) as n FROM "${table}"`).get() as { n: number };
    return r.n;
}

// ─── Migration functions ───────────────────────────────────────────────────────

async function migrateCategories() {
    const rows = all<{
        id: number; name: string; description: string;
        created_at: string; updated_at: string;
    }>("books_category");
    if (!rows.length) { console.log("  ℹ️  books_category: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.category.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    name: r.name,
                    description: r.description ?? "",
                    createdAt: toDate(r.created_at),
                    updatedAt: toDate(r.updated_at),
                },
                update: { name: r.name, description: r.description ?? "" },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  category ${r.id}: ${e}`); }
    }
    console.log(`  ✅ books_category: ${ok}/${rows.length}`);
}

async function migrateUsers() {
    const rows = all<{
        id: number; username: string; email: string; password: string;
        first_name: string; last_name: string; phone_number: string;
        address: string; role: string; is_active: number; is_superuser: number;
        is_staff: number; created_at: string; updated_at: string;
        date_joined: string; last_login: string | null;
    }>("users_user");
    if (!rows.length) { console.log("  ℹ️  users_user: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.user.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    username: r.username,
                    email: r.email,
                    password: r.password,
                    firstName: r.first_name ?? "",
                    lastName: r.last_name ?? "",
                    phoneNumber: r.phone_number ?? "",
                    address: r.address ?? "",
                    role: r.role ?? "student",
                    isActive: toBool(r.is_active),
                    isSuperuser: toBool(r.is_superuser),
                    isStaff: toBool(r.is_staff),
                    createdAt: toDate(r.created_at),
                    updatedAt: toDate(r.updated_at),
                    dateJoined: toDate(r.date_joined),
                    lastLogin: toDateOrNull(r.last_login),
                },
                update: {
                    username: r.username,
                    email: r.email,
                    role: r.role ?? "student",
                    isActive: toBool(r.is_active),
                },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  user ${r.id} (${r.email}): ${e}`); }
    }
    console.log(`  ✅ users_user: ${ok}/${rows.length}`);
}

async function migrateUserProfiles() {
    const rows = all<{
        id: number; user_id: number; max_books_allowed: number;
        currently_borrowed: number; total_fines: string;
        profile_picture: string | null; reading_badge: string;
        total_books_read: number; created_at: string; updated_at: string;
    }>("users_userprofile");
    if (!rows.length) { console.log("  ℹ️  users_userprofile: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.userProfile.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    userId: r.user_id,
                    maxBooksAllowed: r.max_books_allowed ?? 7,
                    currentlyBorrowed: r.currently_borrowed ?? 0,
                    totalFines: toDecimal(r.total_fines),
                    profilePicture: r.profile_picture ?? null,
                    readingBadge: r.reading_badge ?? "reader",
                    totalBooksRead: r.total_books_read ?? 0,
                    createdAt: toDate(r.created_at),
                    updatedAt: toDate(r.updated_at),
                },
                update: {
                    maxBooksAllowed: r.max_books_allowed ?? 7,
                    currentlyBorrowed: r.currently_borrowed ?? 0,
                    totalFines: toDecimal(r.total_fines),
                },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  userprofile ${r.id}: ${e}`); }
    }
    console.log(`  ✅ users_userprofile: ${ok}/${rows.length}`);
}

async function migrateEmailAddresses() {
    const rows = all<{
        id: number; user_id: number; email: string;
        verified: number; primary: number; key: string | null;
    }>("users_emailaddress");
    if (!rows.length) { console.log("  ℹ️  users_emailaddress: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.emailAddress.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    userId: r.user_id,
                    email: r.email,
                    verified: toBool(r.verified),
                    primary: toBool(r.primary),
                    key: r.key ?? null,
                },
                update: { verified: toBool(r.verified) },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  emailaddress ${r.id}: ${e}`); }
    }
    console.log(`  ✅ users_emailaddress: ${ok}/${rows.length}`);
}

async function migrateNotificationReads() {
    const rows = all<{
        id: number; user_id: number; notification_type: string;
        notification_key: string; read_at: string;
    }>("users_notificationread");
    if (!rows.length) { console.log("  ℹ️  users_notificationread: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.notificationRead.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    userId: r.user_id,
                    notificationType: r.notification_type,
                    notificationKey: r.notification_key,
                    readAt: toDate(r.read_at),
                },
                update: {},
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  notificationread ${r.id}: ${e}`); }
    }
    console.log(`  ✅ users_notificationread: ${ok}/${rows.length}`);
}

async function migrateActivityLogs() {
    const rows = all<{
        id: number; user_id: number | null; action: string;
        description: string; ip_address: string | null;
        user_agent: string; created_at: string;
    }>("users_activitylog");
    if (!rows.length) { console.log("  ℹ️  users_activitylog: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.activityLog.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    userId: r.user_id ?? null,
                    action: r.action,
                    description: r.description ?? "",
                    ipAddress: r.ip_address ?? null,
                    userAgent: r.user_agent ?? "",
                    createdAt: toDate(r.created_at),
                },
                update: {},
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  activitylog ${r.id}: ${e}`); }
    }
    console.log(`  ✅ users_activitylog: ${ok}/${rows.length}`);
}

async function migrateBooks() {
    const rows = all<{
        id: number; isbn: string; title: string; author: string;
        description: string; category_id: number | null;
        total_copies: number; available_copies: number;
        cover_image: string | null; pdf_file: string | null;
        publisher: string; publication_date: string | null;
        pages: number | null; language: string; rating: string;
        times_borrowed: number; qr_code: string | null;
        created_at: string; updated_at: string;
    }>("books_book");
    if (!rows.length) { console.log("  ℹ️  books_book: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.book.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    isbn: r.isbn,
                    title: r.title,
                    author: r.author,
                    description: r.description ?? "",
                    categoryId: r.category_id ?? null,
                    totalCopies: r.total_copies ?? 0,
                    availableCopies: r.available_copies ?? 0,
                    coverImage: r.cover_image ?? null,
                    pdfFile: r.pdf_file ?? null,
                    publisher: r.publisher ?? "",
                    publicationDate: toDateOrNull(r.publication_date),
                    pages: r.pages ?? null,
                    language: r.language ?? "en",
                    rating: toDecimal(r.rating),
                    timesBorrowed: r.times_borrowed ?? 0,
                    qrCode: r.qr_code ?? null,
                    createdAt: toDate(r.created_at),
                    updatedAt: toDate(r.updated_at),
                },
                update: {
                    title: r.title,
                    author: r.author,
                    availableCopies: r.available_copies ?? 0,
                    rating: toDecimal(r.rating),
                },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  book ${r.id} (${r.isbn}): ${e}`); }
    }
    console.log(`  ✅ books_book: ${ok}/${rows.length}`);
}

async function migrateBookReviews() {
    const rows = all<{
        id: number; book_id: number; user_id: number; rating: number;
        review_text: string; created_at: string; updated_at: string;
    }>("books_bookreview");
    if (!rows.length) { console.log("  ℹ️  books_bookreview: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.bookReview.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    bookId: r.book_id,
                    userId: r.user_id,
                    rating: r.rating,
                    reviewText: r.review_text ?? "",
                    createdAt: toDate(r.created_at),
                    updatedAt: toDate(r.updated_at),
                },
                update: { rating: r.rating, reviewText: r.review_text ?? "" },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  bookreview ${r.id}: ${e}`); }
    }
    console.log(`  ✅ books_bookreview: ${ok}/${rows.length}`);
}

async function migrateBookRequests() {
    const rows = all<{
        id: number; user_id: number; book_id: number;
        request_date: string; status: string;
        approved_by_id: number | null; approved_date: string | null;
        rejection_reason: string; cancellation_reason: string;
        notes: string; notified: number;
        created_at: string; updated_at: string;
    }>("borrow_bookrequest");
    if (!rows.length) { console.log("  ℹ️  borrow_bookrequest: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.bookRequest.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    userId: r.user_id,
                    bookId: r.book_id,
                    requestDate: toDate(r.request_date),
                    status: r.status ?? "pending",
                    approvedById: r.approved_by_id ?? null,
                    approvedDate: toDateOrNull(r.approved_date),
                    rejectionReason: r.rejection_reason ?? "",
                    cancellationReason: r.cancellation_reason ?? "",
                    notes: r.notes ?? "",
                    notified: toBool(r.notified),
                    createdAt: toDate(r.created_at),
                    updatedAt: toDate(r.updated_at),
                },
                update: { status: r.status ?? "pending" },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  bookrequest ${r.id}: ${e}`); }
    }
    console.log(`  ✅ borrow_bookrequest: ${ok}/${rows.length}`);
}

async function migrateBorrowRecords() {
    const rows = all<{
        id: number; user_id: number; book_id: number;
        book_request_id: number | null; borrow_date: string;
        due_date: string; return_date: string | null; status: string;
        fine_amount: string; fine_paid: number;
        issued_by_id: number | null; returned_to_id: number | null;
        created_at: string; updated_at: string;
    }>("borrow_borrowrecord");
    if (!rows.length) { console.log("  ℹ️  borrow_borrowrecord: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.borrowRecord.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    userId: r.user_id,
                    bookId: r.book_id,
                    bookRequestId: r.book_request_id ?? null,
                    borrowDate: toDate(r.borrow_date),
                    dueDate: toDate(r.due_date),
                    returnDate: toDateOrNull(r.return_date),
                    status: r.status ?? "borrowed",
                    fineAmount: toDecimal(r.fine_amount),
                    finePaid: toBool(r.fine_paid),
                    issuedById: r.issued_by_id ?? null,
                    returnedToId: r.returned_to_id ?? null,
                    createdAt: toDate(r.created_at),
                    updatedAt: toDate(r.updated_at),
                },
                update: {
                    status: r.status ?? "borrowed",
                    fineAmount: toDecimal(r.fine_amount),
                    finePaid: toBool(r.fine_paid),
                    returnDate: toDateOrNull(r.return_date),
                },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  borrowrecord ${r.id}: ${e}`); }
    }
    console.log(`  ✅ borrow_borrowrecord: ${ok}/${rows.length}`);
}

async function migrateSystemSettings() {
    const rows = all<{
        id: number; default_borrow_limit: number; fine_per_day: string;
        etb_to_usd_rate: string; max_borrow_days: number;
        updated_at: string; updated_by_id: number | null;
    }>("dashboard_systemsettings");
    if (!rows.length) { console.log("  ℹ️  dashboard_systemsettings: empty"); return; }

    for (const r of rows) {
        try {
            await prisma.systemSettings.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    defaultBorrowLimit: r.default_borrow_limit ?? 5,
                    finePerDay: toDecimal(r.fine_per_day),
                    etbToUsdRate: toDecimal(r.etb_to_usd_rate),
                    maxBorrowDays: r.max_borrow_days ?? 14,
                    updatedAt: toDate(r.updated_at),
                    updatedById: r.updated_by_id ?? null,
                },
                update: {
                    defaultBorrowLimit: r.default_borrow_limit ?? 5,
                    finePerDay: toDecimal(r.fine_per_day),
                    etbToUsdRate: toDecimal(r.etb_to_usd_rate),
                    maxBorrowDays: r.max_borrow_days ?? 14,
                },
            });
        } catch (e) { console.error(`    ⚠️  systemsettings ${r.id}: ${e}`); }
    }
    console.log(`  ✅ dashboard_systemsettings: ${rows.length} rows`);
}

async function migratePayments() {
    const rows = all<{
        id: string; user_id: number; borrow_record_id: number;
        amount: string; currency: string; payment_method: string;
        status: string; transaction_id: string;
        payment_gateway_response: string | null;
        created_at: string; updated_at: string;
    }>("payments_payment");
    if (!rows.length) { console.log("  ℹ️  payments_payment: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            let gwResponse = null;
            if (r.payment_gateway_response) {
                try { gwResponse = JSON.parse(r.payment_gateway_response); } catch { gwResponse = null; }
            }
            await prisma.payment.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    userId: r.user_id,
                    borrowRecordId: r.borrow_record_id,
                    amount: toDecimal(r.amount),
                    currency: r.currency ?? "ETB",
                    paymentMethod: r.payment_method,
                    status: r.status ?? "pending",
                    transactionId: r.transaction_id,
                    paymentGatewayResponse: gwResponse,
                    createdAt: toDate(r.created_at),
                    updatedAt: toDate(r.updated_at),
                },
                update: { status: r.status ?? "pending" },
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  payment ${r.id}: ${e}`); }
    }
    console.log(`  ✅ payments_payment: ${ok}/${rows.length}`);
}

async function migrateStripePayments() {
    const rows = all<{
        id: number; payment_id: string;
        stripe_payment_intent_id: string; stripe_charge_id: string;
        stripe_customer_id: string; stripe_payment_method_id: string;
    }>("payments_stripepayment");
    if (!rows.length) { console.log("  ℹ️  payments_stripepayment: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.stripePayment.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    paymentId: r.payment_id,
                    stripePaymentIntentId: r.stripe_payment_intent_id,
                    stripeChargeId: r.stripe_charge_id ?? "",
                    stripeCustomerId: r.stripe_customer_id ?? "",
                    stripePaymentMethodId: r.stripe_payment_method_id ?? "",
                },
                update: {},
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  stripepayment ${r.id}: ${e}`); }
    }
    console.log(`  ✅ payments_stripepayment: ${ok}/${rows.length}`);
}

async function migrateChapaPayments() {
    const rows = all<{
        id: number; payment_id: string; chapa_tx_ref: string;
        chapa_checkout_url: string; payment_method_type: string;
    }>("payments_chapapayment");
    if (!rows.length) { console.log("  ℹ️  payments_chapapayment: empty"); return; }

    let ok = 0;
    for (const r of rows) {
        try {
            await prisma.chapaPayment.upsert({
                where: { id: r.id },
                create: {
                    id: r.id,
                    paymentId: r.payment_id,
                    chapaTxRef: r.chapa_tx_ref,
                    chapaCheckoutUrl: r.chapa_checkout_url ?? "",
                    paymentMethodType: r.payment_method_type ?? "telebirr",
                },
                update: {},
            });
            ok++;
        } catch (e) { console.error(`    ⚠️  chapapayment ${r.id}: ${e}`); }
    }
    console.log(`  ✅ payments_chapapayment: ${ok}/${rows.length}`);
}

// ─── Print SQLite summary ──────────────────────────────────────────────────────

function printSummary() {
    const tableList = [
        "users_user", "users_userprofile", "users_emailaddress",
        "users_notificationread", "users_activitylog",
        "books_category", "books_book", "books_bookreview",
        "borrow_bookrequest", "borrow_borrowrecord",
        "dashboard_systemsettings",
        "payments_payment", "payments_stripepayment", "payments_chapapayment",
    ];
    console.log("\n📊 SQLite data summary:");
    for (const t of tableList) {
        if (has(t)) {
            console.log(`  ${t}: ${count(t)} rows`);
        }
    }
    console.log();
}

// ─── Reset sequences ───────────────────────────────────────────────────────────

async function resetSequences() {
    const seqTables = [
        { table: "users_user", col: "id" },
        { table: "users_userprofile", col: "id" },
        { table: "users_notificationread", col: "id" },
        { table: "users_activitylog", col: "id" },
        { table: "users_emailaddress", col: "id" },
        { table: "books_category", col: "id" },
        { table: "books_book", col: "id" },
        { table: "books_bookreview", col: "id" },
        { table: "borrow_bookrequest", col: "id" },
        { table: "borrow_borrowrecord", col: "id" },
        { table: "dashboard_systemsettings", col: "id" },
        { table: "payments_stripepayment", col: "id" },
        { table: "payments_chapapayment", col: "id" },
    ];

    for (const { table, col } of seqTables) {
        try {
            await prisma.$executeRawUnsafe(
                `SELECT setval(pg_get_serial_sequence('"${table}"', '${col}'), COALESCE((SELECT MAX("${col}") FROM "${table}"), 1))`
            );
        } catch {
            // Ignore — table may not have a sequence (e.g. payment with UUID pk)
        }
    }
    console.log("  ✅ Sequences reset");
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log("🚀 Smart Library — SQLite → PostgreSQL Migration");
    console.log("═".repeat(55));
    console.log(`📂 SQLite: ${SQLITE_PATH}`);

    printSummary();

    console.log("📦 Migrating data...\n");

    // Order matters for FK constraints
    await migrateCategories();
    await migrateUsers();
    await migrateUserProfiles();
    await migrateEmailAddresses();
    await migrateNotificationReads();
    await migrateActivityLogs();
    await migrateBooks();
    await migrateBookReviews();
    await migrateBookRequests();
    await migrateBorrowRecords();
    await migrateSystemSettings();
    await migratePayments();
    await migrateStripePayments();
    await migrateChapaPayments();

    console.log("\n🔄 Resetting auto-increment sequences...");
    await resetSequences();

    console.log("\n🎉 Migration complete!");
    console.log("═".repeat(55));
    console.log("Run `pnpm db:studio` to inspect the data in Prisma Studio.");
}

main()
    .catch((e) => { console.error("❌ Migration failed:", e); process.exit(1); })
    .finally(async () => { db.close(); await prisma.$disconnect(); });
