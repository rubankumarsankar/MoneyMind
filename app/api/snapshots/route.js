import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { FinanceEngine } from "@/lib/finance";

// POST: Trigger Manual Snapshot (or end-of-month auto trigger)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  try {
    // 1. Gather Data for Current status (or specific month if passed)
    const today = new Date();
    // Use Start of Month to End of Month? 
    // Snapshots usually represent "Monthly Close".
    // For V2 MVP, we calculate "Current Financial Health" and snapshot it.
    
    // Fetch all data necessary for Health Score
    // Reusing Dashboard Logic essentially, but saving result.
    // OPTIMIZATION: In a real app, we might extract the "FetchAllData" service.
    
    const [income, fixed, daily, emis, creditCards, borrows] = await Promise.all([
      prisma.income.findMany({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.dailyExpense.findMany({ 
          where: { 
              userId,
              date: { 
                 gte: new Date(today.getFullYear(), today.getMonth(), 1), // Current Month only for expenses? 
                 // Health calculation usually takes "Income" vs "This Month Expenses"
              } 
          } 
      }),
      prisma.eMI.findMany({ where: { userId } }),
      prisma.creditCard.findMany({ where: { userId }, include: { spends: true } }),
      prisma.borrow.findMany({ where: { userId } }),
    ]);

    const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);
    const totalFixed = fixed.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDaily = daily.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Calculate EMI (assuming all active for simplicity in snapshot)
    const totalEMI = emis.reduce((acc, curr) => acc + curr.monthlyAmount, 0);

    // CC Spends (Approx current month)
    const currentMonthCCSpends = creditCards.reduce((acc, card) => {
        const monthlySpends = card.spends
           .filter(s => {
              const d = new Date(s.date);
              return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
           })
           .reduce((sum, s) => sum + s.amount, 0);
        return acc + monthlySpends;
    }, 0);

    const healthEngine = FinanceEngine.calculateFinancialHealth(
        totalIncome,
        [{ amount: totalFixed }], 
        [{ amount: totalDaily }],
        [{ monthlyAmount: totalEMI }],
        [{ amount: currentMonthCCSpends }],
        borrows
    );

    const monthString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Upsert snapshot for this month
    // Find existing
    const existing = await prisma.financialSnapshot.findFirst({
        where: { userId, month: monthString }
    });

    let snapshot;
    if (existing) {
        snapshot = await prisma.financialSnapshot.update({
            where: { id: existing.id },
            data: {
                totalIncome: healthEngine.totalIncome,
                totalExpense: healthEngine.totalExpense,
                savings: healthEngine.savings,
                healthScore: healthEngine.healthScore,
                riskLevel: healthEngine.riskLevel
            }
        });
    } else {
        snapshot = await prisma.financialSnapshot.create({
            data: {
                userId,
                month: monthString,
                totalIncome: healthEngine.totalIncome,
                totalExpense: healthEngine.totalExpense,
                savings: healthEngine.savings,
                healthScore: healthEngine.healthScore,
                riskLevel: healthEngine.riskLevel
            }
        });
    }

    return NextResponse.json({ message: "Snapshot saved", snapshot });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error creating snapshot" }, { status: 500 });
  }
}
