/**
 * Automation Engine v2 - Event-Driven Financial Automation
 * @module AutomationEngine
 * 
 * Philosophy: Event → Rule → Action
 * Removes human friction by automating financial decisions.
 */

import prisma from './prisma';
import { FinanceEngine } from './finance';
import { BudgetEngine } from './budgetEngine';

// Event Types
export const EventTypes = {
  SALARY_CREDITED: 'SALARY_CREDITED',
  EXPENSE_CREATED: 'EXPENSE_CREATED',
  EXPENSE_UPDATED: 'EXPENSE_UPDATED',
  BUDGET_CROSSED: 'BUDGET_CROSSED',
  EMI_DUE_APPROACHING: 'EMI_DUE_APPROACHING',
  CREDIT_UTILIZATION_SPIKE: 'CREDIT_UTILIZATION_SPIKE',
  SAVINGS_MILESTONE: 'SAVINGS_MILESTONE',
  MONTH_END: 'MONTH_END',
  FIXED_EXPENSE_DUE: 'FIXED_EXPENSE_DUE',
};

/**
 * Main entry point - Process any financial event
 * @param {string} eventType - Type of event from EventTypes
 * @param {object} payload - Event data
 * @param {string} userId - User ID
 * @returns {Promise<{actions: Array, notifications: Array}>}
 */
export async function processEvent(eventType, payload, userId) {
  const result = { actions: [], notifications: [] };

  try {
    switch (eventType) {
      case EventTypes.SALARY_CREDITED:
        return await handleSalaryEvent(userId, payload);
      
      case EventTypes.EXPENSE_CREATED:
      case EventTypes.EXPENSE_UPDATED:
        return await handleExpenseEvent(userId, payload);
      
      case EventTypes.EMI_DUE_APPROACHING:
        return await handleEMIEvent(userId, payload);
      
      case EventTypes.CREDIT_UTILIZATION_SPIKE:
        return await handleCreditUtilization(userId, payload);
      
      case EventTypes.MONTH_END:
        return await handleMonthEnd(userId);
      
      case EventTypes.FIXED_EXPENSE_DUE:
        return await handleFixedExpenseDue(userId, payload);
      
      default:
        console.log(`Unknown event type: ${eventType}`);
        return result;
    }
  } catch (error) {
    console.error(`AutomationEngine error for ${eventType}:`, error);
    return result;
  }
}

/**
 * Handle salary credit event - Recalculate entire month
 */
export async function handleSalaryEvent(userId, payload) {
  const { amount, accountId } = payload;
  const actions = [];
  const notifications = [];

  // 1. Get user's financial data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      budgets: true,
      savings: true,
      fixedExpenses: true,
    },
  });

  if (!user) return { actions, notifications };

  // 2. Calculate recommended savings (20% of income)
  const recommendedSavings = amount * 0.2;
  const currentSavingsTotal = user.savings.reduce((sum, s) => sum + s.currentAmount, 0);

  // 3. Auto-allocate to savings goals if configured
  const activeSavings = user.savings.filter(s => s.currentAmount < s.targetAmount);
  if (activeSavings.length > 0) {
    const distributionPerGoal = recommendedSavings / activeSavings.length;
    
    actions.push({
      type: 'SAVINGS_SUGGESTION',
      message: `Suggest allocating ₹${Math.round(distributionPerGoal)} to each of ${activeSavings.length} savings goals`,
      data: { amount: distributionPerGoal, goals: activeSavings.map(s => s.id) },
    });
  }

  // 4. Check if budgets need recalculation
  const totalFixedExpenses = user.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const availableForVariable = amount - totalFixedExpenses - recommendedSavings;

  if (availableForVariable < 0) {
    notifications.push({
      type: 'ALERT',
      icon: '🚨',
      title: 'Budget Shortfall Detected',
      cause: 'Fixed expenses exceed income after savings',
      impact: `Shortfall of ₹${Math.abs(availableForVariable).toLocaleString()}`,
      recommendation: 'Review fixed expenses or reduce savings target temporarily',
    });
  } else {
    notifications.push({
      type: 'SUCCESS',
      icon: '💰',
      title: 'Salary Credited!',
      cause: `₹${amount.toLocaleString()} received`,
      impact: `₹${availableForVariable.toLocaleString()} available for variable expenses`,
      recommendation: 'Consider allocating surplus to savings goals',
    });
  }

  // 5. Trigger budget rebalance suggestion
  const rebalanceResult = await autoAdjustBudgets(userId);
  if (rebalanceResult.suggestions.length > 0) {
    actions.push(...rebalanceResult.suggestions.map(s => ({
      type: 'BUDGET_REBALANCE',
      ...s,
    })));
  }

  return { actions, notifications };
}

