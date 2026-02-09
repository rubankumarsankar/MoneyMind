# Admin Panel Setup & User Guide

This guide explains how to access, use, and manage the Admin Panel in MoneyMind.

## 1. Accessing the Admin Panel

The Admin Panel is located at:
**[Admin Dashboard](/admin/dashboard)**

> **Requirement:** You must be logged in as a user with the `ADMIN` role.

## 2. Managing Admin Users

Since the Admin Panel is restricted, you need to promote a user to `ADMIN` via the database or a script before they can access it.

### Using the Script (Recommended)

I have created a helper script to easily promote or demote users.

**To Promote a User to Admin:**
Run this command in your terminal:

```bash
node scripts/manage-admin.js your-email@example.com promote
```

**To Demote a User (Remove Admin):**

```bash
node scripts/manage-admin.js your-email@example.com demote
```

### Manual Database Update

You can also manually update the `role` field in the `User` table to `"ADMIN"` using Prisma Studio:

```bash
npx prisma studio
```

## 3. Features

The Admin Dashboard currently provides:

- **User Statistics:** Total Users, New Users Today, Active Users.
- **System Health:**
  - **Environment:** Shows if you are running in Development or Production.
  - **Email Service (SMTP):** Verifies if your email configuration is working.
  - **Test Email:** Button to re-verify the SMTP connection.

## 4. Troubleshooting

- **"Access Denied"**: Ensure your user has `role: 'ADMIN'` in the database. You may need to log out and log back in for the session to update.
- **SMTP Error**: Check your `.env` file for correct `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` settings.
