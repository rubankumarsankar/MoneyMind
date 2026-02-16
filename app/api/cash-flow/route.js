import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 1. Total Income (This Month)
    const incomeAgg = await prisma.income.aggregate({
        _sum: { amount: true },
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } }
    });
    const totalIncome = incomeAgg._sum.amount || 0;

    // 2. Total Expenses (This Month, excluding EMI if categorized as EMI)
    const expenseAgg = await prisma.dailyExpense.aggregate({
        _sum: { amount: true },
        where: { 
            userId, 
            date: { gte: startOfMonth, lte: endOfMonth },
            category: { not: 'EMI' } // Exclude explicit EMI category
        }
    });
    const totalExpenses = expenseAgg._sum.amount || 0;

    // 3. Total EMI Paid (This Month) - from DailyExpense with category 'EMI'
    // Doing it this way ensures we only count what was *actually* paid/recorded as expense
    const emiAgg = await prisma.dailyExpense.aggregate({
        _sum: { amount: true },
        where: { 
            userId, 
            date: { gte: startOfMonth, lte: endOfMonth },
            category: 'EMI' 
        }
    });
    const totalEMI = emiAgg._sum.amount || 0;

    // 4. Current Account Balances
    const accounts = await prisma.account.findMany({
        where: { userId },
        select: { name: true, balance: true, type: true }
    });
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

    // 5. Net Flow
    const netFlow = totalIncome - (totalExpenses + totalEMI);

    return NextResponse.json({
        period: "Current Month",
        income: totalIncome,
        expenses: totalExpenses,
        emi: totalEMI,
        balance: totalBalance,
        netFlow,
        accounts
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching cash flow" }, { status: 500 });
  }
}
