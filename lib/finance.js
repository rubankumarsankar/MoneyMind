/**
 * Finance Engine v3 - Advanced Predictive Analytics
 * @module FinanceEngine
 */

/**
 * Safely sums an array of objects by a given key.
 */
const safeSum = (arr, key) => {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((acc, curr) => acc + (parseFloat(curr?.[key]) || 0), 0);
};

/**
 * Exponential Weighted Moving Average for better predictions
 */
const calculateEWMA = (values, alpha = 0.3) => {
  if (!values.length) return 0;
  let ewma = values[0];
  for (let i = 1; i < values.length; i++) {
    ewma = alpha * values[i] + (1 - alpha) * ewma;
  }
  return Math.round(ewma);
};

/**
 * Detect trend direction from values
 */
const detectTrend = (values) => {
  if (values.length < 2) return { direction: 'STABLE', change: 0 };
  
  const recent = values.slice(-3);
  if (recent.length < 2) return { direction: 'STABLE', change: 0 };
  
  const first = recent[0];
  const last = recent[recent.length - 1];
  const change = first > 0 ? ((last - first) / first) * 100 : 0;
  
  let direction = 'STABLE';
  if (change > 10) direction = 'INCREASING';
  else if (change < -10) direction = 'DECREASING';
  
  return { direction, change: Math.round(change) };
};

/**
 * Calculate spending velocity (daily average spend rate)
 */
const calculateSpendingVelocity = (expenses, daysElapsed) => {
  if (!daysElapsed || daysElapsed <= 0) return 0;
  const total = safeSum(expenses, 'amount');
  return Math.round(total / daysElapsed);
};

