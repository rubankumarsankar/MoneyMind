/**
 * Predictive Engine v3 - Enhanced Forecasting
 * @module PredictiveEngine
 * 
 * Combines EWMA, seasonal patterns, and event-aware predictions
 */

/**
 * Enhanced EWMA with seasonal awareness
 */
function calculateSeasonalEWMA(history, alpha = 0.3) {
  if (!Array.isArray(history) || history.length === 0) {
    return { predicted: 0, confidence: 0 };
  }

  // Standard EWMA
  let ewma = history[0];
  for (let i = 1; i < history.length; i++) {
    ewma = alpha * history[i] + (1 - alpha) * ewma;
  }

  // Seasonal adjustment (if 12+ months of data)
  let seasonalFactor = 1;
  if (history.length >= 12) {
    const currentMonth = new Date().getMonth();
    const sameMonthValues = history.filter((_, idx) => (history.length - 1 - idx) % 12 === 0);
    if (sameMonthValues.length > 1) {
      const avgSameMonth = sameMonthValues.reduce((a, b) => a + b, 0) / sameMonthValues.length;
      const overallAvg = history.reduce((a, b) => a + b, 0) / history.length;
      seasonalFactor = overallAvg > 0 ? avgSameMonth / overallAvg : 1;
    }
  }

  const predicted = Math.round(ewma * seasonalFactor);
  const confidence = Math.min(95, 50 + history.length * 5);

  return { predicted, confidence, seasonalFactor: seasonalFactor.toFixed(2) };
}

/**
 * Predict with salary cycle awareness
 */
function predictWithSalaryCycle(data) {
  const {
    salaryDay = 1,         // Day of month salary is credited
    salaryAmount = 0,
    expenseHistory = [],   // Daily expenses for last 30 days
    today = new Date(),
  } = data;

  const dayOfMonth = today.getDate();
  const daysUntilSalary = salaryDay >= dayOfMonth 
    ? salaryDay - dayOfMonth 
    : 30 - dayOfMonth + salaryDay;

  // Calculate average daily expense
  const avgDailyExpense = expenseHistory.length > 0
    ? expenseHistory.reduce((a, b) => a + b, 0) / expenseHistory.length
    : 0;

  // Project expenses until salary
  const projectedExpenses = avgDailyExpense * daysUntilSalary;

  // Pre-salary vs post-salary spending patterns
  const preSalaryDays = [];
  const postSalaryDays = [];
  
  expenseHistory.forEach((expense, idx) => {
    const expenseDay = (dayOfMonth - expenseHistory.length + idx + 30) % 30;
    if (expenseDay < salaryDay) {
      preSalaryDays.push(expense);
    } else {
      postSalaryDays.push(expense);
    }
  });

  const preSalaryAvg = preSalaryDays.length > 0
    ? preSalaryDays.reduce((a, b) => a + b, 0) / preSalaryDays.length
    : avgDailyExpense;
  
  const postSalaryAvg = postSalaryDays.length > 0
    ? postSalaryDays.reduce((a, b) => a + b, 0) / postSalaryDays.length
    : avgDailyExpense;

  return {
    daysUntilSalary,
    projectedExpenses: Math.round(projectedExpenses),
    avgDailyExpense: Math.round(avgDailyExpense),
    spendingPattern: {
      preSalary: Math.round(preSalaryAvg),
      postSalary: Math.round(postSalaryAvg),
      difference: Math.round(postSalaryAvg - preSalaryAvg),
      insight: postSalaryAvg > preSalaryAvg * 1.3
        ? 'Higher spending right after salary - consider setting aside savings first'
        : 'Consistent spending pattern - good discipline',
    },
  };
}

/**
 * Event-aware prediction override
 */
function predictWithEvents(baselinePrediction, upcomingEvents) {
  if (!Array.isArray(upcomingEvents) || upcomingEvents.length === 0) {
    return { adjusted: baselinePrediction, events: [], adjustmentReason: 'No events' };
  }

  let adjustment = 0;
  const eventImpacts = [];

  upcomingEvents.forEach(event => {
    const { type, amount = 0, description = '' } = event;

    switch (type) {
      case 'FESTIVAL':
        adjustment += amount || baselinePrediction * 0.2; // 20% increase
        eventImpacts.push({ type, impact: '+20%', description: description || 'Festival spending' });
        break;
      case 'VACATION':
        adjustment += amount || baselinePrediction * 0.5; // 50% increase
        eventImpacts.push({ type, impact: '+50%', description: description || 'Vacation expenses' });
        break;
      case 'BONUS':
        adjustment -= amount * 0.1; // Save 10% of bonus
        eventImpacts.push({ type, impact: 'Savings boost', description: description || 'Bonus month' });
        break;
      case 'EMI_END':
        adjustment -= amount; // Reduction
        eventImpacts.push({ type, impact: `-₹${amount}`, description: description || 'EMI ending' });
        break;
      case 'MAJOR_PURCHASE':
        adjustment += amount;
        eventImpacts.push({ type, impact: `+₹${amount}`, description: description || 'Major purchase' });
        break;
      default:
        if (amount) adjustment += amount;
    }
  });

  return {
    baseline: baselinePrediction,
    adjustment: Math.round(adjustment),
    adjusted: Math.round(baselinePrediction + adjustment),
    events: eventImpacts,
    adjustmentReason: eventImpacts.map(e => e.description).join(', '),
  };
}