/**
 * Handle expense creation/update - Check budgets and anomalies
 */
export async function handleExpenseEvent(userId, payload) {
  const { expense } = payload;
  const actions = [];
  const notifications = [];

  // 1. Get budget for this category
  const budget = await prisma.budget.findFirst({
    where: { userId, category: expense.category },
  });

  // 2. Get current month's spending in this category
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const categoryExpenses = await prisma.dailyExpense.findMany({
    where: {
      userId,
      category: expense.category,
      date: { gte: monthStart },
    },
  });

  const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 3. Check budget status
  if (budget) {
    const percentage = (totalSpent / budget.monthlyLimit) * 100;
    
    if (percentage >= 100) {
      notifications.push({
        type: 'ALERT',
        icon: '🚨',
        title: `${expense.category} Budget Exceeded!`,
        cause: `New expense of ₹${expense.amount.toLocaleString()}`,
        impact: `Over budget by ₹${(totalSpent - budget.monthlyLimit).toLocaleString()}`,
        recommendation: 'Stop spending in this category or reallocate from another budget',
      });
      
      actions.push({
        type: 'REDUCE_SAFE_TO_SPEND',
        category: expense.category,
        overAmount: totalSpent - budget.monthlyLimit,
      });
    } else if (percentage >= budget.alertAt) {
      notifications.push({
        type: 'WARNING',
        icon: '⚠️',
        title: `${expense.category} Budget Alert`,
        cause: `${Math.round(percentage)}% of budget used`,
        impact: `₹${(budget.monthlyLimit - totalSpent).toLocaleString()} remaining`,
        recommendation: `Slow down spending - ${Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()))} days left in month`,
      });
    }
  }

  // 4. Anomaly detection - compare with average
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const historicalExpenses = await prisma.dailyExpense.findMany({
    where: {
      userId,
      category: expense.category,
      date: { gte: threeMonthsAgo, lt: monthStart },
    },
  });

  if (historicalExpenses.length > 0) {
    const avgExpense = historicalExpenses.reduce((sum, e) => sum + e.amount, 0) / historicalExpenses.length;
    
    // Flag if this single expense is 3x the average
    if (expense.amount > avgExpense * 3) {
      notifications.push({
        type: 'TIP',
        icon: '🔍',
        title: 'Unusual Expense Detected',
        cause: `₹${expense.amount.toLocaleString()} in ${expense.category}`,
        impact: `This is ${Math.round(expense.amount / avgExpense)}x your average ${expense.category} expense`,
        recommendation: 'Is this a one-time expense or recurring? Consider adding it to fixed expenses if recurring.',
      });
      
      // Mark as anomaly
      await prisma.dailyExpense.update({
        where: { id: expense.id },
        data: { isAnomaly: true },
      });
    }
  }

  return { actions, notifications };
}

/**
 * Handle EMI due date approaching
 */
