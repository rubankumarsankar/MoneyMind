import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const recurring = await prisma.recurringExpense.findMany({
      where: { userId: session.user.id },
      orderBy: { nextDue: 'asc' }
    });
    return NextResponse.json(recurring);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching recurring expenses" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name, amount, frequency, dayOfMonth, category, nextDue } = await req.json();
    
    const newSubscription = await prisma.recurringExpense.create({
      data: {
        userId: session.user.id,
        name,
        amount: parseFloat(amount),
        frequency: frequency || 'MONTHLY',
        dayOfMonth: parseInt(dayOfMonth),
        category: category || 'Uncategorized',
        nextDue: new Date(nextDue),
        isActive: true
      }
    });

    return NextResponse.json(newSubscription, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding subscription" }, { status: 500 });
  }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

    try {
        await prisma.recurringExpense.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting" }, { status: 500 });
    }
}