/**
 * Category-level prediction
 */
function predictByCategory(categoryHistory) {
  if (!categoryHistory || Object.keys(categoryHistory).length === 0) {
    return [];
  }

  return Object.entries(categoryHistory).map(([category, history]) => {
    const values = Array.isArray(history) ? history : [history];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Trend detection
    let trend = 'STABLE';
    if (values.length >= 2) {
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
      if (change > 15) trend = 'INCREASING';
      else if (change < -15) trend = 'DECREASING';
    }

    // Apply trend to prediction
    let predicted = avg;
    if (trend === 'INCREASING') predicted *= 1.1;
    else if (trend === 'DECREASING') predicted *= 0.9;

    return {
      category,
      average: Math.round(avg),
      predicted: Math.round(predicted),
      trend,
      dataPoints: values.length,
    };
  }).sort((a, b) => b.predicted - a.predicted);
}

/**
 * Predict next month total with confidence interval
 */
/**
 * Holt's Linear Trend Method for Forecasting
 * Handles data with trends (increasing/decreasing) better than simple EWMA
 */
function calculateHoltsTrend(history, alpha = 0.3, beta = 0.1) {
  if (!Array.isArray(history) || history.length === 0) return { level: 0, trend: 0, forecast: 0 };
  
  let level = history[0];
  let trend = history.length > 1 ? history[1] - history[0] : 0;
  
  for (let i = 1; i < history.length; i++) {
    const prevLevel = level;
    const value = history[i];
    
    // Level equation
    level = alpha * value + (1 - alpha) * (prevLevel + trend);
    
    // Trend equation
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  
  return {
    level,
    trend,
    forecast: Math.round(level + trend)
  };
}

/**
 * Predict next month total with confidence interval
 * Uses Holt's Method for trend-aware prediction
 */
function predictNextMonthWithCI(history, confidence = 0.95) {
  if (!Array.isArray(history) || history.length < 3) {
    return { 
      predicted: 0, 
      low: 0, 
      high: 0, 
      confidence: 0,
      message: 'Insufficient data for prediction (Need 3+ months)' 
    };
  }

  const n = history.length;
  const mean = history.reduce((a, b) => a + b, 0) / n;
  
  // Standard deviation
  const variance = history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Use Holt's Method instead of simple EWMA
  const { forecast: predicted } = calculateHoltsTrend(history, 0.3, 0.1);

  // Confidence interval (using t-distribution approximation)
  // For small N, t-value is larger. 
  // N=3 -> 2.92, N=6 -> 2.015, N>30 -> 1.96 (Z-score)
  let tValue = 1.96;
  if (n < 5) tValue = 2.776;
  else if (n < 10) tValue = 2.262;
  else if (n < 30) tValue = 2.045;

  const marginOfError = tValue * (stdDev / Math.sqrt(n)); // Standard Error

  return {
    predicted: Math.round(predicted),
    low: Math.round(predicted - marginOfError),
    high: Math.round(predicted + marginOfError),
    confidence: Math.round(confidence * 100),
    stdDev: Math.round(stdDev),
    volatility: mean > 0 ? Math.round((stdDev / mean) * 100) : 0,
    method: 'Holt-Winters (Linear Trend)'
  };
}

/**
 * Anomaly detection in spending
 */
function detectSpendingAnomalies(recentExpenses, historicalAvg, threshold = 2) {
  if (!Array.isArray(recentExpenses) || recentExpenses.length === 0) {
    return { anomalies: [], hasAnomaly: false };
  }

  const mean = historicalAvg || recentExpenses.reduce((a, b) => a + b, 0) / recentExpenses.length;
  const variance = recentExpenses.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / recentExpenses.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = recentExpenses
    .map((value, idx) => {
      const zScore = stdDev > 0 ? (value - mean) / stdDev : 0;
      if (Math.abs(zScore) > threshold) {
        return {
          index: idx,
          value,
          zScore: zScore.toFixed(2),
          type: zScore > 0 ? 'HIGH' : 'LOW',
          deviation: `${Math.round(Math.abs(zScore) * 100)}% ${zScore > 0 ? 'above' : 'below'} normal`,
        };
      }
      return null;
    })
    .filter(Boolean);

  return {
    anomalies,
    hasAnomaly: anomalies.length > 0,
    mean: Math.round(mean),
    stdDev: Math.round(stdDev),
    threshold,
  };
}

export const PredictiveEngine = {
  calculateSeasonalEWMA,
  calculateHoltsTrend,
  predictWithSalaryCycle,
  predictWithEvents,
  predictByCategory,
  predictNextMonthWithCI,
  detectSpendingAnomalies,
};
