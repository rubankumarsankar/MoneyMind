import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { FinanceEngine } from "@/lib/finance";
import { BudgetEngine } from "@/lib/budgetEngine";
import { NotificationsEngine } from "@/lib/notifications";
import { getCurrentCustomMonth, getDaysLeftInCycle, getPreviousCustomMonths } from "@/lib/dateUtils";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    // Get custom month range (6th to 5th)
    const { start: cycleStart, end: cycleEnd, label: cycleLabel } = getCurrentCustomMonth(6);
    const daysLeft = getDaysLeftInCycle(6);
    const daysElapsed = 30 - daysLeft;

    const [income, fixed, daily, emis, creditCards, accounts, savingsGoals, borrows] = await Promise.all([
      prisma.income.findMany({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.dailyExpense.findMany({ 
          where: { 
              userId,
              date: { gte: threeMonthsAgo }
          } 
      }),
      prisma.eMI.findMany({ where: { userId } }),
      prisma.creditCard.findMany({ where: { userId }, include: { spends: true } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.saving.findMany({ where: { userId } }),
      prisma.borrow.findMany({ where: { userId } }),
    ]);

    // --- 1. Current Custom Month Context ---
    const totalIncome = income.reduce((acc, curr) => acc + curr.amount, 0);

    const currentMonthDaily = daily.filter(d => {
        const dDate = new Date(d.date);
        return dDate >= cycleStart && dDate <= cycleEnd;
    });

    const totalFixed = fixed.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDaily = currentMonthDaily.reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalEMI = emis.reduce((acc, curr) => {
        const start = new Date(curr.startDate);
        const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
        if (monthsPassed >= 0 && monthsPassed < curr.totalMonths) {
            return acc + curr.monthlyAmount;
        }
        return acc;
    }, 0);

    let totalCreditLimit = 0;
    const currentMonthCCSpends = creditCards.reduce((acc, card) => {
        totalCreditLimit += card.limit || 0;
        const monthlySpends = card.spends
           .filter(s => s.type !== 'PAYMENT')
           .filter(s => !s.dailyExpenseId)
           .filter(s => {
              const d = new Date(s.date);
              return d >= cycleStart && d <= cycleEnd;
           })
           .reduce((sum, s) => sum + s.amount, 0);
        return acc + monthlySpends;
    }, 0);

    // --- 2. V3 Engine Calculations ---

    // A. Enhanced Health Score with v3 features
    const healthEngine = FinanceEngine.calculateFinancialHealth(
        totalIncome,
        [{ amount: totalFixed }], 
        currentMonthDaily,  // Pass full array for velocity calc
        [{ monthlyAmount: totalEMI }],
        [{ amount: currentMonthCCSpends }],
        borrows,
        totalCreditLimit,
        { daysElapsed, daysInMonth: 30 }
    );

    // B. Expense Leak Detection
    const expenseLeaks = FinanceEngine.detectExpenseLeaks(currentMonthDaily, daily);

    // C. EMI Optimization
    const emiOptimization = FinanceEngine.optimizeEMIs(emis);

    // D. Prediction with Trend & Confidence
    const previousMonths = getPreviousCustomMonths(3, 6);
    const last3MonthsTotals = previousMonths.map(({ start, end }) => {
        const mDaily = daily
            .filter(e => {
                const ed = new Date(e.date);
                return ed >= start && ed <= end;
            })
            .reduce((sum, e) => sum + e.amount, 0);
        return mDaily + totalFixed + totalEMI;
    });
    const prediction = FinanceEngine.predictNextMonth(last3MonthsTotals);

    // E. Safe to Spend v3
    const totalCommitted = totalFixed + totalEMI + currentMonthCCSpends;
    const safeToSpend = FinanceEngine.calculateSafeToSpend(totalIncome, totalCommitted + totalDaily, daysLeft);

    // F. Budget Analysis (50-30-20 Rule)
    const budgetAnalysis = BudgetEngine.analyzeSpendingRule(
        totalIncome,
        totalFixed + totalEMI,
        totalDaily + currentMonthCCSpends,
        healthEngine.savings
    );

    // G. Category Trends
    const categoryBreakdown = {};
    currentMonthDaily.forEach(e => {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    // H. Credit Card Risk
    const ccRisk = FinanceEngine.calculateCreditRisk(totalCreditLimit, currentMonthCCSpends);

    // ===== V2 ENGINE INTEGRATIONS =====

    // V2-A. Multi-dimensional Health Score
    const healthDimensions = FinanceEngine.calculateHealthDimensions({
      totalIncome,
      totalExpenses: healthEngine.totalExpense,
      fixedExpenses: totalFixed,
      variableExpenses: totalDaily,
      emiTotal: totalEMI,
      creditCardSpent: currentMonthCCSpends,
      creditLimit: totalCreditLimit,
      accountBalances: accounts.reduce((sum, a) => sum + a.balance, 0),
      savingsTotal: savingsGoals.reduce((sum, s) => sum + s.currentAmount, 0),
      budgets: await prisma.budget.findMany({ where: { userId } }),
      actualSpending: categoryBreakdown,
    });

    // V2-B. Financial Stress Detection
    const stressAnalysis = FinanceEngine.detectFinancialStress({
      totalIncome,
      totalExpenses: healthEngine.totalExpense,
      accountBalances: accounts.reduce((sum, a) => sum + a.balance, 0),
      emiTotal: totalEMI,
      creditCardSpent: currentMonthCCSpends,
      pendingBorrows: borrows.filter(b => b.type === 'TOOK' && b.status === 'PENDING')
        .reduce((sum, b) => sum + b.amount, 0),
      dailyVelocity: healthEngine.dailyVelocity,
      daysLeft,
    });

    // V2-C. Category Trend Signals
    const trendSignals = FinanceEngine.generateTrendSignals(daily);

    // V2-D. Dynamic Budget Suggestions (from BudgetEngine v2)
    const budgetSuggestions = BudgetEngine.suggestDynamicBudgets(userId, 
      previousMonths.map(({ start, end }) => ({
        month: start.toISOString().slice(0, 7),
        expenses: daily.filter(e => {
          const ed = new Date(e.date);
          return ed >= start && ed <= end;
        }),
      }))
    );

    // V2-E. Context-Aware Notifications
    const contextualNotifications = NotificationsEngine.generateContextualNotifications({
      healthScore: healthEngine.healthScore,
      healthDimensions: healthDimensions.dimensions,
      stressSignals: stressAnalysis.signals,
      budgetStatuses: [],
      categoryTrends: trendSignals.reduce((acc, t) => {
        acc[t.category] = { direction: t.trend, changePercent: t.changePercent };
        return acc;
      }, {}),
      daysLeft,
      dailyVelocity: healthEngine.dailyVelocity,
      totalIncome,
      projectedMonthEnd: healthEngine.projectedMonthEnd,
      fixedExpenses: fixed,
    });

    // Merge v1 and v2 notifications, prioritize v2
    const allNotifications = [
      ...contextualNotifications,
      ...NotificationsEngine.generateNotifications({
        healthScore: healthEngine.healthScore,
        daysLeft,
        creditCards: creditCards.map(c => ({ ...c, dueDate: c.billingDate })),
        emis,
        budgetAlerts: [],
        savings: healthEngine.savings,
        savingsGoal: savingsGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0),
      }),
    ];
    
    // Batch and dedupe notifications
    const batchedNotifications = NotificationsEngine.batchNotifications(
      allNotifications.filter((n, i, arr) => 
        arr.findIndex(x => x.id === n.id) === i
      )
    );
    // Calculate total debt and payoff timeline
    const activeEmis = emis.filter(e => {
        const start = new Date(e.startDate);
        const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
        return monthsPassed < e.totalMonths;
    });
    
    const totalEMIDebt = activeEmis.reduce((sum, e) => {
        const start = new Date(e.startDate);
        const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
        const remainingMonths = Math.max(0, e.totalMonths - monthsPassed);
        return sum + (remainingMonths * e.monthlyAmount);
    }, 0);
    
    const totalCCDebt = creditCards.reduce((sum, card) => {
        const totalSpends = card.spends.filter(s => s.type !== 'PAYMENT').reduce((s, sp) => s + sp.amount, 0);
        const totalPayments = card.spends.filter(s => s.type === 'PAYMENT').reduce((s, sp) => s + sp.amount, 0);
        return sum + Math.max(0, totalSpends - totalPayments);
    }, 0);
    
    const totalDebt = totalEMIDebt + totalCCDebt;
    const monthlyEMIPayments = activeEmis.reduce((sum, e) => sum + e.monthlyAmount, 0);
    
    // EMI Payoff Strategy (Avalanche - highest rate first OR Snowball - lowest balance first)
    const emiPayoffStrategy = activeEmis.map(e => {
        const start = new Date(e.startDate);
        const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
        const remainingMonths = Math.max(0, e.totalMonths - monthsPassed);
        const remainingAmount = remainingMonths * e.monthlyAmount;
        const estimatedEndDate = new Date();
        estimatedEndDate.setMonth(estimatedEndDate.getMonth() + remainingMonths);
        
        return {
            id: e.id,
            name: e.name,
            monthlyAmount: e.monthlyAmount,
            remainingMonths,
            remainingAmount,
            interestRate: e.interestRate || 10,
            estimatedEndDate,
            priority: (e.interestRate || 10) * (1 / (remainingAmount || 1)) // Higher rate + lower balance = higher priority
        };
    }).sort((a, b) => b.priority - a.priority);
    
    const freedomRoadmap = {
        totalDebt,
        totalEMIDebt,
        totalCCDebt,
        monthlyDebtPayments: monthlyEMIPayments,
        debtFreeDate: emiPayoffStrategy.length > 0 
            ? emiPayoffStrategy.reduce((latest, e) => e.estimatedEndDate > latest ? e.estimatedEndDate : latest, new Date())
            : null,
        emiPayoffOrder: emiPayoffStrategy,
        monthlyFreeCash: healthEngine.savings,
        acceleratedPayoff: healthEngine.savings > 0 ? {
            extraPerMonth: Math.round(healthEngine.savings * 0.5),
            monthsSaved: Math.round((totalEMIDebt * 0.1) / (healthEngine.savings * 0.5)) || 0
        } : null
    };

    // J. Enhanced 50/30/20 Analysis
    const rule503020 = {
        needs: {
            target: totalIncome * 0.5,
            actual: totalFixed + totalEMI,
            percentage: totalIncome > 0 ? ((totalFixed + totalEMI) / totalIncome) * 100 : 0,
            status: (totalFixed + totalEMI) <= totalIncome * 0.5 ? 'OK' : 'OVER',
            label: 'Needs (50%)',
            description: 'Fixed expenses, EMIs, rent, utilities'
        },
        wants: {
            target: totalIncome * 0.3,
            actual: totalDaily + currentMonthCCSpends,
            percentage: totalIncome > 0 ? ((totalDaily + currentMonthCCSpends) / totalIncome) * 100 : 0,
            status: (totalDaily + currentMonthCCSpends) <= totalIncome * 0.3 ? 'OK' : 'OVER',
            label: 'Wants (30%)',
            description: 'Shopping, entertainment, dining out'
        },
        savings: {
            target: totalIncome * 0.2,
            actual: healthEngine.savings,
            percentage: totalIncome > 0 ? (healthEngine.savings / totalIncome) * 100 : 0,
            status: healthEngine.savings >= totalIncome * 0.2 ? 'OK' : 'UNDER',
            label: 'Savings (20%)',
            description: 'Emergency fund, investments, goals'
        }
    };

    // K. Smart Notifications - MOVED TO V2 SECTION ABOVE (lines 176-206)

    // --- 3. Final Response ---
    const totalAssets = accounts.reduce((acc, curr) => acc + curr.balance, 0);

    const recentActivity = [
        ...currentMonthDaily.map(d => ({ ...d, type: 'EXPENSE' })),
        ...income.map(i => ({ ...i, type: 'INCOME', category: i.source }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))
     .slice(0, 8);

    return NextResponse.json({
        // Core Metrics
        totalIncome,
        totalExpense: healthEngine.totalExpense,
        breakdown: healthEngine.breakdown,
        savings: healthEngine.savings,
        savingsPercent: healthEngine.savingsPercentage,
        
        // V3 Health & Risk
        healthScore: healthEngine.healthScore,
        riskLevel: healthEngine.riskLevel,
        suggestions: healthEngine.suggestions,
        
        // ===== V2 ADDITIONS =====
        // Multi-dimensional Health Score
        healthDimensions: healthDimensions.dimensions,
        overallHealthScore: healthDimensions.overallScore,
        
        // Financial Stress Analysis
        stressLevel: stressAnalysis.stressLevel,
        stressSignals: stressAnalysis.signals,
        isFinanciallyStressed: stressAnalysis.isStressed,
        
        // Category Trend Signals
        trendSignals,
        
        // Dynamic Budget Suggestions
        budgetSuggestions,
        // ===== END V2 ADDITIONS =====
        
        // V3 Velocity & Projections
        dailyVelocity: healthEngine.dailyVelocity,
        projectedMonthEnd: healthEngine.projectedMonthEnd,
        safeToSpend,
        
        // V3 Analytics
        prediction,
        expenseLeaks,
        budgetAnalysis,
        categoryBreakdown,
        ccRisk,
        emiOptimization,
        
        // V4 Financial Freedom
        freedomRoadmap,
        rule503020,
        
        // V2 Enhanced Notifications (replaces v1)
        notifications: batchedNotifications.slice(0, 8),
        
        // Cycle Info
        cycleLabel,
        daysLeft,
        daysElapsed,
        
        // Assets & Activity
        recentTransactions: recentActivity,
        totalAssets,
        savingsGoals
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error aggregating data" }, { status: 500 });
  }
}


