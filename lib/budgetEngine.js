/**
 * Budget Engine - Smart Category Budgeting
 * @module BudgetEngine
 */

/**
 * Auto-suggest budgets based on spending history
 */
export function suggestBudgets(incomes, expenses, months = 3) {
  const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0) / Math.max(months, 1);
  
  // Group expenses by category
  const categoryTotals = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
  });

  // Calculate averages and suggest budgets with 10% buffer
  const suggestions = Object.entries(categoryTotals).map(([category, total]) => {
    const average = total / Math.max(months, 1);
    const suggested = Math.round(average * 1.1); // 10% buffer
    
    return {
      category,
      averageSpend: Math.round(average),
      suggestedBudget: suggested,
      percentOfIncome: totalIncome > 0 ? ((average / totalIncome) * 100).toFixed(1) : 0,
    };
  });

  // Sort by spend amount (highest first)
  return suggestions.sort((a, b) => b.averageSpend - a.averageSpend);
}

/**
 * Check budget status for all categories
 */
export function checkBudgetStatus(budgets, currentExpenses) {
  // Group current expenses by category
  const spent = {};
  currentExpenses.forEach(e => {
    const cat = e.category || 'Other';
    spent[cat] = (spent[cat] || 0) + (e.amount || 0);
  });

  return budgets.map(budget => {
    const currentSpend = spent[budget.category] || 0;
    const percentage = budget.amount > 0 ? (currentSpend / budget.amount) * 100 : 0;
    
    let status = 'OK';
    let color = 'green';
    
    if (percentage >= 100) {
      status = 'OVER';
      color = 'red';
    } else if (percentage >= 80) {
      status = 'WARNING';
      color = 'orange';
    } else if (percentage >= 60) {
      status = 'CAUTION';
      color = 'yellow';
    }

    return {
      ...budget,
      spent: Math.round(currentSpend),
      remaining: Math.round(budget.amount - currentSpend),
      percentage: Math.round(percentage),
      status,
      color,
    };
  });
}

/**
 * Generate budget alerts
 */
export function generateBudgetAlerts(budgetStatuses) {
  const alerts = [];

  budgetStatuses.forEach(b => {
    if (b.status === 'OVER') {
      alerts.push({
        type: 'CRITICAL',
        icon: '🚨',
        category: b.category,
        message: `${b.category} budget exceeded by ₹${Math.abs(b.remaining).toLocaleString()}`,
        action: 'Stop spending in this category immediately.',
      });
    } else if (b.status === 'WARNING') {
      alerts.push({
        type: 'WARNING',
        icon: '⚠️',
        category: b.category,
        message: `${b.category} at ${b.percentage}% of budget (₹${b.remaining.toLocaleString()} left)`,
        action: 'Slow down spending to stay within budget.',
      });
    }
  });

  return alerts;
}

/**
 * Analyze spending against 50-30-20 rule
 */
export function analyzeSpendingRule(income, fixedExpenses, variableExpenses, savings) {
  const needs = fixedExpenses; // Essential: rent, utilities, EMIs
  const wants = variableExpenses; // Non-essential: food out, shopping
  const saved = savings;

  const needsTarget = income * 0.5;
  const wantsTarget = income * 0.3;
  const savingsTarget = income * 0.2;

  const analysis = {
    needs: {
      label: 'Needs (50%)',
      target: needsTarget,
      actual: needs,
      percentage: income > 0 ? ((needs / income) * 100).toFixed(0) : 0,
      status: needs <= needsTarget ? 'OK' : 'OVER',
      difference: Math.round(needsTarget - needs),
    },
    wants: {
      label: 'Wants (30%)',
      target: wantsTarget,
      actual: wants,
      percentage: income > 0 ? ((wants / income) * 100).toFixed(0) : 0,
      status: wants <= wantsTarget ? 'OK' : 'OVER',
      difference: Math.round(wantsTarget - wants),
    },
    savings: {
      label: 'Savings (20%)',
      target: savingsTarget,
      actual: saved,
      percentage: income > 0 ? ((saved / income) * 100).toFixed(0) : 0,
      status: saved >= savingsTarget ? 'OK' : 'UNDER',
      difference: Math.round(saved - savingsTarget),
    },
  };

  // Overall score
  let score = 100;
  if (analysis.needs.status === 'OVER') score -= 30;
  if (analysis.wants.status === 'OVER') score -= 20;
  if (analysis.savings.status === 'UNDER') score -= 25;

  return {
    ...analysis,
    overallScore: Math.max(0, score),
    isBalanced: score >= 75,
  };
}

/**
 * Calculate category trends over time
 */
