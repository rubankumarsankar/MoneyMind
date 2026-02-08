import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const categories = ['RENT', 'UTILITY', 'SUBSCRIPTION', 'INSURANCE', 'LOAN', 'OTHER'];

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const expenses = await prisma.fixedExpense.findMany({
      where: { userId: session.user.id },
      orderBy: { dayOfMonth: 'asc' },
      include: { account: true }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching fixed expenses" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { title, name, amount, dayOfMonth, category, accountId } = await req.json();
    
    const newExpense = await prisma.fixedExpense.create({
      data: {
        userId: session.user.id,
        title: title || name,
        name: name || title,
        category: category || 'OTHER',
        amount: parseFloat(amount),
        dayOfMonth: parseInt(dayOfMonth),
        accountId: accountId || null,
      },
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding fixed expense" }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id, title, name, amount, dayOfMonth, category, accountId } = await req.json();
    
    const updatedExpense = await prisma.fixedExpense.update({
      where: { id },
      data: {
        title: title || name,
        name: name || title,
        category: category || 'OTHER',
        amount: parseFloat(amount),
        dayOfMonth: parseInt(dayOfMonth),
        accountId: accountId || null,
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error updating fixed expense" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

  try {
    await prisma.fixedExpense.delete({
      where: { id: id },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error deleting" }, { status: 500 });
  }
}
