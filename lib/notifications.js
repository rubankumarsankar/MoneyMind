/**
 * Notifications Engine - Smart Financial Alerts
 * @module NotificationsEngine
 */

/**
 * Generate financial notifications based on current state
 */
export function generateNotifications(data) {
  const {
    healthScore = 0,
    daysLeft = 15,
    creditCards = [],
    emis = [],
    budgetAlerts = [],
    savings = 0,
    savingsGoal = 0,
  } = data;

  const notifications = [];
  const today = new Date();

  // Health Score Alerts
  if (healthScore < 40) {
    notifications.push({
      id: 'health-critical',
      type: 'ALERT',
      icon: '🚨',
      title: 'Financial Health Critical',
      message: `Your health score is ${healthScore}. Immediate action needed.`,
      priority: 1,
      createdAt: today,
    });
  }

  // Credit Card Due Date Reminders
  creditCards.forEach(card => {
    if (card.dueDate) {
      const dueDate = new Date(card.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 3 && daysUntilDue >= 0) {
        notifications.push({
          id: `cc-due-${card.id}`,
          type: 'REMINDER',
          icon: '💳',
          title: `${card.name || 'Credit Card'} Payment Due`,
          message: daysUntilDue === 0 
            ? 'Payment due TODAY!' 
            : `Payment due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}.`,
          priority: daysUntilDue === 0 ? 1 : 2,
          createdAt: today,
        });
      }
    }
  });

  // EMI Reminders
  emis.forEach(emi => {
    if (emi.dueDate) {
      const dueDate = new Date(emi.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 5 && daysUntilDue >= 0) {
        notifications.push({
          id: `emi-due-${emi.id}`,
          type: 'REMINDER',
          icon: '📅',
          title: `${emi.name || 'EMI'} Payment Due`,
          message: `₹${emi.monthlyAmount?.toLocaleString()} due ${daysUntilDue === 0 ? 'TODAY' : `in ${daysUntilDue} days`}.`,
          priority: daysUntilDue <= 2 ? 2 : 3,
          createdAt: today,
        });
      }
    }
  });

  // Budget Alerts
  budgetAlerts.forEach((alert, idx) => {
    notifications.push({
      id: `budget-${alert.category}-${idx}`,
      type: alert.type === 'CRITICAL' ? 'ALERT' : 'WARNING',
      icon: alert.icon,
      title: `Budget Alert: ${alert.category}`,
      message: alert.message,
      priority: alert.type === 'CRITICAL' ? 2 : 3,
      createdAt: today,
    });
  });

  // Savings Milestone
  if (savingsGoal > 0) {
    const progress = (savings / savingsGoal) * 100;
    if (progress >= 100) {
      notifications.push({
        id: 'savings-goal-reached',
        type: 'SUCCESS',
        icon: '🎉',
        title: 'Savings Goal Achieved!',
        message: `Congratulations! You've reached your savings goal of ₹${savingsGoal.toLocaleString()}.`,
        priority: 4,
        createdAt: today,
      });
    } else if (progress >= 75) {
      notifications.push({
        id: 'savings-milestone-75',
        type: 'TIP',
        icon: '🎯',
        title: 'Almost There!',
        message: `You're ${Math.round(progress)}% towards your savings goal.`,
        priority: 5,
        createdAt: today,
      });
    }
  }

  // Low Days Warning
  if (daysLeft <= 5) {
    notifications.push({
      id: 'month-end-reminder',
      type: 'TIP',
      icon: '📆',
      title: 'Month End Approaching',
      message: `${daysLeft} days left in this billing cycle. Review your spending.`,
      priority: 4,
      createdAt: today,
    });
  }

  return notifications.sort((a, b) => a.priority - b.priority);
}

/**
 * Generate weekly summary notification
 */
export function generateWeeklySummary(data) {
  const {
    weeklySpend = 0,
    lastWeekSpend = 0,
    topCategory = 'Unknown',
    healthScore = 0,
  } = data;

  const change = lastWeekSpend > 0 
    ? ((weeklySpend - lastWeekSpend) / lastWeekSpend) * 100 
    : 0;

  return {
    id: 'weekly-summary',
    type: 'INFO',
    icon: '📊',
    title: 'Weekly Financial Summary',
    message: `Spent ₹${weeklySpend.toLocaleString()} this week ${change > 0 ? `(↑${change.toFixed(0)}%)` : `(↓${Math.abs(change).toFixed(0)}%)`}. Top: ${topCategory}. Health: ${healthScore}/100.`,
    details: {
      weeklySpend,
      lastWeekSpend,
      change: Math.round(change),
      topCategory,
      healthScore,
    },
    priority: 5,
    createdAt: new Date(),
  };
}

