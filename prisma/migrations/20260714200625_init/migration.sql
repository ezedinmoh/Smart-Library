-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'librarian', 'student');

-- CreateEnum
CREATE TYPE "ReadingBadge" AS ENUM ('reader', 'book_lover', 'avid_reader');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('book_added', 'book_updated', 'book_deleted', 'book_borrowed', 'book_returned', 'request_created', 'request_approved', 'request_rejected', 'request_cancelled', 'fine_paid', 'payment_initiated', 'payment_completed', 'payment_failed', 'user_created', 'user_updated', 'user_role_changed', 'review_added', 'backup_created', 'backup_restored', 'reminder_sent', 'settings_updated', 'other');

-- CreateEnum
CREATE TYPE "BookLanguage" AS ENUM ('en', 'hi', 'es', 'fr', 'de', 'other');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'ready', 'fulfilled', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('borrowed', 'returned', 'overdue');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('stripe', 'chapa');

-- CreateEnum
CREATE TYPE "ChapaMethodType" AS ENUM ('telebirr', 'cbebirr', 'ebirr', 'mpesa', 'bank');

-- CreateTable
CREATE TABLE "users_user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "phone_number" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'student',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_superuser" BOOLEAN NOT NULL DEFAULT false,
    "is_staff" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "date_joined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_userprofile" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "max_books_allowed" INTEGER NOT NULL DEFAULT 7,
    "currently_borrowed" INTEGER NOT NULL DEFAULT 0,
    "total_fines" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "profile_picture" TEXT,
    "reading_badge" TEXT NOT NULL DEFAULT 'reader',
    "total_books_read" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_userprofile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_notificationread" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_type" TEXT NOT NULL,
    "notification_key" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_notificationread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_activitylog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_activitylog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users_emailaddress" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "key" TEXT,

    CONSTRAINT "users_emailaddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books_category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books_book" (
    "id" SERIAL NOT NULL,
    "isbn" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category_id" INTEGER,
    "total_copies" INTEGER NOT NULL,
    "available_copies" INTEGER NOT NULL,
    "cover_image" TEXT,
    "pdf_file" TEXT,
    "publisher" TEXT NOT NULL DEFAULT '',
    "publication_date" DATE,
    "pages" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'en',
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "times_borrowed" INTEGER NOT NULL DEFAULT 0,
    "qr_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books_bookreview" (
    "id" SERIAL NOT NULL,
    "book_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "review_text" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_bookreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrow_bookrequest" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "book_id" INTEGER NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by_id" INTEGER,
    "approved_date" TIMESTAMP(3),
    "rejection_reason" TEXT NOT NULL DEFAULT '',
    "cancellation_reason" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrow_bookrequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrow_borrowrecord" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "book_id" INTEGER NOT NULL,
    "book_request_id" INTEGER,
    "borrow_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE NOT NULL,
    "return_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'borrowed',
    "fine_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "fine_paid" BOOLEAN NOT NULL DEFAULT false,
    "issued_by_id" INTEGER,
    "returned_to_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrow_borrowrecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_systemsettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "default_borrow_limit" INTEGER NOT NULL DEFAULT 5,
    "fine_per_day" DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    "etb_to_usd_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.0180,
    "max_borrow_days" INTEGER NOT NULL DEFAULT 14,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" INTEGER,

    CONSTRAINT "dashboard_systemsettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments_payment" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "borrow_record_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transaction_id" TEXT NOT NULL,
    "payment_gateway_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments_stripepayment" (
    "id" SERIAL NOT NULL,
    "payment_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "stripe_charge_id" TEXT NOT NULL DEFAULT '',
    "stripe_customer_id" TEXT NOT NULL DEFAULT '',
    "stripe_payment_method_id" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "payments_stripepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments_chapapayment" (
    "id" SERIAL NOT NULL,
    "payment_id" TEXT NOT NULL,
    "chapa_tx_ref" TEXT NOT NULL,
    "chapa_checkout_url" TEXT NOT NULL DEFAULT '',
    "payment_method_type" TEXT NOT NULL DEFAULT 'telebirr',

    CONSTRAINT "payments_chapapayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_username_key" ON "users_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_email_key" ON "users_user"("email");

-- CreateIndex
CREATE INDEX "users_user_email_idx" ON "users_user"("email");

-- CreateIndex
CREATE INDEX "users_user_role_idx" ON "users_user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "users_userprofile_user_id_key" ON "users_userprofile"("user_id");

-- CreateIndex
CREATE INDEX "users_notificationread_user_id_notification_type_idx" ON "users_notificationread"("user_id", "notification_type");

-- CreateIndex
CREATE INDEX "users_notificationread_notification_key_idx" ON "users_notificationread"("notification_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_notificationread_user_id_notification_type_notificati_key" ON "users_notificationread"("user_id", "notification_type", "notification_key");

-- CreateIndex
CREATE INDEX "users_activitylog_user_id_action_idx" ON "users_activitylog"("user_id", "action");

-- CreateIndex
CREATE INDEX "users_activitylog_created_at_idx" ON "users_activitylog"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_provider_account_id_key" ON "auth_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_session_token_key" ON "auth_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_identifier_token_key" ON "auth_verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailaddress_key_key" ON "users_emailaddress"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailaddress_user_id_email_key" ON "users_emailaddress"("user_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "books_category_name_key" ON "books_category"("name");

-- CreateIndex
CREATE INDEX "books_category_name_idx" ON "books_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "books_book_isbn_key" ON "books_book"("isbn");

-- CreateIndex
CREATE INDEX "books_book_isbn_idx" ON "books_book"("isbn");

-- CreateIndex
CREATE INDEX "books_book_title_idx" ON "books_book"("title");

-- CreateIndex
CREATE INDEX "books_book_category_id_idx" ON "books_book"("category_id");

-- CreateIndex
CREATE INDEX "books_book_available_copies_idx" ON "books_book"("available_copies");

-- CreateIndex
CREATE INDEX "books_bookreview_book_id_user_id_idx" ON "books_bookreview"("book_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "books_bookreview_book_id_user_id_key" ON "books_bookreview"("book_id", "user_id");

-- CreateIndex
CREATE INDEX "borrow_bookrequest_user_id_status_idx" ON "borrow_bookrequest"("user_id", "status");

-- CreateIndex
CREATE INDEX "borrow_bookrequest_book_id_status_idx" ON "borrow_bookrequest"("book_id", "status");

-- CreateIndex
CREATE INDEX "borrow_bookrequest_status_idx" ON "borrow_bookrequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "borrow_borrowrecord_book_request_id_key" ON "borrow_borrowrecord"("book_request_id");

-- CreateIndex
CREATE INDEX "borrow_borrowrecord_user_id_status_idx" ON "borrow_borrowrecord"("user_id", "status");

-- CreateIndex
CREATE INDEX "borrow_borrowrecord_book_id_idx" ON "borrow_borrowrecord"("book_id");

-- CreateIndex
CREATE INDEX "borrow_borrowrecord_due_date_idx" ON "borrow_borrowrecord"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_transaction_id_key" ON "payments_payment"("transaction_id");

-- CreateIndex
CREATE INDEX "payments_payment_user_id_status_idx" ON "payments_payment"("user_id", "status");

-- CreateIndex
CREATE INDEX "payments_payment_transaction_id_idx" ON "payments_payment"("transaction_id");

-- CreateIndex
CREATE INDEX "payments_payment_payment_method_status_idx" ON "payments_payment"("payment_method", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripepayment_payment_id_key" ON "payments_stripepayment"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripepayment_stripe_payment_intent_id_key" ON "payments_stripepayment"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_chapapayment_payment_id_key" ON "payments_chapapayment"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_chapapayment_chapa_tx_ref_key" ON "payments_chapapayment"("chapa_tx_ref");

-- AddForeignKey
ALTER TABLE "users_userprofile" ADD CONSTRAINT "users_userprofile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_notificationread" ADD CONSTRAINT "users_notificationread_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_activitylog" ADD CONSTRAINT "users_activitylog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_emailaddress" ADD CONSTRAINT "users_emailaddress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books_book" ADD CONSTRAINT "books_book_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "books_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books_bookreview" ADD CONSTRAINT "books_bookreview_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books_bookreview" ADD CONSTRAINT "books_bookreview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_bookrequest" ADD CONSTRAINT "borrow_bookrequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_bookrequest" ADD CONSTRAINT "borrow_bookrequest_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_bookrequest" ADD CONSTRAINT "borrow_bookrequest_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_borrowrecord" ADD CONSTRAINT "borrow_borrowrecord_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_borrowrecord" ADD CONSTRAINT "borrow_borrowrecord_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_borrowrecord" ADD CONSTRAINT "borrow_borrowrecord_book_request_id_fkey" FOREIGN KEY ("book_request_id") REFERENCES "borrow_bookrequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_borrowrecord" ADD CONSTRAINT "borrow_borrowrecord_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_borrowrecord" ADD CONSTRAINT "borrow_borrowrecord_returned_to_id_fkey" FOREIGN KEY ("returned_to_id") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_systemsettings" ADD CONSTRAINT "dashboard_systemsettings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments_payment" ADD CONSTRAINT "payments_payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments_payment" ADD CONSTRAINT "payments_payment_borrow_record_id_fkey" FOREIGN KEY ("borrow_record_id") REFERENCES "borrow_borrowrecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments_stripepayment" ADD CONSTRAINT "payments_stripepayment_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments_chapapayment" ADD CONSTRAINT "payments_chapapayment_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
