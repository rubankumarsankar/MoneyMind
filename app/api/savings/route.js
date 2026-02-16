import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const savings = await prisma.saving.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(savings);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching savings" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name, targetAmount, currentAmount, targetDate } = await req.json();
    const newSaving = await prisma.saving.create({
      data: {
        userId: session.user.id,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || 0),
        targetDate: targetDate ? new Date(targetDate) : null,
      },
    });
    return NextResponse.json(newSaving, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error adding saving goal" }, { status: 500 });
  }
}

export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
    try {
      const { id, name, targetAmount, currentAmount, targetDate } = await req.json();
      const updatedSaving = await prisma.saving.update({
        where: { id: parseInt(id) },
        data: {
          name,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount),
          targetDate: targetDate ? new Date(targetDate) : null,
        },
      });
      return NextResponse.json(updatedSaving);
    } catch (error) {
      return NextResponse.json({ message: "Error updating saving goal" }, { status: 500 });
    }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
  
    try {
      if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });
      await prisma.saving.delete({ where: { id: parseInt(id) } });
      return NextResponse.json({ message: "Deleted" });
    } catch (error) {
      return NextResponse.json({ message: "Error deleting saving goal" }, { status: 500 });
    }
}
