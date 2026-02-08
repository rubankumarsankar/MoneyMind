import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, monthlyIncome } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate custom userId like ME001, ME002, etc.
    const lastUser = await prisma.user.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const nextNum = (lastUser?.id || 0) + 1;
    const customUserId = `ME${String(nextNum).padStart(3, '0')}`;

    const user = await prisma.user.create({
      data: {
        userId: customUserId,
        email,
        password: hashedPassword,
        name,
        // Create initial income record if provided
        ...(monthlyIncome && {
           incomes: {
             create: {
               amount: parseFloat(monthlyIncome),
               source: 'Salary (Base)',
               date: new Date()
             }
           }
        })
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch(err => console.error('Email error:', err));

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "User created successfully", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