export function calculateCategoryTrends(expensesByMonth) {
  const trends = {};

  Object.entries(expensesByMonth).forEach(([month, expenses]) => {
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      if (!trends[cat]) trends[cat] = [];
      trends[cat].push({ month, amount: e.amount });
    });
  });

  // Calculate trend for each category
  return Object.entries(trends).map(([category, data]) => {
    const amounts = data.map(d => d.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    // Simple trend: compare last to first
    const first = amounts[0] || 0;
    const last = amounts[amounts.length - 1] || 0;
    const changePercent = first > 0 ? ((last - first) / first) * 100 : 0;

    let direction = 'STABLE';
    if (changePercent > 15) direction = 'INCREASING';
    if (changePercent < -15) direction = 'DECREASING';

    return {
      category,
      average: Math.round(avg),
      trend: direction,
      changePercent: Math.round(changePercent),
      dataPoints: amounts.length,
    };
  });
}

export const BudgetEngine = {
  suggestBudgets,
  checkBudgetStatus,
  generateBudgetAlerts,
  analyzeSpendingRule,
  calculateCategoryTrends,

  // ======== V2 ENHANCEMENTS ========

  /**
   * Suggest Dynamic Budgets v2 - ML-lite learning based on history
   * Analyzes spending patterns and suggests adaptive limits
   */
  suggestDynamicBudgets: (userId, monthlyHistory) => {
    if (!Array.isArray(monthlyHistory) || monthlyHistory.length === 0) {
      return { suggestions: [], confidence: 0 };
    }

    // Group by category across all months
    const categoryData = {};
    monthlyHistory.forEach(month => {
      if (!month.expenses) return;
      month.expenses.forEach(e => {
        const cat = e.category || 'Other';
        if (!categoryData[cat]) {
          categoryData[cat] = { amounts: [], months: [] };
        }
        categoryData[cat].amounts.push(e.amount);
        categoryData[cat].months.push(month.month);
      });
    });

    const suggestions = [];
    const monthCount = monthlyHistory.length;

    Object.entries(categoryData).forEach(([category, data]) => {
      const { amounts } = data;
      if (amounts.length === 0) return;

      // Calculate statistics
      const sum = amounts.reduce((a, b) => a + b, 0);
      const avg = sum / amounts.length;
      const max = Math.max(...amounts);
      const min = Math.min(...amounts);
      const variance = amounts.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const volatility = avg > 0 ? (stdDev / avg) * 100 : 0;

      // Trend detection
      let trend = 'STABLE';
      if (amounts.length >= 2) {
        const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
        const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
        if (change > 15) trend = 'INCREASING';
        else if (change < -15) trend = 'DECREASING';
      }

      // Smart suggestion based on trend + volatility
      let suggestedBudget = avg;
      let bufferPercent = 10;

      if (trend === 'INCREASING') {
        bufferPercent = 20; // More buffer for growing categories
      } else if (trend === 'DECREASING') {
        bufferPercent = 5; // Less buffer for shrinking categories
      }

      if (volatility > 50) {
        bufferPercent += 15; // High volatility = more buffer
      }

      suggestedBudget = Math.round(avg * (1 + bufferPercent / 100));

      // Confidence based on data quantity and consistency
      let confidence = Math.min(100, monthCount * 20);
      if (volatility > 50) confidence -= 20;

      suggestions.push({
        category,
        currentAverage: Math.round(avg),
        suggestedBudget,
        bufferPercent,
        trend,
        volatility: Math.round(volatility),
        confidence: Math.max(0, confidence),
        min: Math.round(min),
        max: Math.round(max),
        reasoning: `Based on ${amounts.length} data points over ${monthCount} months. ${
          trend === 'INCREASING' ? 'Spending is trending up.' :
          trend === 'DECREASING' ? 'Spending is trending down.' : 'Spending is stable.'
        } ${volatility > 50 ? 'High volatility detected.' : ''}`,
      });
    });

    return {
      suggestions: suggestions.sort((a, b) => b.suggestedBudget - a.suggestedBudget),
      confidence: Math.round(
        suggestions.reduce((sum, s) => sum + s.confidence, 0) / Math.max(suggestions.length, 1)
      ),
      monthsAnalyzed: monthCount,
    };
  },

  /**
   * Rebalance Budgets v2 - Auto-reallocate from underused to overused
   */
  rebalanceBudgets: (budgets, currentSpending, options = {}) => {
    const { protectedCategories = [] } = options;
    const rebalanceActions = [];

    // Check each budget's status
    const statuses = budgets.map(b => {
      const spent = currentSpending[b.category] || 0;
      const limit = b.monthlyLimit || b.amount || 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      return {
        ...b,
        spent,
        limit,
        percentage,
        remaining: limit - spent,
        isProtected: protectedCategories.includes(b.category),
      };
    });

    // Find underused (< 50% used) and overused (> 100%)
    const underused = statuses.filter(s => s.percentage < 50 && s.remaining > 0 && !s.isProtected);
    const overused = statuses.filter(s => s.percentage > 100);

    if (underused.length === 0 || overused.length === 0) {
      return { rebalanceActions: [], summary: 'No rebalancing needed' };
    }

    // Calculate available surplus from underused
    const totalSurplus = underused.reduce((sum, s) => sum + (s.limit * 0.3), 0); // Take 30% of underused
    const totalNeeded = overused.reduce((sum, s) => sum + Math.abs(s.remaining), 0);
    const canReallocate = Math.min(totalSurplus, totalNeeded);

    if (canReallocate < 100) {
      return { rebalanceActions: [], summary: 'Rebalance amount too small' };
    }

    // Distribute to overused categories
    overused.forEach(over => {
      const needed = Math.abs(over.remaining);
      const share = needed / totalNeeded;
      const allocation = Math.round(canReallocate * share);

      if (allocation >= 50) {
        rebalanceActions.push({
          type: 'ALLOCATE_TO',
          category: over.category,
          amount: allocation,
          reason: `${over.category} exceeded by ₹${needed.toLocaleString()}`,
        });
      }
    });

    // Deduct from underused categories
    let remaining = canReallocate;
    underused.forEach(under => {
      if (remaining <= 0) return;
      const canTake = Math.min(under.limit * 0.3, remaining);
      if (canTake >= 50) {
        rebalanceActions.push({
          type: 'DEDUCT_FROM',
          category: under.category,
          amount: Math.round(canTake),
          reason: `${under.category} only ${Math.round(under.percentage)}% used`,
        });
        remaining -= canTake;
      }
    });

    return {
      rebalanceActions,
      totalReallocated: canReallocate,
      summary: `Reallocating ₹${canReallocate.toLocaleString()} from ${underused.length} underused to ${overused.length} overused categories`,
    };
  },

  /**
   * Lock Essential Categories v2 - Protect essentials from rebalancing
   */
  lockEssentialCategories: (budgets) => {
    // Essential categories that should never be reduced
    const essentialPatterns = [
      'rent', 'mortgage', 'housing',
      'utilities', 'electricity', 'water', 'gas',
      'insurance', 'health', 'medical',
      'emi', 'loan', 'debt',
      'groceries', 'essential',
      'education', 'school', 'tuition',
      'childcare',
    ];

    return budgets.map(b => {
      const categoryLower = (b.category || '').toLowerCase();
      const isEssential = essentialPatterns.some(pattern =>
        categoryLower.includes(pattern)
      );

      return {
        ...b,
        isLocked: isEssential,
        lockReason: isEssential ? 'Essential expense - protected from rebalancing' : null,
      };
    });
  },

  /**
   * Generate Context-Aware Budget Alerts v2
   */
  generateContextualAlerts: (budgetStatuses, options = {}) => {
    const { daysLeft = 15, weekendSpending = {}, categoryTrends = {} } = options;
    const alerts = [];

    budgetStatuses.forEach(b => {
      const trend = categoryTrends[b.category] || {};
      const weekendFactor = weekendSpending[b.category] || 1;

      if (b.status === 'OVER') {
        alerts.push({
          type: 'CRITICAL',
          icon: '🚨',
          category: b.category,
          title: `${b.category} Budget Exceeded`,
          cause: trend.direction === 'INCREASING'
            ? `Spending has been trending up (${trend.changePercent}% increase)`
            : 'Exceeded monthly allocation',
          impact: `Over budget by ₹${Math.abs(b.remaining).toLocaleString()}`,
          recommendation: 'Stop spending in this category immediately. Consider using cash-only for remainder of month.',
        });
      } else if (b.status === 'WARNING') {
        const projectedEnd = b.spent + (b.spent / (30 - daysLeft)) * daysLeft;
        const willExceed = projectedEnd > b.amount;

        alerts.push({
          type: 'WARNING',
          icon: '⚠️',
          category: b.category,
          title: `${b.category} Budget Alert`,
          cause: weekendFactor > 1.3
            ? 'Weekend spending is 30%+ higher than weekdays'
            : `${b.percentage}% of budget used`,
          impact: willExceed
            ? `Projected to exceed by ₹${Math.round(projectedEnd - b.amount).toLocaleString()}`
            : `₹${b.remaining.toLocaleString()} remaining`,
          recommendation: willExceed
            ? `Reduce daily ${b.category} spending to ₹${Math.round(b.remaining / daysLeft)}`
            : 'Consider slowing down to stay within budget',
        });
      }
    });

    return alerts;
  },
};

