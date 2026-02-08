import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET: Fetch all budgets with current month spending
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id },
      orderBy: { category: 'asc' },
    });

    // Get current month's spending per category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const expenses = await prisma.dailyExpense.groupBy({
      by: ['category'],
      where: {
        userId: session.user.id,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    // Merge spending with budgets
    const expenseMap = {};
    expenses.forEach(e => {
      expenseMap[e.category] = e._sum.amount || 0;
    });

    const enrichedBudgets = budgets.map(b => {
      const spent = expenseMap[b.category] || 0;
      const percentage = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      const isOverAlert = percentage >= b.alertAt;
      const isOverBudget = percentage >= 100;
      
      return {
        ...b,
        spent,
        percentage: Math.round(percentage),
        remaining: Math.max(0, b.monthlyLimit - spent),
        isOverAlert,
        isOverBudget,
        status: isOverBudget ? 'EXCEEDED' : isOverAlert ? 'WARNING' : 'OK',
      };
    });

    return NextResponse.json(enrichedBudgets);
  } catch (error) {
    console.error("Budget Fetch Error:", error);
    return NextResponse.json({ message: "Error fetching budgets" }, { status: 500 });
  }
}

// POST: Create or update a budget
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { category, monthlyLimit, alertAt } = await req.json();

    // Upsert: create or update if exists
    const budget = await prisma.budget.upsert({
      where: {
        userId_category: {
          userId: session.user.id,
          category: category,
        },
      },
      update: {
        monthlyLimit: parseFloat(monthlyLimit),
        alertAt: parseInt(alertAt) || 80,
      },
      create: {
        userId: session.user.id,
        category,
        monthlyLimit: parseFloat(monthlyLimit),
        alertAt: parseInt(alertAt) || 80,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Budget Create Error:", error);
    return NextResponse.json({ message: "Error creating budget" }, { status: 500 });
  }
}

// DELETE: Remove a budget
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Budget Delete Error:", error);
    return NextResponse.json({ message: "Error deleting budget" }, { status: 500 });
  }
}
