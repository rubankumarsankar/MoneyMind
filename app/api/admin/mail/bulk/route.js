import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { subject, message, target } = await req.json();

    if (!subject || !message || !target) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Recipients
    let users = [];
    if (target === 'ALL') {
      users = await prisma.user.findMany({ select: { email: true } });
    } else if (target === 'ADMINS') {
      users = await prisma.user.findMany({ 
        where: { role: 'ADMIN' },
        select: { email: true } 
      });
    } else if (target === 'USERS') {
      users = await prisma.user.findMany({ 
        where: { role: 'USER' },
        select: { email: true } 
      });
    }

    if (users.length === 0) {
      return NextResponse.json({ message: 'No recipients found', count: 0 });
    }

    // 2. Configure Transporter (Reuse system settings if available, else ENV)
    const settings = await prisma.systemSettings.findFirst();
    const transporter = nodemailer.createTransport({
      host: settings?.smtpHost || process.env.SMTP_HOST,
      port: settings?.smtpPort || parseInt(process.env.SMTP_PORT || '587'),
      secure: settings?.smtpSecure ?? (process.env.SMTP_SECURE === 'true'),
      auth: {
        user: settings?.smtpUser || process.env.SMTP_USER,
        pass: settings?.smtpPass || process.env.SMTP_PASS,
      },
    });

    // 3. Send Emails (Batching is recommended for large lists, simple loop for now)
    const emails = users.map(u => u.email);
    
    // Send as BCC to protect privacy if sending to multiple
    // Or send individual emails. For bulk, BCC is safer/faster for small batches
    // For transactional services, individual is better. 
    // Here we'll do a simple loop or single BCC for simplicity
    
    // Approach: Send one email with all recipients in BCC
    await transporter.sendMail({
      from: `"${settings?.appName || 'MoneyMind'}" <${settings?.smtpUser || process.env.SMTP_USER}>`,
      to: settings?.smtpUser || process.env.SMTP_USER, // Send to self
      bcc: emails, // All users in BCC
      subject: subject,
      text: message, // Plain text fallback
      html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>${subject}</h2>
              <p style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
              <hr style="margin-top: 20px; border: 0; border-top: 1px solid #eee;">
              <small style="color: #888;">You are receiving this email from ${settings?.appName || 'MoneyMind'}.</small>
             </div>`
    });

    return NextResponse.json({ message: 'Bulk email sent successfully', count: emails.length });

  } catch (error) {
    console.error('Bulk Mail Error:', error);
    return NextResponse.json({ error: 'Failed to send emails: ' + error.message }, { status: 500 });
  }
}
