import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { PlanningEngine } from "@/lib/planningEngine";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const { scenario } = await req.json();

    // Fetch current state
    const [income, fixed, daily, emis, accounts, savings] = await Promise.all([
      prisma.income.findMany({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.dailyExpense.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 30 }),
      prisma.eMI.findMany({ where: { userId } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.saving.findMany({ where: { userId } }),
    ]);

    const today = new Date();
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalFixed = fixed.reduce((sum, f) => sum + f.amount, 0);
    
    const activeEmis = emis.filter(e => {
      const start = new Date(e.startDate);
      const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
      return monthsPassed < e.totalMonths;
    });
    const totalEMI = activeEmis.reduce((sum, e) => sum + e.monthlyAmount, 0);

    const avgDaily = daily.length > 0 
      ? daily.reduce((sum, d) => sum + d.amount, 0) / daily.length * 30
      : 0;

    const currentSavings = accounts.reduce((sum, a) => sum + a.balance, 0) +
                          savings.reduce((sum, s) => sum + (s.currentAmount || 0), 0);

    // Calculate health score (simplified)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalFixed - avgDaily - totalEMI) / totalIncome) * 100 : 0;
    let healthScore = 50;
    if (savingsRate >= 20) healthScore = 80;
    else if (savingsRate >= 10) healthScore = 65;
    else if (savingsRate >= 0) healthScore = 50;
    else healthScore = 30;

    // Run what-if analysis
    const result = PlanningEngine.analyzeWhatIf(scenario, {
      monthlyIncome: totalIncome,
      monthlyExpenses: totalFixed + avgDaily + totalEMI,
      currentSavings,
      healthScore,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Simulation API Error:', error);
    return NextResponse.json({ message: "Error running simulation" }, { status: 500 });
  }
}
