/**
 * Explainability Layer v3 - Transparent AI Insights
 * @module Explainability
 * 
 * Provides transparency on WHY insights are generated,
 * HOW they are calculated, and WHAT actions users can take
 */

/**
 * Explain health score breakdown
 */
function explainHealthScore(healthData) {
  const {
    healthScore = 0,
    dimensions = {},
    breakdown = {},
  } = healthData;

  const explanations = [];

  // Overall score explanation
  explanations.push({
    section: 'Overall Health Score',
    score: healthScore,
    explanation: `Your financial health score of ${healthScore}/100 is calculated using 5 key dimensions, each weighted by importance.`,
    methodology: 'Weighted average of: Liquidity (20%), Stability (20%), Risk (25%), Discipline (15%), Growth (20%)',
  });

  // Dimension explanations
  if (dimensions.liquidity) {
    explanations.push({
      section: 'Liquidity (Emergency Fund)',
      score: dimensions.liquidity.score,
      explanation: dimensions.liquidity.score >= 70
        ? 'You have adequate liquid assets to cover emergencies.'
        : 'Your emergency fund is below recommended levels.',
      calculation: 'Based on: (Account Balances + Savings) / Monthly Expenses',
      target: '6+ months of expenses',
      action: dimensions.liquidity.score < 70
        ? 'Build emergency fund to cover 3-6 months of expenses'
        : 'Maintain current savings rate',
    });
  }

  if (dimensions.risk) {
    explanations.push({
      section: 'Credit Risk',
      score: dimensions.risk.score,
      explanation: dimensions.risk.score >= 70
        ? 'Your credit utilization and EMI burden are healthy.'
        : 'High credit usage or EMI load is affecting your score.',
      calculation: 'Based on: Credit Card Utilization % + EMI-to-Income Ratio',
      target: 'Utilization <30%, EMI <40% of income',
      action: dimensions.risk.score < 70
        ? 'Pay down credit card balances and avoid new loans'
        : 'Continue responsible credit use',
    });
  }

  if (dimensions.discipline) {
    explanations.push({
      section: 'Budget Discipline',
      score: dimensions.discipline.score,
      explanation: dimensions.discipline.score >= 70
        ? 'You\'re staying within budget in most categories.'
        : 'Several categories are exceeding their budgets.',
      calculation: 'Based on: % of budget categories within limits',
      target: 'All categories <100% of budget',
      action: dimensions.discipline.score < 70
        ? 'Review overspent categories and adjust habits'
        : 'Maintain spending discipline',
    });
  }

  return {
    summary: `Your score of ${healthScore} is ${
      healthScore >= 80 ? 'EXCELLENT' :
      healthScore >= 65 ? 'GOOD' :
      healthScore >= 50 ? 'FAIR' : 'NEEDS ATTENTION'
    }`,
    explanations,
    dataUsed: Object.keys(breakdown),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Explain a specific recommendation
 */
function explainRecommendation(recommendation) {
  const {
    type = '',
    title = '',
    value = 0,
    context = {},
  } = recommendation;

  const templates = {
    REDUCE_SPENDING: {
      why: 'Your spending in this category exceeds the recommended percentage of income.',
      how: 'We compared your spending against the 50/30/20 budget rule and historical patterns.',
      what: [
        'Review recent transactions in this category',
        'Set a stricter budget limit',
        'Use cash instead of cards for discretionary spending',
      ],
    },
    BUILD_EMERGENCY: {
      why: 'Your emergency fund covers less than 3 months of expenses.',
      how: 'We calculated: Current Savings / Average Monthly Expenses.',
      what: [
        'Set up automatic transfer to savings',
        'Start with ₹1,000 per month',
        'Redirect any windfalls to emergency fund',
      ],
    },
    PAY_CC: {
      why: 'High credit card utilization hurts your credit score.',
      how: 'We detected utilization above 30% threshold.',
      what: [
        'Pay more than minimum balance',
        'Consider balance transfer to lower-rate card',
        'Use debit card temporarily to control spending',
      ],
    },
    REDUCE_EMI: {
      why: 'Your EMI burden exceeds 40% of income, limiting financial flexibility.',
      how: 'We summed all active EMIs and compared to monthly income.',
      what: [
        'Avoid taking new loans',
        'Consider prepaying high-interest EMIs',
        'Refinance if lower rates available',
      ],
    },
  };

  const template = templates[type] || {
    why: 'Based on your financial data analysis.',
    how: 'Calculated using your income, expenses, and financial goals.',
    what: ['Review your financial dashboard for more details.'],
  };

  return {
    title,
    value,
    why: template.why,
    how: template.how,
    actions: template.what,
    confidence: 'HIGH',
    dataPoints: Object.keys(context).length,
  };
}

/**
 * Generate plain-English insight
 */
function generateInsightNarrative(data) {
  const {
    healthScore = 50,
    savingsRate = 0,
    topExpenseCategory = 'Unknown',
    daysLeft = 15,
    projectedOverspend = 0,
    stressLevel = 'CALM',
  } = data;

  let narrative = '';

  // Health-based opening
  if (healthScore >= 80) {
    narrative = 'Great news! Your finances are in excellent shape. ';
  } else if (healthScore >= 60) {
    narrative = 'Your finances are on track, with room for improvement. ';
  } else if (healthScore >= 40) {
    narrative = 'Your financial health needs attention. ';
  } else {
    narrative = 'Alert: Your finances need immediate attention. ';
  }

  // Savings insight
  if (savingsRate >= 20) {
    narrative += `You're saving ${savingsRate}% of income - excellent! `;
  } else if (savingsRate >= 10) {
    narrative += `You're saving ${savingsRate}% - try to reach 20%. `;
  } else if (savingsRate >= 0) {
    narrative += `Your savings rate of ${savingsRate}% is below target. `;
  } else {
    narrative += `You're spending more than you earn - this needs fixing. `;
  }

  // Spending insight
  narrative += `Your top spending category is ${topExpenseCategory}. `;

  // Projection
  if (projectedOverspend > 0) {
    narrative += `At current pace, you'll overspend by ₹${projectedOverspend.toLocaleString()} with ${daysLeft} days left. `;
  }

  // Stress level
  if (stressLevel === 'HIGH' || stressLevel === 'CRITICAL') {
    narrative += 'Several stress signals detected - review alerts above.';
  }

  return {
    narrative: narrative.trim(),
    tone: healthScore >= 60 ? 'POSITIVE' : healthScore >= 40 ? 'CAUTIOUS' : 'URGENT',
    readingTime: '15 seconds',
  };
}

/**
 * Explain calculation methodology
 */
function explainMethodology(calculationType) {
  const methodologies = {
    HEALTH_SCORE: {
      name: 'Financial Health Score',
      formula: 'Weighted average of 5 dimensions',
      inputs: ['Income', 'Expenses', 'Savings', 'Debt', 'Credit Utilization'],
      weights: {
        'Liquidity': '20%',
        'Stability': '20%',
        'Risk': '25%',
        'Discipline': '15%',
        'Growth': '20%',
      },
      range: '0-100',
      interpretation: {
        '80-100': 'Excellent financial health',
        '65-79': 'Good, minor improvements possible',
        '50-64': 'Fair, some areas need attention',
        '35-49': 'Warning, take corrective action',
        '0-34': 'Critical, immediate action needed',
      },
    },
    SAFE_TO_SPEND: {
      name: 'Safe-to-Spend',
      formula: '(Income - Committed Expenses - Current Spent) / Days Left',
      inputs: ['Monthly Income', 'Fixed Expenses', 'EMIs', 'Current Month Spending', 'Days Remaining'],
      interpretation: {
        'GREEN': 'Can spend comfortably',
        'YELLOW': 'Spend carefully',
        'RED': 'Stop discretionary spending',
      },
    },
    EWMA_PREDICTION: {
      name: 'Expense Prediction (EWMA)',
      formula: 'αXt + (1-α)St-1 where α=0.3',
      inputs: ['Historical monthly totals (3+ months)'],
      accuracy: 'Improves with more data points',
      limitations: 'Does not account for irregular events without event override',
    },
    CREDIT_SCORE_PROXY: {
      name: 'Credit Score Proxy',
      formula: 'Weighted factors based on credit bureau models',
      inputs: ['Payment History', 'Utilization', 'Credit Age', 'Credit Mix', 'Recent Inquiries'],
      disclaimer: 'This is an estimate, not your actual credit score',
      range: '300-900',
    },
  };

  return methodologies[calculationType] || {
    name: calculationType,
    description: 'No detailed methodology available',
  };
}

/**
 * Format number with context
 */
function formatWithContext(value, type) {
  const formatters = {
    CURRENCY: {
      format: (v) => `₹${v.toLocaleString('en-IN')}`,
      context: (v) => v >= 100000 ? 'Lakhs' : v >= 1000 ? 'Thousands' : 'Rupees',
    },
    PERCENTAGE: {
      format: (v) => `${v}%`,
      context: (v) => v >= 50 ? 'High' : v >= 25 ? 'Moderate' : 'Low',
    },
    DAYS: {
      format: (v) => `${v} days`,
      context: (v) => v <= 5 ? 'Urgent' : v <= 10 ? 'Soon' : 'Comfortable',
    },
    MONTHS: {
      format: (v) => `${v} months`,
      context: (v) => v >= 12 ? `${(v/12).toFixed(1)} years` : `${v} months`,
    },
  };

  const formatter = formatters[type] || { format: (v) => String(v), context: () => '' };

  return {
    raw: value,
    formatted: formatter.format(value),
    context: formatter.context(value),
  };
}

export const Explainability = {
  explainHealthScore,
  explainRecommendation,
  generateInsightNarrative,
  explainMethodology,
  formatWithContext,
};
