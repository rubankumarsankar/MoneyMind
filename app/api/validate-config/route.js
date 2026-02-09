import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function POST(req) {
  try {
    const body = await req.json();
    const { databaseUrl, nextAuthUrl, nextAuthSecret } = body;

    const results = {
      database: { status: "pending", message: "" },
      nextAuth: { status: "pending", message: "" },
    };

    // 1. Validate Database Connection
    if (databaseUrl) {
      try {
        // Create a temporary client to test the connection
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: databaseUrl,
            },
          },
        });
        
        // Try a simple query
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();

        results.database = { status: "success", message: "Connection successful!" };
      } catch (error) {
        results.database = { status: "error", message: `Connection failed: ${error.message}` };
      }
    } else {
      results.database = { status: "skipped", message: "No URL provided" };
    }

    // 2. Validate NextAuth URL
    if (nextAuthUrl) {
      // Basic format check
      if (!nextAuthUrl.startsWith("http")) {
         results.nextAuth = { status: "error", message: "URL must start with http:// or https://" };
      } else {
         results.nextAuth = { status: "success", message: "URL format is valid." };
      }
    }

    // 3. Overall System Check (Current Environment)
    const systemStatus = {
        currentEnv: process.env.NODE_ENV,
        configuredNextAuthUrl: process.env.NEXTAUTH_URL === nextAuthUrl ? "MATCH" : "MISMATCH",
        dbConfigured: !!process.env.DATABASE_URL,
        availableEnvKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT') || key.startsWith('DATA') || key.startsWith('GOOGLE'))
    };

    return NextResponse.json({ results, systemStatus });

  } catch (error) {
    return NextResponse.json({ message: "Validation error" }, { status: 500 });
  }
}