export const FinanceEngine = {
  /**
   * Main Financial Health Calculator - Enhanced v3
   */
  calculateFinancialHealth: (
    income,
    fixedExpenses,
    variableExpenses,
    emis,
    creditCardSpends,
    borrows = [],
    creditLimit = 0,
    options = {}
  ) => {
    const totalIncome = parseFloat(income) || 0;
    const { daysElapsed = 15, daysInMonth = 30 } = options;

    // Calculate breakdown
    const totalFixed = safeSum(fixedExpenses, 'amount');
    const totalVariable = safeSum(variableExpenses, 'amount');
    const totalEMI = safeSum(emis, 'monthlyAmount');
    const totalCC = safeSum(creditCardSpends, 'amount');
    const totalExpense = totalFixed + totalVariable + totalEMI + totalCC;
    const savings = totalIncome - totalExpense;
    const savingsPercentage = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Spending velocity
    const dailyVelocity = calculateSpendingVelocity(variableExpenses, daysElapsed);
    const projectedMonthEnd = totalFixed + totalEMI + (dailyVelocity * daysInMonth) + totalCC;

    // --- ENHANCED SCORE ALGORITHM V3 ---
    let healthScore = 100;

    // Factor 1: EMI Burden (Quadratic Penalty)
    // 0-30% = Low penalty, >30% = Sharply increasing penalty
    const emiRatio = totalIncome > 0 ? totalEMI / totalIncome : 1;
    if (emiRatio > 0.3) {
        // Penalty accelerates: 30% -> 0pts, 50% -> 30pts, 70% -> 80pts
        const excess = emiRatio - 0.3;
        healthScore -= Math.min(60, Math.pow(excess * 10, 2) * 1.5); 
    }

    // Factor 2: Variable Expense Control
    const variableRatio = totalIncome > 0 ? totalVariable / totalIncome : 1;
    healthScore -= Math.min(variableRatio * 40, 20); // Linear up to 20pts

    // Factor 3: Borrow Risk
    const totalToPay = Array.isArray(borrows)
      ? borrows
          .filter((b) => b?.type === 'TOOK' && b?.status === 'PENDING')
          .reduce((sum, b) => sum + (parseFloat(b?.amount) || 0), 0)
      : 0;
    const borrowRatio = totalIncome > 0 ? totalToPay / totalIncome : 0;
    healthScore -= borrowRatio > 0.2 ? 15 : borrowRatio * 60;

    // Factor 4: Savings Buffer (Bonus for hitting targets)
    if (savingsPercentage < 10) healthScore -= 20; // Heavy penalty for low savings
    else if (savingsPercentage >= 20) healthScore += 5; // Bonus
    else if (savingsPercentage >= 30) healthScore += 10; // Extra Bonus

    // Factor 5: Credit Card Utilization (Exponential Penalty)
    if (creditLimit > 0) {
      const ccUtilization = totalCC / creditLimit;
      if (ccUtilization > 0.3) {
          // 30% -> 0, 50% -> 10, 80% -> 40, 100% -> 80
          const excess = ccUtilization - 0.3;
          healthScore -= Math.min(50, Math.pow(excess * 10, 1.8));
      }
    }

    // Factor 6: Spending Velocity Risk
    const velocityProjection = dailyVelocity * daysInMonth;
    const velocityRatio = totalIncome > 0 ? velocityProjection / totalIncome : 0;
    if (velocityRatio > 0.6) healthScore -= 10;

    // Clamp Score
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    // Determine Risk Level
    let riskLevel = 'CRITICAL';
    if (healthScore >= 80) riskLevel = 'EXCELLENT';
    else if (healthScore >= 65) riskLevel = 'GOOD';
    else if (healthScore >= 50) riskLevel = 'STABLE';
    else if (healthScore >= 35) riskLevel = 'WARNING';

    // --- SMART SUGGESTIONS ---
    const suggestions = [];

    if (totalExpense > totalIncome) {
      suggestions.push({
        type: 'CRITICAL',
        icon: '🚨',
        message: 'Expenses exceed income! Immediate action needed.',
        action: 'Reduce variable spending by ₹' + Math.round(totalExpense - totalIncome).toLocaleString(),
        priority: 1,
      });
    }

    if (projectedMonthEnd > totalIncome * 0.95) {
      suggestions.push({
        type: 'WARNING',
        icon: '⚠️',
        message: `At current rate, you'll spend ₹${projectedMonthEnd.toLocaleString()} this month.`,
        action: `Reduce daily spending to ₹${Math.round((totalIncome - totalFixed - totalEMI - totalCC) / (daysInMonth - daysElapsed))}`,
        priority: 2,
      });
    }

    if (emiRatio > 0.4) {
      suggestions.push({
        type: 'WARNING',
        icon: '📊',
        message: `EMIs consuming ${(emiRatio * 100).toFixed(0)}% of income.`,
        action: 'Consider prepaying smallest loan to free up cash flow.',
        priority: 3,
      });
    }

    if (creditLimit > 0 && totalCC / creditLimit > 0.5) {
      suggestions.push({
        type: 'WARNING',
        icon: '💳',
        message: `Credit card at ${((totalCC / creditLimit) * 100).toFixed(0)}% utilization.`,
        action: 'Pay down CC balance to below 30% for better credit score.',
        priority: 3,
      });
    }

    if (savingsPercentage < 20 && savingsPercentage >= 0) {
      suggestions.push({
        type: 'TIP',
        icon: '💡',
        message: `Savings at ${savingsPercentage.toFixed(0)}%. Target: 20-30%.`,
        action: 'Set up auto-transfer of ₹' + Math.round(totalIncome * 0.1).toLocaleString() + ' to savings.',
        priority: 4,
      });
    }

    if (healthScore >= 80 && suggestions.length === 0) {
      suggestions.push({
        type: 'SUCCESS',
        icon: '🎉',
        message: 'Excellent financial health!',
        action: 'Consider investing your surplus for long-term growth.',
        priority: 5,
      });
    }

    // Budget Analysis (50-30-20 Rule)
    const needsTarget = totalIncome * 0.5;
    const wantsTarget = totalIncome * 0.3;
    const savingsTarget = totalIncome * 0.2;
    
    const budgetAnalysis = {
      needs: { target: needsTarget, actual: totalFixed + totalEMI, status: 'OK' },
      wants: { target: wantsTarget, actual: totalVariable + totalCC, status: 'OK' },
      savings: { target: savingsTarget, actual: savings, status: 'OK' },
    };
    
    if (budgetAnalysis.needs.actual > needsTarget) budgetAnalysis.needs.status = 'OVER';
    if (budgetAnalysis.wants.actual > wantsTarget) budgetAnalysis.wants.status = 'OVER';
    if (budgetAnalysis.savings.actual < savingsTarget) budgetAnalysis.savings.status = 'UNDER';

    return {
      totalIncome,
      totalExpense,
      breakdown: {
        fixed: totalFixed,
        variable: totalVariable,
        daily: totalVariable,
        emi: totalEMI,
        cc: totalCC,
        cc_spends: totalCC,
      },
      savings,
      savingsPercentage: savingsPercentage.toFixed(1),
      healthScore,
      riskLevel,
      // New v3 fields
      dailyVelocity,
      projectedMonthEnd,
      budgetAnalysis,
      suggestions: suggestions.sort((a, b) => a.priority - b.priority),
    };
  },

  /**
   * Enhanced Expense Leak Detection with Trend Analysis
   */
  /**
   * Enhanced Expense Leak Detection with IQR (Interquartile Range)
   * Robust to outliers and detects genuine anomalies
   */
  detectExpenseLeaks: (currentMonthExpenses, historyExpenses) => {
    if (!Array.isArray(currentMonthExpenses) || !Array.isArray(historyExpenses)) {
      return [];
    }

    const currentMap = {};
    currentMonthExpenses.forEach((e) => {
      if (e?.category && e?.amount) {
        currentMap[e.category] = (currentMap[e.category] || 0) + e.amount;
      }
    });

    // Group historical expenses by category and then by month to get a distribution
    const historyByCategory = {};
    historyExpenses.forEach((e) => {
      if (e?.category && e?.amount) {
        if (!historyByCategory[e.category]) historyByCategory[e.category] = [];
        // Ideally we should group by month, for now assume the input is a flat list of monthly totals or daily expenses
        // Let's assume input is daily expenses for last X months.
        historyByCategory[e.category].push(e.amount);
      }
    });

    const anomalies = [];

    Object.keys(currentMap).forEach((cat) => {
      const currentVal = currentMap[cat];
      const values = historyByCategory[cat] || [];
      
      if (values.length < 5) {
        // Fallback to simple average if not enough data points
        const total = values.reduce((a, b) => a + b, 0);
        const avg = total / (values.length || 1);
        if (values.length > 0 && currentVal > avg * 1.5 && currentVal - avg > 500) {
           anomalies.push({
            category: cat,
            current: currentVal,
            average: Math.round(avg),
            percentChange: ((currentVal - avg) / avg * 100).toFixed(0),
            severity: 'MEDIUM',
            message: `${cat} spending is higher than average (Limited history)`,
          });
        }
        return;
      }

      // IQR Calculation
      values.sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const upperFence = q3 + 1.5 * iqr;
      
      // We also want to check against the median to ensure it's actually an increase
      const median = values[Math.floor(values.length / 2)];

      if (currentVal > upperFence && currentVal > median * 1.2) {
        const increasePercent = median > 0 ? ((currentVal - median) / median) * 100 : 100;
        anomalies.push({
          category: cat,
          current: currentVal,
          median: Math.round(median),
          threshold: Math.round(upperFence),
          percentChange: increasePercent.toFixed(0),
          severity: currentVal > upperFence * 1.5 ? 'HIGH' : 'MEDIUM',
          message: `${cat} spending detected as anomaly (IQR Method). ₹${currentVal.toLocaleString()} vs typical ₹${Math.round(median).toLocaleString()}`,
        });
      }
    });

    return anomalies.sort((a, b) => (b.current - b.median) - (a.current - a.median));
  },

  /**
   * EMI Optimization with Prepayment Calculator
   */
  optimizeEMIs: (emis) => {
    if (!Array.isArray(emis) || emis.length === 0) return null;

    const analyzed = emis.map((e) => {
      const rate = e.interestRate || 12;
      const remaining = e.remainingAmount || e.totalAmount;
      const monthly = e.monthlyAmount || 0;
      const monthsLeft = remaining > 0 && monthly > 0 ? Math.ceil(remaining / monthly) : 0;
      
      // Calculate interest that can be saved by prepaying
      const interestSavable = remaining * (rate / 100) * (monthsLeft / 12) * 0.5;
      
      return {
        ...e,
        remainingAmount: remaining,
        monthsLeft,
        interestSavable: Math.round(interestSavable),
        priority: rate * (monthly / (remaining || 1)),
      };
    }).sort((a, b) => b.priority - a.priority);

    const topPriority = analyzed[0];
    const totalMonthly = safeSum(emis, 'monthlyAmount');
    const totalRemaining = analyzed.reduce((sum, e) => sum + (e.remainingAmount || 0), 0);

    return {
      recommendedId: topPriority.id,
      name: topPriority.name || 'EMI',
      reason: topPriority.interestRate
        ? `Highest interest (${topPriority.interestRate}%). Save ₹${topPriority.interestSavable.toLocaleString()} by prepaying.`
        : 'Lowest balance. Close quickly to free cash flow.',
      summary: {
        totalMonthly,
        totalRemaining,
        count: emis.length,
        priorityOrder: analyzed.map(e => ({ name: e.name, rate: e.interestRate })),
      },
    };
  },

  /**
   * Generate Amortization Schedule
   */
  /**
   * Calculate Interest Rate from EMI (Newton-Raphson or Binary Search)
   * Finds r such that: E = P * r * (1+r)^n / ((1+r)^n - 1)
   */
  calculateInterestRate: (principal, emi, months) => {
    const p = parseFloat(principal);
    const e = parseFloat(emi);
    const n = parseInt(months);

    if (!p || !e || !n || p <= 0 || e <= 0 || n <= 0) return 0;

    // Binary Search for Rate (Monthly)
    let low = 0;
    let high = 1; // 100% monthly interest is high enough upper bound
    let guess = 0;
    
    // Tolerance for EMI difference
    const tolerance = 0.001; 
    
    for (let i = 0; i < 50; i++) { // Max 50 iterations
        const mid = (low + high) / 2;
        if (mid === 0) { low = 0.0000001; continue; }
        
        // Calculate EMI for this monthly rate 'mid'
        const calcEmi = (p * mid * Math.pow(1 + mid, n)) / (Math.pow(1 + mid, n) - 1);
        
        if (Math.abs(calcEmi - e) < tolerance) {
            guess = mid;
            break;
        }
        
        if (calcEmi > e) {
            high = mid;
        } else {
            low = mid;
        }
        guess = mid;
    }

    // Convert monthly rate to annual percentage
    return parseFloat((guess * 12 * 100).toFixed(2));
  },

  /**
   * Calculate EMI Amount (Standard Reducing Balance Formula)
   * E = P * r * (1+r)^n / ((1+r)^n - 1)
   */
  calculateEMI: (principal, rate, months) => {
    const p = parseFloat(principal);
    const r = (parseFloat(rate) / 12) / 100;
    const n = parseInt(months);

    if (!p || !n) return 0;
    if (!r || r <= 0) return Math.round(p / n);

    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  },

  /**
   * Generate Amortization Schedule
   * Handles both reducing-balance (when rate is known) and flat-rate (when EMI is provided but rate is inferred)
   */
  calculateAmortizationSchedule: (principal, rate, months, startDate, monthlyAmount = null) => {
    const p = parseFloat(principal) || 0;
    const n = parseInt(months) || 0;
    const start = new Date(startDate);
    
    // Determine if we're using user-provided EMI or calculating from rate
    let emi = monthlyAmount ? parseFloat(monthlyAmount) : 0;
    let r = (parseFloat(rate) || 0) / 12 / 100; // Monthly rate
    
    // Case 1: User provided EMI (most common for real-world loans)
    // We'll use their EMI, infer the rate, and calculate an accurate amortization
    if (emi > 0 && p > 0 && n > 0) {
        // Total interest is simply (EMI * months) - Principal
        const totalPaid = emi * n;
        const totalInterest = totalPaid - p;
        
        // If we don't have a rate, infer one for amortization simulation
        if (r <= 0) {
            // Binary search for the monthly rate
            let low = 0.0001;
            let high = 0.1; // 10% monthly = 120% annual
            for (let iter = 0; iter < 50; iter++) {
                const mid = (low + high) / 2;
                const calcEmi = (p * mid * Math.pow(1 + mid, n)) / (Math.pow(1 + mid, n) - 1);
                if (Math.abs(calcEmi - emi) < 1) break;
                if (calcEmi > emi) high = mid;
                else low = mid;
            }
            r = (low + high) / 2;
        }
        
        // Generate schedule using reducing-balance with inferred/given rate
        const schedule = [];
        let balance = p;
        let calculatedInterest = 0;

        for (let i = 1; i <= n; i++) {
            let interestForMonth = balance * r;
            let principalForMonth = emi - interestForMonth;
            
            // Last month adjustment
            if (i === n) {
                principalForMonth = balance;
                interestForMonth = emi - principalForMonth;
                if (interestForMonth < 0) interestForMonth = 0;
            }
            
            // Prevent negative principal
            if (principalForMonth < 0) principalForMonth = 0;

            balance -= principalForMonth;
            if (balance < 0) balance = 0;
            
            calculatedInterest += interestForMonth;
            
            const paymentDate = new Date(start);
            paymentDate.setMonth(start.getMonth() + i);

            schedule.push({
                month: i,
                date: paymentDate,
                emi: emi,
                interest: interestForMonth,
                principal: principalForMonth,
                balance: balance
            });

            if (balance === 0 && i < n) break;
        }

        return {
            schedule,
            totalInterest: calculatedInterest,
            totalPayment: p + calculatedInterest,
            monthlyEMI: emi
        };
    }
    
    // Case 2: Calculate EMI from rate (standard reducing balance)
    if (r > 0) {
        emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
        emi = p / n;
    }
    
    const schedule = [];
    let balance = p;
    let totalInterest = 0;

    for (let i = 1; i <= n; i++) {
        let interestForMonth = balance * r;
        let principalForMonth = emi - interestForMonth;
        
        if (i === n) {
            principalForMonth = balance;
            interestForMonth = emi - principalForMonth;
            if (interestForMonth < 0) interestForMonth = 0;
        }

        balance -= principalForMonth;
        if (balance < 0) balance = 0;
        
        totalInterest += interestForMonth;
        
        const paymentDate = new Date(start);
        paymentDate.setMonth(start.getMonth() + i);

        schedule.push({
            month: i,
            date: paymentDate,
            emi: emi,
            interest: interestForMonth,
            principal: principalForMonth,
            balance: balance
        });

        if (balance === 0) break;
    }

    return {
        schedule,
        totalInterest,
        totalPayment: p + totalInterest,
        monthlyEMI: emi
    };
  },

  /**
   * Credit Card Risk & Optimization
   */
  calculateCreditRisk: (cardLimit, totalSpent, options = {}) => {
    const limit = parseFloat(cardLimit) || 0;
    const spent = parseFloat(totalSpent) || 0;
    const { dueDate, minPayment } = options;
    
    const usagePercentage = limit > 0 ? (spent / limit) * 100 : 0;
    
    let status = 'SAFE';
    let color = 'green';
    if (usagePercentage > 70) { status = 'DANGEROUS'; color = 'red'; }
    else if (usagePercentage > 50) { status = 'HIGH'; color = 'orange'; }
    else if (usagePercentage > 30) { status = 'CAUTION'; color = 'yellow'; }

    const recommendations = [];
    if (usagePercentage > 30) {
      recommendations.push(`Pay ₹${Math.round(spent - limit * 0.3).toLocaleString()} to reach optimal 30% utilization.`);
    }
    if (spent > 0) {
      recommendations.push(`Full payment: ₹${spent.toLocaleString()} to avoid interest charges.`);
    }

    return {
      usagePercentage: usagePercentage.toFixed(1),
      status,
      color,
      optimalPayment: Math.max(0, spent - limit * 0.3),
      recommendations,
    };
  },

  /**
   * Advanced Prediction using EWMA
   */
  predictNextMonth: (monthlyTotals) => {
    if (!Array.isArray(monthlyTotals) || monthlyTotals.length === 0) return { predicted: 0, confidence: 0 };
    
    const validTotals = monthlyTotals.filter((t) => typeof t === 'number' && !isNaN(t));
    if (validTotals.length === 0) return { predicted: 0, confidence: 0 };
    
    const predicted = calculateEWMA(validTotals, 0.3);
    const trend = detectTrend(validTotals);
    
    // Adjust prediction based on trend
    const trendAdjustment = trend.direction === 'INCREASING' ? 1.05 : 
                           trend.direction === 'DECREASING' ? 0.95 : 1;
    const adjustedPrediction = Math.round(predicted * trendAdjustment);
    
    // Confidence based on data quantity and consistency
    const variance = validTotals.length > 1 
      ? validTotals.reduce((sum, val) => sum + Math.pow(val - predicted, 2), 0) / validTotals.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / predicted) * 100));

    return {
      predicted: adjustedPrediction,
      trend,
      confidence: Math.round(confidence),
      basePrediction: predicted,
      dataPoints: validTotals.length,
    };
  },

  /**
   * Safe-to-Spend Calculator with Buffer
   */
  calculateSafeToSpend: (totalIncome, totalCommitted, daysLeft, targetSavingsPercent = 20) => {
    const income = parseFloat(totalIncome) || 0;
    const committed = parseFloat(totalCommitted) || 0;
    const days = parseInt(daysLeft, 10) || 1;
    
    // Savings First: Deduct savings immediately from available funds
    const mandatorySavings = income * (targetSavingsPercent / 100);
    const available = income - committed - mandatorySavings;
    
    if (available <= 0 || days <= 0) {
      return { 
          daily: 0, 
          total: 0, 
          status: 'OVERSPENT', 
          message: 'Budget exhausted after setting aside savings.' 
      };
    }
    
    const daily = Math.round(available / days);
    let status = 'HEALTHY';
    if (daily < 500) status = 'TIGHT';
    if (daily < 200) status = 'CRITICAL';
    
    return {
      daily,
      total: Math.round(available),
      status,
      targetSavings: Math.round(mandatorySavings),
      message: `You can spend ₹${daily}/day after setting aside ₹${Math.round(mandatorySavings)} for savings.`
    };
  },

  // Utility exports
  utils: {
    calculateEWMA,
    detectTrend,
    calculateSpendingVelocity,
    safeSum,
  },

  // ======== V2 ENHANCEMENTS ========

  /**
   * Multi-dimensional Health Score v2
   * Returns 5 separate dimensions instead of single score
   */
  calculateHealthDimensions: (data) => {
    const {
      totalIncome = 0,
      totalExpenses = 0,
      fixedExpenses = 0,
      variableExpenses = 0,
      emiTotal = 0,
      creditCardSpent = 0,
      creditLimit = 0,
      accountBalances = 0,
      savingsTotal = 0,
      budgets = [],
      actualSpending = {},
      monthlyHistory = [],
    } = data;

    // 1. LIQUIDITY (Can survive emergency?)
    // Based on: (Account balances + Savings) / Monthly expenses
    const monthlyExpense = totalExpenses || 1;
    const liquidAssets = accountBalances + savingsTotal;
    const monthsCovered = liquidAssets / monthlyExpense;
    let liquidity = 0;
    if (monthsCovered >= 6) liquidity = 100;
    else if (monthsCovered >= 3) liquidity = 70 + (monthsCovered - 3) * 10;
    else if (monthsCovered >= 1) liquidity = 40 + (monthsCovered - 1) * 15;
    else liquidity = monthsCovered * 40;
    liquidity = Math.min(100, Math.max(0, Math.round(liquidity)));

    // 2. STABILITY (Fixed vs Variable load)
    // Ideal: Fixed expenses < 50% of income, EMI < 40%
    const fixedRatio = totalIncome > 0 ? ((fixedExpenses + emiTotal) / totalIncome) * 100 : 100;
    let stability = 100;
    if (fixedRatio > 70) stability = 20;
    else if (fixedRatio > 60) stability = 40;
    else if (fixedRatio > 50) stability = 60;
    else if (fixedRatio > 40) stability = 80;
    stability = Math.round(stability);

    // 3. RISK (Credit + EMI stress)
    // Credit utilization + EMI burden
    const ccUtilization = creditLimit > 0 ? (creditCardSpent / creditLimit) * 100 : 0;
    const emiRatio = totalIncome > 0 ? (emiTotal / totalIncome) * 100 : 0;
    let risk = 100;
    if (ccUtilization > 70) risk -= 30;
    else if (ccUtilization > 50) risk -= 20;
    else if (ccUtilization > 30) risk -= 10;
    if (emiRatio > 50) risk -= 40;
    else if (emiRatio > 40) risk -= 25;
    else if (emiRatio > 30) risk -= 10;
    risk = Math.min(100, Math.max(0, Math.round(risk)));

    // 4. DISCIPLINE (Budget adherence)
    // How well user sticks to budgets
    let discipline = 100;
    if (budgets.length > 0) {
      let overBudgetCount = 0;
      let totalBudgetScore = 0;
      budgets.forEach(b => {
        const spent = actualSpending[b.category] || 0;
        const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
        if (pct > 100) overBudgetCount++;
        totalBudgetScore += Math.min(100, pct);
      });
      const avgAdherence = totalBudgetScore / budgets.length;
      discipline = Math.round(100 - (avgAdherence - 80) * 2);
      discipline = Math.min(100, Math.max(0, discipline));
      if (overBudgetCount > budgets.length / 2) discipline = Math.min(discipline, 40);
    }

    // 5. GROWTH (Savings & investment rate)
    // Target: 20% savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    let growth = 0;
    if (savingsRate >= 30) growth = 100;
    else if (savingsRate >= 20) growth = 80;
    else if (savingsRate >= 10) growth = 60;
    else if (savingsRate >= 0) growth = savingsRate * 4;
    else growth = 0; // Negative savings
    growth = Math.min(100, Math.max(0, Math.round(growth)));

    // Overall score (weighted average)
    const weights = { liquidity: 0.2, stability: 0.2, risk: 0.25, discipline: 0.15, growth: 0.2 };
    const overallScore = Math.round(
      liquidity * weights.liquidity +
      stability * weights.stability +
      risk * weights.risk +
      discipline * weights.discipline +
      growth * weights.growth
    );

    return {
      dimensions: {
        liquidity: { score: liquidity, label: 'Emergency Fund', icon: '🛡️' },
        stability: { score: stability, label: 'Fixed Load', icon: '⚖️' },
        risk: { score: risk, label: 'Credit Risk', icon: '⚠️' },
        discipline: { score: discipline, label: 'Budget Adherence', icon: '🎯' },
        growth: { score: growth, label: 'Wealth Growth', icon: '📈' },
      },
      overallScore,
      riskLevel: overallScore >= 80 ? 'EXCELLENT' : 
                 overallScore >= 65 ? 'GOOD' : 
                 overallScore >= 50 ? 'STABLE' : 
                 overallScore >= 35 ? 'WARNING' : 'CRITICAL',
    };
  },

  /**
   * Detect Financial Stress - Early Warning System v2
   */
  detectFinancialStress: (data) => {
    const {
      totalIncome = 0,
      totalExpenses = 0,
      accountBalances = 0,
      emiTotal = 0,
      creditCardSpent = 0,
      pendingBorrows = 0,
      dailyVelocity = 0,
      daysLeft = 15,
    } = data;

    const stressSignals = [];

    // Signal 1: Spending exceeds income
    if (totalExpenses > totalIncome) {
      stressSignals.push({
        type: 'CRITICAL',
        signal: 'OVERSPENDING',
        message: `Expenses (₹${totalExpenses.toLocaleString()}) exceed income (₹${totalIncome.toLocaleString()})`,
        severity: 10,
      });
    }

    // Signal 2: Account balance declining rapidly
    if (accountBalances < totalExpenses * 0.5) {
      stressSignals.push({
        type: 'WARNING',
        signal: 'LOW_BALANCE',
        message: `Account balance covers only ${Math.round((accountBalances / totalExpenses) * 100)}% of monthly expenses`,
        severity: 7,
      });
    }

    // Signal 3: EMI burden too high
    const emiRatio = totalIncome > 0 ? (emiTotal / totalIncome) * 100 : 0;
    if (emiRatio > 50) {
      stressSignals.push({
        type: 'CRITICAL',
        signal: 'EMI_OVERLOAD',
        message: `EMIs consuming ${Math.round(emiRatio)}% of income (danger zone: >50%)`,
        severity: 9,
      });
    }

    // Signal 4: Velocity will exhaust budget
    const projectedTotal = dailyVelocity * 30;
    if (projectedTotal > totalIncome * 0.9 && daysLeft > 5) {
      stressSignals.push({
        type: 'WARNING',
        signal: 'VELOCITY_RISK',
        message: `At current rate, you'll spend ₹${projectedTotal.toLocaleString()} this month`,
        severity: 6,
      });
    }

    // Signal 5: Credit card debt accumulating
    if (creditCardSpent > totalIncome * 0.3) {
      stressSignals.push({
        type: 'WARNING',
        signal: 'CC_ACCUMULATION',
        message: `Credit card spending at ${Math.round((creditCardSpent / totalIncome) * 100)}% of income`,
        severity: 5,
      });
    }

    // Signal 6: Pending borrows
    if (pendingBorrows > totalIncome * 0.5) {
      stressSignals.push({
        type: 'WARNING',
        signal: 'DEBT_BURDEN',
        message: `Pending borrowed amount (₹${pendingBorrows.toLocaleString()}) is high`,
        severity: 6,
      });
    }

    // Calculate overall stress level
    const totalSeverity = stressSignals.reduce((sum, s) => sum + s.severity, 0);
    let stressLevel = 'CALM';
    if (totalSeverity >= 20) stressLevel = 'CRITICAL';
    else if (totalSeverity >= 12) stressLevel = 'HIGH';
    else if (totalSeverity >= 6) stressLevel = 'MODERATE';
    else if (totalSeverity > 0) stressLevel = 'LOW';

    return {
      stressLevel,
      totalSeverity,
      signals: stressSignals.sort((a, b) => b.severity - a.severity),
      isStressed: stressLevel === 'HIGH' || stressLevel === 'CRITICAL',
    };
  },

  /**
   * Generate Trend Signals per Category v2
   */
  generateTrendSignals: (expenseHistory) => {
    if (!Array.isArray(expenseHistory) || expenseHistory.length === 0) {
      return [];
    }

    // Group by category
    const categoryData = {};
    expenseHistory.forEach(e => {
      if (!e.category || !e.amount) return;
      if (!categoryData[e.category]) categoryData[e.category] = [];
      categoryData[e.category].push(e.amount);
    });

    // Generate signals
    const signals = [];
    Object.entries(categoryData).forEach(([category, amounts]) => {
      if (amounts.length < 2) return;

      const trend = detectTrend(amounts);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const latest = amounts[amounts.length - 1];

      signals.push({
        category,
        trend: trend.direction,
        changePercent: trend.change,
        average: Math.round(avg),
        latest: Math.round(latest),
        signal: trend.direction === 'INCREASING' ? '↑' : 
                trend.direction === 'DECREASING' ? '↓' : '→',
        alert: trend.direction === 'INCREASING' && trend.change > 25,
      });
    });

    return signals.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  },
};