export async function handleEMIEvent(userId, payload) {
  const { emi, daysUntilDue } = payload;
  const actions = [];
  const notifications = [];

  // Get user's accounts
  const accounts = await prisma.account.findMany({
    where: { userId },
  });

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const canAfford = totalBalance >= emi.monthlyAmount;

  if (daysUntilDue <= 3) {
    notifications.push({
      type: canAfford ? 'REMINDER' : 'ALERT',
      icon: canAfford ? '📅' : '🚨',
      title: `${emi.name} EMI Due ${daysUntilDue === 0 ? 'Today!' : `in ${daysUntilDue} days`}`,
      cause: `Monthly EMI of ₹${emi.monthlyAmount.toLocaleString()}`,
      impact: canAfford 
        ? `Sufficient balance available (₹${totalBalance.toLocaleString()})`
        : `Shortfall of ₹${(emi.monthlyAmount - totalBalance).toLocaleString()}`,
      recommendation: canAfford 
        ? 'Ensure funds remain until auto-debit'
        : 'Transfer funds immediately to avoid late payment',
    });
  }

  // Prepayment suggestion if user has surplus
  const surplus = totalBalance - emi.monthlyAmount * 2; // Keep 2 months buffer
  if (surplus > emi.monthlyAmount && emi.paidMonths < emi.totalMonths) {
    const interestSaved = FinanceEngine.calculateInterestRate(
      emi.totalAmount - (emi.monthlyAmount * emi.paidMonths),
      emi.monthlyAmount,
      emi.totalMonths - emi.paidMonths
    );
    
    actions.push({
      type: 'EMI_PREPAYMENT_SUGGESTION',
      message: `Consider prepaying ₹${emi.monthlyAmount.toLocaleString()} extra on ${emi.name}`,
      data: { emiId: emi.id, suggestedAmount: emi.monthlyAmount },
    });
  }

  return { actions, notifications };
}

/**
 * Handle credit card utilization spike
 */
export async function handleCreditUtilization(userId, payload) {
  const { card, currentUtilization } = payload;
  const notifications = [];
  const actions = [];

  // Get utilization risk
  const risk = FinanceEngine.calculateCreditRisk(card.limit, currentUtilization);

  if (risk.level === 'CRITICAL' || currentUtilization > card.limit * 0.9) {
    notifications.push({
      type: 'ALERT',
      icon: '💳',
      title: `${card.name} Near Limit!`,
      cause: `Utilization at ${Math.round((currentUtilization / card.limit) * 100)}%`,
      impact: `Only ₹${(card.limit - currentUtilization).toLocaleString()} remaining`,
      recommendation: 'Consider making a partial payment before billing cycle ends',
    });
  } else if (risk.level === 'HIGH' || currentUtilization > card.limit * 0.7) {
    notifications.push({
      type: 'WARNING',
      icon: '⚠️',
      title: `${card.name} High Utilization`,
      cause: `${Math.round((currentUtilization / card.limit) * 100)}% credit used`,
      impact: 'High utilization can affect credit score',
      recommendation: 'Try to keep utilization below 30% for optimal credit health',
    });
  }

  return { actions, notifications };
}

/**
 * Handle month end - Trigger budget rebalancing and reports
 */
export async function handleMonthEnd(userId) {
  const actions = [];
  const notifications = [];

  // 1. Rebalance budgets
  const rebalance = await autoAdjustBudgets(userId);
  
  if (rebalance.suggestions.length > 0) {
    notifications.push({
      type: 'TIP',
      icon: '📊',
      title: 'Monthly Budget Review',
      cause: 'Month ended',
      impact: `${rebalance.suggestions.length} budget adjustments suggested`,
      recommendation: 'Review and apply suggested budget changes for next month',
    });
    
    actions.push(...rebalance.suggestions);
  }

  // 2. Savings adjustment suggestion
  const savingsResult = await autoAdjustSavings(userId);
  if (savingsResult.suggestion) {
    actions.push(savingsResult.suggestion);
  }

  return { actions, notifications };
}

/**
 * Handle fixed expense due date
 */
