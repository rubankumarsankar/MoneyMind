import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const borrows = await prisma.borrow.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(borrows);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching records" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { type, personName, amount, status } = await req.json();

    const newBorrow = await prisma.borrow.create({
      data: {
        userId: session.user.id,
        type, // "GAVE", "TOOK"
        personName,
        amount: parseFloat(amount),
        status: status || "PENDING",
      },
    });

    return NextResponse.json(newBorrow, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error adding record" }, { status: 500 });
  }
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
    try {
      const { id, status } = await req.json();
      const updated = await prisma.borrow.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json(updated);
    } catch (error) {
      return NextResponse.json({ message: "Error updating" }, { status: 500 });
    }
}
