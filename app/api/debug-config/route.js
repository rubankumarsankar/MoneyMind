import { NextResponse } from "next/server";

export async function GET() {
  // Helper to mask secrets
  const mask = (str) => {
    if (!str) return "NOT SET";
    if (str.length < 8) return "***";
    return str.substring(0, 4) + "..." + str.substring(str.length - 4);
  };

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    // Masked Secrets
    nextAuthSecret: mask(process.env.NEXTAUTH_SECRET),
    databaseUrl: mask(process.env.DATABASE_URL),
    googleClientId: mask(process.env.GOOGLE_CLIENT_ID),
    googleClientSecret: mask(process.env.GOOGLE_CLIENT_SECRET),
    // Connectivity Checks
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString(),
  });
}
