import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlanningEngine } from "@/lib/planningEngine";
import { PredictiveEngine } from "@/lib/predictiveEngine";
import { CreditRiskEngine } from "@/lib/creditRiskEngine";
import { FinanceEngine } from "@/lib/finance";
import { getCurrentCustomMonth, getPreviousCustomMonths } from "@/lib/dateUtils";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const simulationMonths = parseInt(searchParams.get('months')) || 6;

  try {
    const today = new Date();
    
    // Calculate date ranges for averages (Last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    threeMonthsAgo.setDate(1); // Start of that month

    // Fetch user data
    const [income, fixed, daily, emis, creditCards, accounts, savings, borrows] = await Promise.all([
      // Fetch income for last 3 months to get an average, NOT all time
      prisma.income.findMany({ 
        where: { 
            userId,
            date: { gte: threeMonthsAgo } 
        } 
      }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      // Fetch daily expenses for last 3 months
      prisma.dailyExpense.findMany({ 
        where: { 
            userId, 
            date: { gte: threeMonthsAgo }
        }, 
        orderBy: { date: 'desc' } 
      }),
      prisma.eMI.findMany({ where: { userId } }),
      prisma.creditCard.findMany({ where: { userId }, include: { spends: true } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.saving.findMany({ where: { userId } }),
      prisma.borrow.findMany({ where: { userId } }),
    ]);

    // --- FIX 1: Income Calculation (Average of last 3 months) ---
    // If no recent income, fallback to 0 or fetch all time? Let's stick to recent for accuracy or all time if 0.
    // Actually, let's fetch all if recent is 0? For now, let's calculate average based on the window.
    // If we fetched 3 months of data, divide total by 3.
    const totalRecentIncome = income.reduce((sum, i) => sum + i.amount, 0);
    // Determine how many months of data we actually have or just divide by 3 for smoothing
    const monthlyIncome = totalRecentIncome > 0 ? (totalRecentIncome / 3) : 0; 

    // --- FIX 2: Fixed Expenses ---
    const totalFixed = fixed.reduce((sum, f) => sum + f.amount, 0);
    
    // --- FIX 3: Variable Expenses (Monthly Average) ---
    // Group daily expenses by month to get true monthly average
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

    // 1. Cash Flow Simulation (Dynamic Duration)
    const cashFlow = PlanningEngine.simulateCashFlow({
      monthlyIncome, // Use calculated average
      fixedExpenses: totalFixed,
      averageVariable: avgVariable,
      emiTotal: totalEMI,
      plannedExpenses: [],
      expectedIncomeChanges: [],
    }, simulationMonths); // Pass dynamic months

    // 2. Goals Timeline
    const monthlySavingsRate = monthlyIncome - totalFixed - avgVariable - totalEMI;
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
      monthlyIncome,
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

    // Identify Account Mix
    const accountMix = [];
    if (creditCards.length > 0) accountMix.push('CC');
    // Check local logic or categorize loans if you had a category field, 
    // for now treat EMIs as generic loans, maybe separate if large amount imply secured? 
    // Let's assume > 5L is secured (Home/Auto) for proxy
    emis.forEach(e => {
        if (e.totalAmount > 500000) accountMix.push('LOAN_SECURED');
        else accountMix.push('LOAN_UNSECURED');
    });

    const creditScore = CreditRiskEngine.calculateCreditScoreProxy({
      paymentHistory: [], // Would need historical data
      creditUtilization: totalCreditLimit > 0 ? (totalCreditSpent / totalCreditLimit) * 100 : 0,
      creditAge: 24, // Default 2 years
      creditMix: accountMix.length,
      accountMix, // Pass the detailed mix
      recentInquiries: 0,
    });

    const dti = CreditRiskEngine.calculateDTI(totalEMI + totalFixed, monthlyIncome);

    // 6. Predictions & Anomalies
    const previousMonths = getPreviousCustomMonths(6, 6); // Fetch 6 months for trends
    const monthlyTotals = previousMonths.map(({ start, end }) => {
      return daily
        .filter(e => {
          const ed = new Date(e.date);
          return ed >= start && ed <= end;
        })
        .reduce((sum, e) => sum + e.amount, 0) + totalFixed + totalEMI;
    });

    const prediction = PredictiveEngine.predictNextMonthWithCI(monthlyTotals);

    // 7. Anomaly Detection
    // Prepare data: Current month expenses vs history
    // Current month expenses (approximate from daily for this month)
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthExpenses = daily.filter(d => d.date >= currentMonthStart);
    
    // Historical expenses (flat list of older daily expenses)
    const historyExpenses = daily.filter(d => d.date < currentMonthStart);

    // Import FinanceEngine if not already imported (it wasn't in original file, need to add import)
    // Assuming we can add import at top, but for now let's check if we can use it.
    // Wait, I need to check imports.
    // FinanceEngine is NOT imported in the original file view. I need to add it.
    // For now, let's add the logic here.
    
    // Actually, I should have checked imports.
    // I will add the call here and then add the import in a separate edit or same if possible.
    // Let's assume I'll add the import in a subsequent step or previous.
    // Wait, I can't add import in this block.
    // I'll add the logic, and checking the file again, I need to add `import { FinanceEngine } from "@/lib/finance";`
    
    // Let's use a dynamic import or just fail and fix.
    // Better: I will use `PlanningEngine` or passed engines.
    // Actually, `detectExpenseLeaks` is in `FinanceEngine`.
    
    // Let's simplify this block to just the prediction part and add anomalies variable.
    // I'll add the import in a separate tool call to be safe.
    
    // ... logic ...
    const anomalies = FinanceEngine.detectExpenseLeaks(currentMonthExpenses, historyExpenses);

    return NextResponse.json({
      // Core data
      totalIncome: monthlyIncome, // Return Average
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

      // Predictions & Anomalies
      prediction,
      anomalies,

      // Current state for what-if
      currentState: {
        monthlyIncome,
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
