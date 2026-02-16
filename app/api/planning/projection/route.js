import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlanningEngine } from "@/lib/planningEngine";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const { overrides, months = 6 } = await req.json();

    const today = new Date();
    
    // Calculate date ranges for averages (Last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    threeMonthsAgo.setDate(1);

    // Fetch user data
    const [income, fixed, daily, emis, accounts, savings] = await Promise.all([
      prisma.income.findMany({ 
        where: { 
            userId,
            date: { gte: threeMonthsAgo } 
        } 
      }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.dailyExpense.findMany({ 
        where: { 
            userId, 
            date: { gte: threeMonthsAgo }
        }, 
        orderBy: { date: 'desc' } 
      }),
      prisma.eMI.findMany({ where: { userId } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.saving.findMany({ where: { userId } }),
    ]);

    // Calculate Defaults
    const totalRecentIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const monthlyIncome = totalRecentIncome > 0 ? (totalRecentIncome / 3) : 0; 

    const totalFixed = fixed.reduce((sum, f) => sum + f.amount, 0);
    
    // Variable Expenses (Monthly Average)
    const expensesByMonth = {};
    daily.forEach(e => {
        const monthKey = `${e.date.getMonth()}-${e.date.getFullYear()}`;
        expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + e.amount;
    });
    const numberOfMonthsWithExpenses = Object.keys(expensesByMonth).length || 1;
    const totalVariableDesc = daily.reduce((sum, d) => sum + d.amount, 0);
    const avgVariable = totalVariableDesc / (numberOfMonthsWithExpenses > 0 ? numberOfMonthsWithExpenses : 1);

    // Active EMIs
    const activeEmis = emis.filter(e => {
      const start = new Date(e.startDate);
      const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
      return monthsPassed < e.totalMonths;
    });
    const totalEMI = activeEmis.reduce((sum, e) => sum + e.monthlyAmount, 0);

    const accountBalances = accounts.reduce((sum, a) => sum + a.balance, 0);
    const currentSavings = savings.reduce((sum, s) => sum + (s.currentAmount || 0), 0);

    // Run Simulation with Overrides
    const cashFlow = PlanningEngine.simulateCashFlow({
      monthlyIncome,
      fixedExpenses: totalFixed,
      averageVariable: avgVariable,
      emiTotal: totalEMI,
      plannedExpenses: [],
      expectedIncomeChanges: [],
      overrides: overrides || [] // Pass the overrides array from frontend
    }, months);

    return NextResponse.json({
      cashFlow,
      // Metadata
      defaults: {
        monthlyIncome,
        monthlyExpenses: totalFixed + avgVariable + totalEMI
      }
    });

  } catch (error) {
    console.error('Projection API Error:', error);
    return NextResponse.json({ message: "Error calculating projection" }, { status: 500 });
  }
}
