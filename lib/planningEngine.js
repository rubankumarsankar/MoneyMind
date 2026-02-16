/**
 * Planning Engine v3 - Future Financial Simulations
 * @module PlanningEngine
 * 
 * Provides what-if scenarios, goal planning, and financial projections
 */

/**
 * Calculate months to reach savings goal
 */
function calculateGoalTimeline(goal, currentSavings, monthlyContribution) {
  if (monthlyContribution <= 0) {
    return { achievable: false, reason: 'No monthly contribution' };
  }

  const remaining = goal - currentSavings;
  if (remaining <= 0) {
    return { achievable: true, monthsRemaining: 0, alreadyAchieved: true };
  }

  const months = Math.ceil(remaining / monthlyContribution);
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);

  return {
    achievable: true,
    monthsRemaining: months,
    targetDate,
    totalContribution: months * monthlyContribution,
    currentProgress: Math.round((currentSavings / goal) * 100),
  };
}

/**
 * Simulate cash flow for next N months
 */
function simulateCashFlow(data, months = 6) {
  const {
    monthlyIncome = 0,
    fixedExpenses = 0,
    averageVariable = 0,
    emiTotal = 0,
    plannedExpenses = [], // { month: 1, amount: 5000, description: 'vacation' }
    expectedIncomeChanges = [], // { month: 3, newIncome: 80000 }
  } = data;

  const simulation = [];
  let runningBalance = 0;
  let currentIncome = monthlyIncome;

  for (let m = 1; m <= months; m++) {
    // Check for income changes
    const incomeChange = expectedIncomeChanges.find(c => c.month === m);
    if (incomeChange) {
      currentIncome = incomeChange.newIncome;
    }

    // Calculate month's expenses
    const plannedForMonth = plannedExpenses
      .filter(p => p.month === m)
      .reduce((sum, p) => sum + p.amount, 0);

    // Apply Overrides if present for this month (index m-1)
    if (data.overrides && data.overrides[m-1]) {
        if (data.overrides[m-1].income !== undefined) currentIncome = Number(data.overrides[m-1].income);
        // If expense override exists, we might need to adjust logic. 
        // For simplicity, let's assume expense override REPLACES variable + fixed + planned, or just variable?
        // Let's assume it replaces the TOTAL monthly expense if provided, or we can have granular overrides.
        // User request: "monthly monthly diffrent comes" -> implies editing the final numbers.
        // I will allow overriding 'totalExpenses' effectively by adjusting the calculation.
        // But better: override 'variable' or 'income'.
        // Let's support: income, expenses.
        // If expenses is overridden, we use that instead of calculated total.
        if (data.overrides[m-1].expenses !== undefined) {
             const overrideExpense = Number(data.overrides[m-1].expenses);
             // We'll treat this as the final total expense for the month
             const totalExpense = overrideExpense; // Overrides everything
             const netFlow = currentIncome - totalExpense;
             runningBalance += netFlow;
             
             simulation.push({
                month: m,
                monthLabel: new Date(Date.now() + m * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
                income: currentIncome,
                expenses: totalExpense,
                planned: 0, // already included in override
                netFlow,
                runningBalance,
                status: netFlow >= 0 ? 'POSITIVE' : 'NEGATIVE',
                isOverridden: true
            });
            continue;
        }
    }

    const totalExpense = fixedExpenses + averageVariable + emiTotal + plannedForMonth;
    const netFlow = currentIncome - totalExpense;
    runningBalance += netFlow;

    simulation.push({
      month: m,
      monthLabel: new Date(Date.now() + m * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      income: currentIncome,
      expenses: totalExpense,
      planned: plannedForMonth,
      netFlow,
      runningBalance,
      status: netFlow >= 0 ? 'POSITIVE' : 'NEGATIVE',
    });
  }

  // Summary
  const negativeMonths = simulation.filter(s => s.status === 'NEGATIVE').length;
  const lowestBalance = Math.min(...simulation.map(s => s.runningBalance));

  return {
    simulation,
    summary: {
      totalMonths: months,
      negativeMonths,
      lowestBalance,
      finalBalance: runningBalance,
      riskLevel: negativeMonths === 0 ? 'LOW' : negativeMonths <= 2 ? 'MEDIUM' : 'HIGH',
    },
  };
}

/**
 * EMI Prepayment Impact Calculator
 */
function calculatePrepaymentImpact(emi, prepaymentAmount) {
  const {
    principal = 0,
    interestRate = 10,
    monthlyAmount = 0,
    remainingMonths = 0,
  } = emi;

  if (prepaymentAmount <= 0 || remainingMonths <= 0) {
    return { impact: 'NONE', reason: 'Invalid prepayment or EMI data' };
  }

  // Simplified calculation (actual would need amortization)
  const monthlyRate = interestRate / 12 / 100;
  const outstandingPrincipal = monthlyAmount * remainingMonths * 0.7; // Rough estimate

  // With prepayment
  const newPrincipal = Math.max(0, outstandingPrincipal - prepaymentAmount);
  const newMonths = newPrincipal > 0 
    ? Math.ceil(newPrincipal / (monthlyAmount * 0.7))
    : 0;

  const monthsSaved = remainingMonths - newMonths;
  const interestSaved = monthsSaved * monthlyAmount * 0.3; // Rough estimate

  return {
    impact: 'CALCULATED',
    originalMonths: remainingMonths,
    newMonths,
    monthsSaved,
    interestSaved: Math.round(interestSaved),
    recommendation: monthsSaved >= 3 
      ? 'Significant savings! Prepayment recommended.'
      : 'Minimal impact. Consider investing instead.',
  };
}

/**
 * Financial Freedom Date Calculator
 */
function calculateFinancialFreedomDate(data) {
  const {
    totalDebt = 0,
    monthlyDebtPayment = 0,
    monthlySavings = 0,
    targetEmergencyFund = 0,
    currentEmergencyFund = 0,
  } = data;

  const results = {};

  // Phase 1: Emergency Fund
  const emergencyGap = targetEmergencyFund - currentEmergencyFund;
  if (emergencyGap > 0 && monthlySavings > 0) {
    results.emergencyFundMonths = Math.ceil(emergencyGap / monthlySavings);
  } else {
    results.emergencyFundMonths = 0;
  }

  // Phase 2: Debt Freedom
  if (totalDebt > 0 && monthlyDebtPayment > 0) {
    results.debtFreeMonths = Math.ceil(totalDebt / monthlyDebtPayment);
  } else {
    results.debtFreeMonths = 0;
  }

  // Total time to financial freedom
  const totalMonths = results.emergencyFundMonths + results.debtFreeMonths;
  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + totalMonths);

  return {
    phases: [
      {
        name: 'Emergency Fund',
        months: results.emergencyFundMonths,
        status: results.emergencyFundMonths === 0 ? 'COMPLETE' : 'PENDING',
      },
      {
        name: 'Debt Freedom',
        months: results.debtFreeMonths,
        status: results.debtFreeMonths === 0 ? 'COMPLETE' : 'PENDING',
      },
    ],
    totalMonths,
    freedomDate,
    yearsToFreedom: (totalMonths / 12).toFixed(1),
    isAlreadyFree: totalMonths === 0,
  };
}

/**
 * What-If Scenario Analysis
 */
function analyzeWhatIf(scenario, currentState) {
  const {
    incomeChange = 0,        // +5000 or -5000
    expenseChange = 0,       // +2000 or -2000
    newEMI = 0,              // New monthly EMI
    lumpSumSavings = 0,      // One-time savings addition
    lumpSumExpense = 0,      // One-time expense
  } = scenario;

  const {
    monthlyIncome = 0,
    monthlyExpenses = 0,
    currentSavings = 0,
    healthScore = 50,
  } = currentState;

  // Calculate new state
  const newIncome = monthlyIncome + incomeChange;
  const newExpenses = monthlyExpenses + expenseChange + newEMI;
  const newMonthlySavings = newIncome - newExpenses;
  const newNetWorth = currentSavings + lumpSumSavings - lumpSumExpense;

  // Impact on health score (simplified)
  let healthImpact = 0;
  const savingsRateChange = (newMonthlySavings / newIncome) - ((monthlyIncome - monthlyExpenses) / monthlyIncome);
  healthImpact += savingsRateChange * 50;

  if (newEMI > 0) {
    const emiRatio = newEMI / newIncome;
    healthImpact -= emiRatio * 30;
  }

  const newHealthScore = Math.max(0, Math.min(100, Math.round(healthScore + healthImpact)));

  return {
    before: {
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      healthScore,
    },
    after: {
      monthlyIncome: newIncome,
      monthlyExpenses: newExpenses,
      monthlySavings: newMonthlySavings,
      healthScore: newHealthScore,
      netWorth: newNetWorth,
    },
    impact: {
      incomeChange: incomeChange,
      expenseChange: expenseChange + newEMI,
      savingsChange: newMonthlySavings - (monthlyIncome - monthlyExpenses),
      healthScoreChange: newHealthScore - healthScore,
      recommendation: getWhatIfRecommendation(newMonthlySavings, newHealthScore, healthScore),
    },
  };
}

function getWhatIfRecommendation(newSavings, newHealth, oldHealth) {
  if (newSavings < 0) {
    return '⛔ This scenario leads to negative cash flow. Not recommended.';
  }
  if (newHealth < oldHealth - 10) {
    return '⚠️ Significant health score drop. Consider alternatives.';
  }
  if (newHealth >= oldHealth) {
    return '✅ This scenario maintains or improves your financial health.';
  }
  return '🔶 Minor impact. Proceed with caution.';
}

/**
 * Stress Test - What if income drops?
 */
function performStressTest(data, incomeDropPercent = 30) {
  const {
    monthlyIncome = 0,
    fixedExpenses = 0,
    variableExpenses = 0,
    emiTotal = 0,
    emergencyFund = 0,
  } = data;

  const reducedIncome = monthlyIncome * (1 - incomeDropPercent / 100);
  const totalExpenses = fixedExpenses + variableExpenses + emiTotal;
  const shortfall = totalExpenses - reducedIncome;

  // How long can emergency fund last?
  const survivalMonths = shortfall > 0 
    ? Math.floor(emergencyFund / shortfall)
    : Infinity;

  // What can be cut?
  const cuttableExpenses = variableExpenses * 0.5; // Assume 50% of variable is discretionary
  const minimumNeeded = fixedExpenses + emiTotal + (variableExpenses * 0.5);
  const canSurvive = reducedIncome >= minimumNeeded;

  return {
    scenario: `${incomeDropPercent}% Income Drop`,
    reducedIncome: Math.round(reducedIncome),
    totalExpenses: Math.round(totalExpenses),
    monthlyShortfall: Math.max(0, Math.round(shortfall)),
    survivalMonths: survivalMonths === Infinity ? 'Indefinite' : survivalMonths,
    minimumExpenses: Math.round(minimumNeeded),
    cuttable: Math.round(cuttableExpenses),
    canSurviveWithCuts: canSurvive,
    riskLevel: survivalMonths >= 6 ? 'LOW' : survivalMonths >= 3 ? 'MEDIUM' : 'HIGH',
    recommendations: generateStressRecommendations(survivalMonths, canSurvive, emergencyFund),
  };
}

function generateStressRecommendations(survivalMonths, canSurvive, emergencyFund) {
  const recs = [];
  
  if (survivalMonths < 3) {
    recs.push('🚨 Build emergency fund to at least 3 months of expenses');
  }
  if (survivalMonths < 6) {
    recs.push('⚠️ Target 6 months of expenses in emergency fund');
  }
  if (!canSurvive) {
    recs.push('💡 Identify discretionary expenses that can be cut in emergency');
  }
  if (emergencyFund === 0) {
    recs.push('🎯 Start emergency fund with ₹1,000 auto-transfer monthly');
  }
  if (recs.length === 0) {
    recs.push('✅ Good stress resilience! Maintain current savings rate.');
  }
  
  return recs;
}

export const PlanningEngine = {
  calculateGoalTimeline,
  simulateCashFlow,
  calculatePrepaymentImpact,
  calculateFinancialFreedomDate,
  analyzeWhatIf,
  performStressTest,
};