/**
 * Format notification for display
 */
export function formatNotification(notification) {
  const colors = {
    ALERT: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    WARNING: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    REMINDER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    SUCCESS: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    TIP: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    INFO: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  };

  return {
    ...notification,
    style: colors[notification.type] || colors.INFO,
  };
}

export const NotificationsEngine = {
  generateNotifications,
  generateWeeklySummary,
  formatNotification,

  // ======== V2 ENHANCEMENTS ========

  /**
   * Generate Context-Aware Notifications v2
   * Each notification includes: cause, impact, recommendation
   */
  generateContextualNotifications: (data) => {
    const {
      healthScore = 0,
      healthDimensions = {},
      stressSignals = [],
      budgetStatuses = [],
      categoryTrends = {},
      daysLeft = 15,
      dailyVelocity = 0,
      totalIncome = 0,
      projectedMonthEnd = 0,
      emis = [],
      creditCards = [],
      fixedExpenses = [],
    } = data;

    const notifications = [];
    const today = new Date();

    // 1. Multi-dimensional Health Alerts
    if (healthDimensions.liquidity?.score < 40) {
      notifications.push({
        id: 'liquidity-low',
        type: 'ALERT',
        icon: '🛡️',
        title: 'Emergency Fund Low',
        cause: `Your liquid assets cover only ${Math.round(healthDimensions.liquidity.score / 16)} months of expenses`,
        impact: 'Vulnerable to unexpected expenses or income loss',
        recommendation: 'Prioritize building 3-6 months of expenses in savings',
        priority: 1,
        dimension: 'liquidity',
        createdAt: today,
      });
    }

    if (healthDimensions.risk?.score < 40) {
      notifications.push({
        id: 'risk-high',
        type: 'ALERT',
        icon: '⚠️',
        title: 'Credit Risk Elevated',
        cause: 'High credit utilization and/or EMI burden',
        impact: 'May affect credit score and financial flexibility',
        recommendation: 'Focus on paying down credit card balances below 30%',
        priority: 1,
        dimension: 'risk',
        createdAt: today,
      });
    }

    if (healthDimensions.discipline?.score < 50) {
      notifications.push({
        id: 'discipline-low',
        type: 'WARNING',
        icon: '🎯',
        title: 'Budget Adherence Slipping',
        cause: 'Multiple categories exceeding budget limits',
        impact: 'Savings goals may be compromised',
        recommendation: 'Review and adjust budget limits or spending habits',
        priority: 2,
        dimension: 'discipline',
        createdAt: today,
      });
    }

    // 2. Stress Signal Notifications
    stressSignals.forEach((signal, idx) => {
      notifications.push({
        id: `stress-${signal.signal}-${idx}`,
        type: signal.type,
        icon: signal.type === 'CRITICAL' ? '🚨' : '⚠️',
        title: `Financial Stress: ${signal.signal.replace(/_/g, ' ')}`,
        cause: signal.message,
        impact: 'May lead to financial instability if not addressed',
        recommendation: getStressRecommendation(signal.signal),
        priority: signal.type === 'CRITICAL' ? 1 : 2,
        createdAt: today,
      });
    });

    // 3. Velocity-based Projection Alert
    if (projectedMonthEnd > totalIncome * 1.1 && daysLeft > 5) {
      const overBy = projectedMonthEnd - totalIncome;
      notifications.push({
        id: 'velocity-projection',
        type: 'WARNING',
        icon: '📈',
        title: 'Spending Projection Exceeded',
        cause: `Current daily velocity: ₹${dailyVelocity.toLocaleString()}/day`,
        impact: `Projected to overspend by ₹${Math.round(overBy).toLocaleString()} this month`,
        recommendation: `Reduce daily spending to ₹${Math.round((totalIncome - projectedMonthEnd + dailyVelocity * daysLeft) / daysLeft)}`,
        priority: 2,
        createdAt: today,
      });
    }

    // 4. Category Trend Alerts
    Object.entries(categoryTrends).forEach(([category, trend]) => {
      if (trend.direction === 'INCREASING' && trend.changePercent > 30) {
        notifications.push({
          id: `trend-${category}`,
          type: 'TIP',
          icon: '📊',
          title: `${category} Spending Trending Up`,
          cause: `${trend.changePercent}% increase compared to previous period`,
          impact: `May push this category over budget soon`,
          recommendation: `Review recent ${category} expenses for unnecessary spending`,
          priority: 3,
          createdAt: today,
        });
      }
    });

    // 5. Upcoming Fixed Expenses
    const dayOfMonth = today.getDate();
    fixedExpenses.forEach(expense => {
      const daysUntilDue = expense.dayOfMonth - dayOfMonth;
      if (daysUntilDue > 0 && daysUntilDue <= 3) {
        notifications.push({
          id: `fixed-${expense.id}`,
          type: 'REMINDER',
          icon: '🏠',
          title: `${expense.title} Due Soon`,
          cause: `₹${expense.amount.toLocaleString()} due on day ${expense.dayOfMonth}`,
          impact: `${daysUntilDue} days until payment`,
          recommendation: expense.accountId 
            ? 'Ensure linked account has sufficient balance'
            : 'Consider setting up auto-pay',
          priority: 3,
          createdAt: today,
        });
      }
    });

    return notifications.sort((a, b) => a.priority - b.priority);
  },

  /**
   * Generate Smart Daily Digest v2
   */
  generateDailyDigest: (data) => {
    const {
      healthScore = 0,
      todaySpend = 0,
      safeToSpend = 0,
      upcomingPayments = [],
      topAlert = null,
    } = data;

    const status = todaySpend <= safeToSpend ? 'ON_TRACK' : 'OVER';

    return {
      id: 'daily-digest',
      type: 'INFO',
      icon: status === 'ON_TRACK' ? '✅' : '⚠️',
      title: 'Daily Financial Digest',
      summary: {
        healthScore,
        todaySpend,
        safeToSpend,
        status,
        remainingBudget: Math.max(0, safeToSpend - todaySpend),
      },
      sections: [
        {
          title: 'Today\'s Snapshot',
          content: `Spent ₹${todaySpend.toLocaleString()} of ₹${safeToSpend.toLocaleString()} daily budget`,
        },
        upcomingPayments.length > 0 && {
          title: 'Upcoming',
          content: upcomingPayments.map(p => `${p.name}: ₹${p.amount.toLocaleString()}`).join(', '),
        },
        topAlert && {
          title: 'Priority Alert',
          content: topAlert.title,
        },
      ].filter(Boolean),
      priority: 5,
      createdAt: new Date(),
    };
  },

  /**
   * Batch Notifications by Priority v2
   */
  batchNotifications: (notifications, maxPerType = 3) => {
    const grouped = {
      critical: [],
      warning: [],
      reminder: [],
      tip: [],
    };

    notifications.forEach(n => {
      if (n.type === 'ALERT' || n.type === 'CRITICAL') grouped.critical.push(n);
      else if (n.type === 'WARNING') grouped.warning.push(n);
      else if (n.type === 'REMINDER') grouped.reminder.push(n);
      else grouped.tip.push(n);
    });

    // Limit each group and create summary if needed
    const result = [];
    Object.entries(grouped).forEach(([type, items]) => {
      if (items.length <= maxPerType) {
        result.push(...items);
      } else {
        result.push(...items.slice(0, maxPerType));
        result.push({
          id: `${type}-more`,
          type: 'INFO',
          icon: '📋',
          title: `+${items.length - maxPerType} more ${type} alerts`,
          message: `View all to see remaining ${type} notifications`,
          priority: 10,
          isSummary: true,
        });
      }
    });

    return result.sort((a, b) => a.priority - b.priority);
  },
};

// Helper function for stress recommendations
function getStressRecommendation(signal) {
  const recommendations = {
    OVERSPENDING: 'Create a strict budget and track every expense. Consider a spending freeze on non-essentials.',
    LOW_BALANCE: 'Build an emergency fund. Start with ₹1,000 auto-transfer to savings.',
    EMI_OVERLOAD: 'Avoid new loans. Consider prepaying highest-interest EMI first.',
    VELOCITY_RISK: 'Implement the envelope system. Allocate cash for each category weekly.',
    CC_ACCUMULATION: 'Pay more than minimum. Focus on highest-interest card first.',
    DEBT_BURDEN: 'Create a debt payoff plan. Consider debt consolidation if rates are high.',
  };
  return recommendations[signal] || 'Review your financial habits and create an action plan.';
}

