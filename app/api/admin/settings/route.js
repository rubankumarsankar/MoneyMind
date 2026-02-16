import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to check admin status
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });
  
  return user?.role === 'ADMIN';
}

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const settings = await prisma.systemSettings.findFirst();

    // Default values if no settings found
    const data = {
      appName: settings?.appName || process.env.NEXT_PUBLIC_APP_NAME || 'MoneyMind',
      maintenanceMode: settings?.maintenanceMode || false,
      registrationsOpen: settings?.allowRegistrations ?? true,
      
      // Email (Mask passwords)
      smtpHost: settings?.smtpHost || process.env.SMTP_HOST || '',
      smtpPort: settings?.smtpPort || process.env.SMTP_PORT || '587',
      smtpUser: settings?.smtpUser || process.env.SMTP_USER || '',
      smtpPass: settings?.smtpPass ? '********' : (process.env.SMTP_PASS ? '********' : ''),
      smtpSecure: settings?.smtpSecure ?? (process.env.SMTP_SECURE === 'true'),



      // Database
      databaseUrl: settings?.databaseUrl ? '********' : (process.env.DATABASE_URL ? '********' : ''),
      activeDatabaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]+@/, ':****@') : 'Not Configured' 
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { 
      appName, 
      maintenanceMode, 
      registrationsOpen,
      smtpHost, 
      smtpPort, 
      smtpUser, 
      smtpPass,
      smtpSecure,

      databaseUrl
    } = body;

    // Fetch existing settings to handle password persistence
    const existing = await prisma.systemSettings.findFirst();

    // Prepare update data
    const updateData = {
      appName,
      maintenanceMode,
      allowRegistrations: registrationsOpen,
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpUser,
      smtpSecure,

    };

    // Only update sensitive values if allowed/provided
    if (smtpPass && smtpPass !== '********') {
       updateData.smtpPass = smtpPass;
    }
    


    if (databaseUrl && databaseUrl !== '********') {
       updateData.databaseUrl = databaseUrl;
    }

    if (existing) {
      await prisma.systemSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prisma.systemSettings.create({
        data: updateData,
      });
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
