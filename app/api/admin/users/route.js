import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
  if (!await checkAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        onboardingCompleted: true,
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req) {
    if (!await checkAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        const { name, email, password, role } = body;

        // Custom ID generation
        const lastUser = await prisma.user.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
        const nextNum = (lastUser?.id || 0) + 1;
        const userId = `ME${String(nextNum).padStart(3, '0')}`;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                userId,
                name,
                email,
                password: hashedPassword,
                role: role || 'USER',
                onboardingCompleted: true // Admin created users assume onboarding done or optional
            }
        });

        return NextResponse.json(newUser);

    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
             return NextResponse.json({ message: "Email already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
    }
}

export async function DELETE(req) {
    if (!await checkAdmin()) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

        // Prevent deleting self? (Optional safety)
        
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: "User deleted" });

    } catch (error) {
        return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
    }
}
