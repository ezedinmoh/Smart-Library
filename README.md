<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=3000&pause=1000&color=10B981&center=true&vCenter=true&width=600&lines=📚+Smart+Library+System;Modern+Digital+Library;Next.js+15+%2B+Supabase+%2B+Cloudinary" alt="Typing SVG" />

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Vercel](https://img.shields.io/badge/Live-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://smart-library-et.vercel.app)

<br/>

> **A full-featured digital library management system** — borrow books, read PDFs online, manage users, track fines, and more.  
> Built with Next.js 15 App Router, Supabase, Cloudinary, and Stripe/Chapa payments.

<br/>

🌐 **Live Demo → [smart-library-et.vercel.app](https://smart-library-et.vercel.app)**

---

</div>

## ✨ Features

<table>
<tr>
<td width="50%">

### 📖 Library Core
- Browse & search book catalog with filters
- Borrow / return / request books
- Online PDF reader (inline, fullscreen, download)
- Book reviews & star ratings
- QR code per book
- Book recommendations engine
- Category management

</td>
<td width="50%">

### 👥 User Management
- Role-based access: **Admin / Librarian / Student**
- OAuth login (Google, GitHub) + email/password
- Email verification & password reset
- User profiles with borrow history
- Bulk user import (CSV)
- Notification center

</td>
</tr>
<tr>
<td width="50%">

### 💰 Payments & Fines
- Overdue fine tracking (per-day)
- **Stripe** payment integration
- **Chapa** (Ethiopian payment) integration
- Payment history & receipts
- Unpaid fine dashboard

</td>
<td width="50%">

### 📊 Admin Dashboard
- Real-time borrowing stats
- Activity logs & system settings
- Bulk book import (CSV + ZIP)
- Manage stock levels
- Issue / return books manually
- Export books & records CSV

</td>
</tr>
</table>

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Server Components) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Prisma 6 |
| **Auth** | NextAuth v5 (Auth.js) — Credentials + OAuth |
| **Media** | Cloudinary (covers, PDFs, QR codes) |
| **Payments** | Stripe + Chapa |
| **Email** | Resend + Brevo SMTP |
| **Deployment** | Vercel |
| **Package Manager** | pnpm |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm i -g pnpm`)
- PostgreSQL (local) or Supabase account

### 1. Clone & install

```bash
git clone git@github.com:ezedinmoh/Smart-Library.git
cd Smart-Library
pnpm install
```

### 2. Environment variables

Copy and fill in your values:

```bash
cp .env .env.local
```

Key variables:

```env
# Database (local dev)
DATABASE_URL="postgresql://user:pass@localhost:5432/smart_library"
DIRECT_URL="postgresql://user:pass@localhost:5432/smart_library"

# Auth
NEXTAUTH_SECRET="your-secret"
AUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"

# OAuth (see setup guide below)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

### 3. Database setup

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
```

### 4. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 OAuth Setup Guide

### GitHub OAuth

1. Go to **[GitHub Developer Settings](https://github.com/settings/developers)** → **OAuth Apps** → **New OAuth App**
2. Fill in:
   | Field | Value |
   |-------|-------|
   | Application name | Smart Library |
   | Homepage URL | `https://smart-library-et.vercel.app` |
   | Authorization callback URL | `https://smart-library-et.vercel.app/api/auth/callback/github` |
3. Click **Register application**
4. Copy **Client ID** → `GITHUB_CLIENT_ID`
5. Click **Generate a new client secret** → `GITHUB_CLIENT_SECRET`

> For local dev, create a **second** OAuth App with callback URL `http://localhost:3000/api/auth/callback/github`

---

### Google OAuth

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)** → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Set **Application type** to **Web application**
4. Add **Authorized redirect URIs**:
   ```
   https://smart-library-et.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
5. Click **Create**
6. Copy **Client ID** → `GOOGLE_CLIENT_ID`
7. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

> Make sure the **OAuth consent screen** is configured (External, with your app name and email).

---

### Add OAuth credentials to Vercel

```bash
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add GITHUB_CLIENT_ID production
vercel env add GITHUB_CLIENT_SECRET production

# Redeploy to apply
vercel --prod
```

---

## 🔑 User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full access — manage users, books, settings, payments |
| **Librarian** | Manage books, issue/return, view records |
| **Student** | Browse, request/borrow books, read PDFs, pay fines |

---

## 📁 Project Structure

```
smart-library/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
└── src/
    ├── app/
    │   ├── api/               # API routes (books, borrow, users, payments)
    │   ├── books/             # Book pages (list, detail, read, manage)
    │   ├── borrow/            # Borrow flows (request, issue, history)
    │   ├── dashboard/         # Admin, librarian & student dashboards
    │   ├── payments/          # Stripe & Chapa payment pages
    │   └── users/             # Auth, profile, user management
    ├── components/            # Shared UI components
    └── lib/                   # Utilities (auth, prisma, cloudinary, email)
```

---

## 📦 Key Scripts

```bash
pnpm dev            # Start dev server
pnpm build          # Production build
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema changes
pnpm db:studio      # Open Prisma Studio
pnpm lint           # Run ESLint
```

---

## ☁️ Deploy to Vercel

```bash
# First deploy (interactive setup)
vercel

# Add env vars
./vercel-env-setup.sh

# Production deploy
vercel --prod
```

---

## 📄 License

MIT © [ezedinmoh](https://github.com/ezedinmoh)

<div align="center">
<br/>

**Built with ❤️ using Next.js 15 · [Live Demo](https://smart-library-et.vercel.app)**

[![GitHub stars](https://img.shields.io/github/stars/ezedinmoh/Smart-Library?style=social)](https://github.com/ezedinmoh/Smart-Library)

</div>