export async function handleFixedExpenseDue(userId, payload) {
  const { fixedExpense, daysUntilDue } = payload;
  const notifications = [];

  if (fixedExpense.accountId) {
    // Check if linked account has sufficient balance
    const account = await prisma.account.findUnique({
      where: { id: fixedExpense.accountId },
    });

    if (account && account.balance < fixedExpense.amount) {
      notifications.push({
        type: 'ALERT',
        icon: '🏠',
        title: `${fixedExpense.title} Due Soon - Insufficient Balance`,
        cause: `₹${fixedExpense.amount.toLocaleString()} due in ${daysUntilDue} days`,
        impact: `Account ${account.name} has only ₹${account.balance.toLocaleString()}`,
        recommendation: `Transfer ₹${(fixedExpense.amount - account.balance).toLocaleString()} to ${account.name}`,
      });
    }
  } else {
    notifications.push({
      type: 'REMINDER',
      icon: '📅',
      title: `${fixedExpense.title} Due in ${daysUntilDue} days`,
      cause: `Fixed expense of ₹${fixedExpense.amount.toLocaleString()}`,
      impact: 'Payment due soon',
      recommendation: 'Consider linking to an account for auto-tracking',
    });
  }

  return { actions: [], notifications };
}

/**
 * Auto-adjust budgets based on spending patterns
 */
export async function autoAdjustBudgets(userId) {
  const suggestions = [];

  // Get budgets and spending
  const budgets = await prisma.budget.findMany({ where: { userId } });
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const expenses = await prisma.dailyExpense.findMany({
    where: { userId, date: { gte: monthStart } },
  });

  // Check status of each budget
  const status = BudgetEngine.checkBudgetStatus(
    budgets.map(b => ({ ...b, amount: b.monthlyLimit })),
    expenses
  );

  // Find underused and overused
  const underused = status.filter(s => s.percentage < 50);
  const overused = status.filter(s => s.percentage > 100);

  // Essential categories that shouldn't be reduced
  const essentials = ['Rent', 'Utilities', 'EMI', 'Insurance', 'Groceries'];

  // Suggest reallocation
  for (const over of overused) {
    const surplus = underused
      .filter(u => !essentials.includes(u.category))
      .reduce((sum, u) => sum + (u.amount - u.spent), 0);
    
    if (surplus > 0) {
      const needed = over.spent - over.amount;
      const canReallocate = Math.min(surplus, needed);
      
      suggestions.push({
        type: 'REBALANCE',
        from: underused.filter(u => !essentials.includes(u.category)).map(u => u.category),
        to: over.category,
        amount: canReallocate,
        message: `Reallocate ₹${canReallocate.toLocaleString()} to ${over.category} from underused categories`,
      });
    }
  }

  return { suggestions };
}

/**
 * Auto-adjust savings based on surplus/deficit
 */
export async function autoAdjustSavings(userId) {
  const result = { suggestion: null };

  // Get financial snapshot
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      incomes: true,
      dailyExpenses: true,
      fixedExpenses: true,
      savings: true,
    },
  });

  if (!user) return result;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyIncome = user.incomes
    .filter(i => new Date(i.date) >= monthStart)
    .reduce((sum, i) => sum + i.amount, 0);

  const monthlyExpenses = user.dailyExpenses
    .filter(e => new Date(e.date) >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyFixed = user.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const surplus = monthlyIncome - monthlyExpenses - monthlyFixed;
  const currentSavingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;

  // If saving more than 30%, suggest increasing goals
  if (currentSavingsRate > 30 && user.savings.length > 0) {
    const activeGoals = user.savings.filter(s => s.currentAmount < s.targetAmount);
    if (activeGoals.length > 0) {
      result.suggestion = {
        type: 'INCREASE_SAVINGS',
        message: `You're saving ${Math.round(currentSavingsRate)}%! Consider increasing monthly contribution to your goals.`,
        surplus: surplus - (monthlyIncome * 0.2), // Excess beyond 20%
      };
    }
  }

  // If saving less than 10%, suggest reducing optional expenses
  if (currentSavingsRate < 10 && currentSavingsRate >= 0) {
    result.suggestion = {
      type: 'REDUCE_EXPENSES',
      message: `Savings rate is only ${Math.round(currentSavingsRate)}%. Consider cutting optional expenses.`,
      target: 20 - currentSavingsRate,
    };
  }

  return result;
}

// Export the engine
export const AutomationEngine = {
  EventTypes,
  processEvent,
  handleSalaryEvent,
  handleExpenseEvent,
  handleEMIEvent,
  handleCreditUtilization,
  handleMonthEnd,
  handleFixedExpenseDue,
  autoAdjustBudgets,
  autoAdjustSavings,
};
