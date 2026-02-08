import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { PlanningEngine } from "@/lib/planningEngine";
import { PredictiveEngine } from "@/lib/predictiveEngine";
import { CreditRiskEngine } from "@/lib/creditRiskEngine";
import { getCurrentCustomMonth, getPreviousCustomMonths } from "@/lib/dateUtils";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const today = new Date();
    const { start: cycleStart, end: cycleEnd } = getCurrentCustomMonth(6);

    // Fetch user data
    const [income, fixed, daily, emis, creditCards, accounts, savings, borrows] = await Promise.all([
      prisma.income.findMany({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.dailyExpense.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 90 }),
      prisma.eMI.findMany({ where: { userId } }),
      prisma.creditCard.findMany({ where: { userId }, include: { spends: true } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.saving.findMany({ where: { userId } }),
      prisma.borrow.findMany({ where: { userId } }),
    ]);

    // Calculate totals
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalFixed = fixed.reduce((sum, f) => sum + f.amount, 0);
    
    // Active EMIs
    const activeEmis = emis.filter(e => {
      const start = new Date(e.startDate);
      const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
      return monthsPassed < e.totalMonths;
    });
    const totalEMI = activeEmis.reduce((sum, e) => sum + e.monthlyAmount, 0);

    // Average variable expenses (last 3 months)
    const avgVariable = daily.length > 0 
      ? daily.reduce((sum, d) => sum + d.amount, 0) / Math.min(3, Math.ceil(daily.length / 30))
      : 0;

    const accountBalances = accounts.reduce((sum, a) => sum + a.balance, 0);
    const currentSavings = savings.reduce((sum, s) => sum + (s.currentAmount || 0), 0);

    // 1. Cash Flow Simulation
    const cashFlow = PlanningEngine.simulateCashFlow({
      monthlyIncome: totalIncome,
      fixedExpenses: totalFixed,
      averageVariable: avgVariable / 30 * 30, // Monthly
      emiTotal: totalEMI,
      plannedExpenses: [],
      expectedIncomeChanges: [],
    }, 6);

    // 2. Goals Timeline
    const monthlySavingsRate = totalIncome - totalFixed - avgVariable - totalEMI;
    const goals = savings.map(goal => ({
      ...goal,
      timeline: PlanningEngine.calculateGoalTimeline(
        goal.targetAmount || 0,
        goal.currentAmount || 0,
        Math.max(0, monthlySavingsRate * 0.5) // Assume 50% goes to this goal
      ),
    }));

    // 3. Financial Freedom Date
    const totalDebt = activeEmis.reduce((sum, e) => {
      const start = new Date(e.startDate);
      const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
      const remaining = Math.max(0, e.totalMonths - monthsPassed);
      return sum + (remaining * e.monthlyAmount);
    }, 0);

    const targetEmergencyFund = (totalFixed + avgVariable + totalEMI) * 6; // 6 months

    const freedomDate = PlanningEngine.calculateFinancialFreedomDate({
      totalDebt,
      monthlyDebtPayment: totalEMI,
      monthlySavings: Math.max(0, monthlySavingsRate),
      targetEmergencyFund,
      currentEmergencyFund: currentSavings,
    });

    // 4. Stress Test
    const stressTest = PlanningEngine.performStressTest({
      monthlyIncome: totalIncome,
      fixedExpenses: totalFixed,
      variableExpenses: avgVariable,
      emiTotal: totalEMI,
      emergencyFund: accountBalances + currentSavings,
    }, 30); // 30% income drop

    // 5. Credit Analysis
    const totalCreditLimit = creditCards.reduce((sum, c) => sum + (c.limit || 0), 0);
    const totalCreditSpent = creditCards.reduce((sum, c) => {
      return sum + c.spends
        .filter(s => s.type !== 'PAYMENT')
        .reduce((s, sp) => s + sp.amount, 0);
    }, 0);

    const creditScore = CreditRiskEngine.calculateCreditScoreProxy({
      paymentHistory: [], // Would need historical data
      creditUtilization: totalCreditLimit > 0 ? (totalCreditSpent / totalCreditLimit) * 100 : 0,
      creditAge: 24, // Default 2 years
      creditMix: creditCards.length,
      recentInquiries: 0,
    });

    const dti = CreditRiskEngine.calculateDTI(totalEMI + totalFixed, totalIncome);

    // 6. Predictions
    const previousMonths = getPreviousCustomMonths(3, 6);
    const monthlyTotals = previousMonths.map(({ start, end }) => {
      return daily
        .filter(e => {
          const ed = new Date(e.date);
          return ed >= start && ed <= end;
        })
        .reduce((sum, e) => sum + e.amount, 0) + totalFixed + totalEMI;
    });

    const prediction = PredictiveEngine.predictNextMonthWithCI(monthlyTotals);

    return NextResponse.json({
      // Core data
      totalIncome,
      totalExpenses: totalFixed + avgVariable + totalEMI,
      monthlySavings: monthlySavingsRate,

      // Planning results
      cashFlow,
      goals,
      freedomDate,
      stressTest,

      // Credit analysis
      creditScore,
      dti,

      // Predictions
      prediction,

      // Current state for what-if
      currentState: {
        monthlyIncome: totalIncome,
        monthlyExpenses: totalFixed + avgVariable + totalEMI,
        currentSavings: accountBalances + currentSavings,
        healthScore: 50, // Placeholder
      },
    });

  } catch (error) {
    console.error('Planning API Error:', error);
    return NextResponse.json({ message: "Error fetching planning data" }, { status: 500 });
  }
}
