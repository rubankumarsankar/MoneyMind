# MoneyMind - Project Documentation

## 1. Project Overview

**MoneyMind** is a personal finance management application built with **Next.js 14**, **Prisma**, and **PostgreSQL/SQLite**. It allows users to track income, expenses, budgets, debts, and investments, while providing an admin interface for system management.

---

## 2. Technical Architecture

- **Framework**: Next.js 14 (App Router)
- **Database**:
  - **Production (Vercel)**: PostgreSQL (Supabase)
  - **Local Development**: SQLite (`dev.db`) *[Temporary workaround for network issues]*
- **ORM**: Prisma
- **Auth**: NextAuth.js (Credentials)
- **Styling**: Tailwind CSS + Lucide Icons

---

## 3. Modules & Features

### 🔐 Authentication (`/app/(auth)`)

- **Login**: Email/Password credential login.
- **Register**: New user sign-up.
- **Forgot/Reset Password**: Email-based password recovery flow.
- **Onboarding**: Initial setup wizard for new users (Salary, Bank, Categories).

### 📊 User Dashboard (`/app/(dashboard)`)

The core user experience for managing finances.

- **Dashboard**: High-level overview of net worth, recent transactions, and monthly summary.
- **Accounts**: Manage bank accounts, wallets, and cash.
- **Transactions**:
  - **Income**: Track salary and other earnings.
  - **Expenses**: Log daily spending with categories.
  - **Fixed Expenses**: Regular monthly bills (Rent, Subscriptions).
- **Credit Cards**: Track card limits, billing cycles, and spending.
- **Loans & EMI**: Manage borrowed money and monthly installments.
- **Savings & Investments**: Track goals and portfolio growth.
- **Budgets**: Set monthly limits per category with alerts.
- **Reports**: Visual analytics of financial health.

### 🛡️ Admin Panel (`/app/admin`)

Restricted area for system administrators.

- **Dashboard**: System-wide statistics.
- **Users**: Manage user accounts and roles.
- **Database**: View database health and connection status.
- **Mail**: Bulk emailer for announcements.
- **Settings**: System configurations (SMTP, App Name).

---

## 4. Workflows & Guides

### 🛠️ Development Workflow (Local)

Due to local network restrictions involving IPv6/Supabase, we use **SQLite** locally.

1. **Start Development Server**:

    ```bash
    npm run dev
    ```

2. **Database Management (Local)**:
    Since we are using SQLite locally, use these commands:

    ```bash
    # Push schema changes to local dev.db
    npx prisma db push

    # View database data
    npx prisma studio
    ```

    > **Note**: Do not run `prisma migrate deploy` locally.

### 🚀 Deployment Workflow (Vercel + Supabase)

Production uses **PostgreSQL**. Since your local network cannot connect to Supabase, you must handle migrations manually.

**Step 1: Database Setup (Manual)**

1. Get the SQL migration script: `d:\2026\money\migration.sql`.
2. Go to your **Supabase Dashboard** > **SQL Editor**.
3. Paste the content of `migration.sql` and run it.
4. This creates/updates your production tables efficiently.

**Step 2: Vercel Configuration**
Ensure these Environment Variables are set in Vercel Project Settings:

- `DATABASE_URL`: Your Supabase connection string (Transaction Mode/Port 6543).
- `DIRECT_URL`: Your Supabase connection string (Session Mode/Port 5432).
- `NEXTAUTH_SECRET`: A strong random string.
- `NEXTAUTH_URL`: Your Vercel deployment domain (e.g., `https://moneymind.vercel.app`).

**Step 3: Deploy**
Push your code to GitHub. Vercel will automatically build and deploy using the `postgres` configuration found in `.env` and `schema.prisma`.

### ⚠️ Common Issues & Fixes

**1. "Server Error" on Vercel**

- **Cause**: Trying to use SQLite (`file:./dev.db`) on Vercel's serverless environment.
- **Fix**: Ensure `schema.prisma` provider is set to `postgresql` before pushing. (We have already done this).

**2. "Connection failed" locally**

- **Cause**: Local ISP blocking IPv6 connection to Supabase.
- **Fix**: Continue using SQLite locally. Do not change `.env` back to Postgres unless you are testing network connectivity.

**3. "Prisma Client not initialized"**

- **Fix**: Run `npx prisma generate`. This rebuilds the client based on your current schema.
