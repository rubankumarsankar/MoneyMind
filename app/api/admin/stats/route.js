import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import nodemailer from 'nodemailer';

export async function GET(req) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is an ADMIN
  // Note: Since we just added the role, existing users might not have it in session yet unless they re-login
  // For safety, we should check DB directly or trust session if updated
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    // 1. Fetch User Stats
    const totalUsers = await prisma.user.count();
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfToday
        }
      }
    });

    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
        }
      }
    });

    // 2. Check Email Configuration Status
    let emailStatus = { success: false, message: "Not configured" };
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.verify();
      emailStatus = { success: true, message: "Connected" };
    } catch (error) {
       emailStatus = { success: false, message: error.message };
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        newUsersToday,
        activeUsers,
      },
      system: {
        email: emailStatus,
        version: process.env.npm_package_version || "1.0.0",
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
