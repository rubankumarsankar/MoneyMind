/**
 * Credit & Risk Engine v3 - Credit Score & Risk Management
 * @module CreditRiskEngine
 * 
 * Credit score proxy, utilization forecasting, billing optimization
 */

/**
 * Calculate credit score proxy (simplified model)
 * Based on: Payment history, utilization, credit age, mix
 */
function calculateCreditScoreProxy(data) {
  const {
    paymentHistory = [],      // Array of { onTime: boolean, amount: number }
    creditUtilization = 0,    // Current utilization percentage
    creditAge = 12,           // Oldest credit account in months
    creditMix = 0,            // Count of accounts (legacy)
    accountMix = [],          // Array of types: ['CC', 'LOAN_SECURED', 'LOAN_UNSECURED']
    recentInquiries = 0,      // Hard inquiries in last 6 months
  } = data;

  let score = 300; // Base score (300-900 range)

  // 1. Payment History (35% weight) - up to 210 points
  if (paymentHistory.length > 0) {
    const onTimeCount = paymentHistory.filter(p => p.onTime).length;
    const onTimeRate = onTimeCount / paymentHistory.length;
    // Exponential decay for missed payments
    score += Math.round(Math.pow(onTimeRate, 2) * 210);
  } else {
    score += 105; // Neutral if no history
  }

  // 2. Credit Utilization (30% weight) - up to 180 points
  // Non-linear drop: Low utilization is good, high is very bad
  let utilizationScore = 180;
  if (creditUtilization > 0) {
      if (creditUtilization > 80) utilizationScore = 0;
      else if (creditUtilization > 60) utilizationScore = 40;
      else if (creditUtilization > 40) utilizationScore = 90;
      else if (creditUtilization > 10) utilizationScore = 150;
      else utilizationScore = 180; // < 10% is excellent
  }
  score += utilizationScore;

  // 3. Credit Age (15% weight) - up to 90 points
  let ageScore = 0;
  if (creditAge >= 84) ageScore = 90; // 7+ years
  else if (creditAge >= 60) ageScore = 75; // 5+ years
  else if (creditAge >= 36) ageScore = 60; // 3+ years
  else if (creditAge >= 24) ageScore = 45; // 2+ years
  else if (creditAge >= 12) ageScore = 30; // 1+ year
  else ageScore = 15;
  score += ageScore;

  // 4. Credit Mix (10% weight) - up to 60 points
  let mixScore = 0;
  const types = new Set(accountMix.length > 0 ? accountMix : []);
  if (types.has('LOAN_SECURED')) mixScore += 30; // Home/Auto loans boost score
  if (types.has('CC')) mixScore += 10;
  if (types.has('LOAN_UNSECURED')) mixScore += 5;
  
  // Fallback to simple count if no types provided
  if (accountMix.length === 0) {
      mixScore = Math.min(60, creditMix * 10);
  }
  score += Math.min(60, mixScore);

  // 5. Recent Inquiries (10% weight) - up to 60 points
  let inquiryScore = 60;
  // Penalty grows with inquiries
  if (recentInquiries >= 5) inquiryScore = 0;
  else if (recentInquiries >= 3) inquiryScore = 20;
  else if (recentInquiries >= 1) inquiryScore = 40;
  score += inquiryScore;

  // Clamp to valid range
  score = Math.max(300, Math.min(900, Math.round(score)));

  // Rating
  let rating = 'POOR';
  if (score >= 800) rating = 'EXCELLENT';
  else if (score >= 740) rating = 'VERY_GOOD';
  else if (score >= 670) rating = 'GOOD';
  else if (score >= 580) rating = 'FAIR';

  return {
    score,
    rating,
    accountMix,
    activeAccounts: creditMix,
    breakdown: {
      paymentHistory: { weight: '35%', points: Math.round(paymentHistory.length > 0 ? (paymentHistory.filter(p => p.onTime).length / paymentHistory.length) * 210 : 105) },
      utilization: { weight: '30%', points: utilizationScore, current: `${creditUtilization}%` },
      creditAge: { weight: '15%', points: ageScore, months: creditAge },
      creditMix: { weight: '10%', points: mixScore, types: creditMix },
      inquiries: { weight: '10%', points: inquiryScore, count: recentInquiries },
    },
    tips: generateCreditTips(creditUtilization, paymentHistory, creditAge),
  };
}

function generateCreditTips(utilization, history, age) {
  const tips = [];
  
  if (utilization > 30) {
    tips.push(`📉 Reduce utilization to under 30% (currently ${utilization}%)`);
  }
  if (history.some(p => !p.onTime)) {
    tips.push('⏰ Set up autopay to never miss payments');
  }
  if (age < 24) {
    tips.push('📅 Keep old accounts open to increase credit age');
  }
  if (tips.length === 0) {
    tips.push('✅ Excellent credit habits! Keep it up.');
  }
  
  return tips;
}

/**
 * Forecast credit utilization for next billing cycle
 */
function forecastUtilization(data) {
  const {
    currentSpend = 0,
    creditLimit = 0,
    daysElapsed = 15,
    daysInCycle = 30,
    historicalDailyAvg = 0,
  } = data;

  const currentUtilization = creditLimit > 0 ? (currentSpend / creditLimit) * 100 : 0;
  
  // Project to end of cycle
  const dailyRate = daysElapsed > 0 ? currentSpend / daysElapsed : historicalDailyAvg;
  const projectedSpend = dailyRate * daysInCycle;
  const projectedUtilization = creditLimit > 0 ? (projectedSpend / creditLimit) * 100 : 0;

  // Risk assessment
  let risk = 'LOW';
  let action = null;
  
  if (projectedUtilization > 70) {
    risk = 'HIGH';
    action = `Make a payment of ₹${Math.round(projectedSpend - creditLimit * 0.3)} before cycle end`;
  } else if (projectedUtilization > 50) {
    risk = 'MEDIUM';
    action = 'Consider mid-cycle payment to keep utilization low';
  } else if (projectedUtilization > 30) {
    risk = 'LOW';
    action = 'On track for healthy utilization';
  }

  return {
    current: {
      spend: Math.round(currentSpend),
      utilization: Math.round(currentUtilization),
    },
    projected: {
      spend: Math.round(projectedSpend),
      utilization: Math.round(projectedUtilization),
    },
    daysRemaining: daysInCycle - daysElapsed,
    dailyBudget: Math.round((creditLimit * 0.3 - currentSpend) / Math.max(1, daysInCycle - daysElapsed)),
    risk,
    action,
  };
}

/**
 * Optimize billing cycle - suggest best day to pay
 */
function optimizeBillingCycle(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return [];
  }

  return cards.map(card => {
    const {
      name = 'Card',
      billingDate = 1,
      dueDate = 15,
      currentSpend = 0,
      limit = 0,
    } = card;

    // Best payment date: 2-3 days after billing date for reporting
    const optimalPayDate = billingDate + 3 > 28 ? billingDate + 3 - 28 : billingDate + 3;
    
    // Calculate statement utilization if paid before billing date
    const payBeforeBilling = currentSpend > limit * 0.3;

    return {
      name,
      billingDate,
      dueDate,
      currentUtilization: limit > 0 ? Math.round((currentSpend / limit) * 100) : 0,
      optimalPayDate,
      recommendation: payBeforeBilling
        ? `Pay ₹${Math.round(currentSpend - limit * 0.1)} before ${billingDate}th to reduce statement balance`
        : `Pay full balance by ${dueDate}th`,
      strategy: payBeforeBilling ? 'PRE_STATEMENT_PAYMENT' : 'FULL_PAYMENT_BY_DUE',
    };
  });
}

/**
 * Suggest best card for a purchase
 */
function suggestCardForPurchase(cards, purchaseAmount, category = 'general') {
  if (!Array.isArray(cards) || cards.length === 0) {
    return { suggestion: null, reason: 'No cards available' };
  }

  // Score each card
  const scoredCards = cards.map(card => {
    const {
      name = 'Card',
      limit = 0,
      currentSpend = 0,
      rewards = {},
      dueDate = 15,
    } = card;

    const availableCredit = limit - currentSpend;
    const newUtilization = limit > 0 ? ((currentSpend + purchaseAmount) / limit) * 100 : 100;

    let score = 0;
    let reasons = [];

    // Can't use if not enough credit
    if (availableCredit < purchaseAmount) {
      return { ...card, score: -1, reason: 'Insufficient credit' };
    }

    // Utilization impact
    if (newUtilization <= 30) {
      score += 50;
      reasons.push('Low utilization impact');
    } else if (newUtilization <= 50) {
      score += 30;
    } else {
      score += 10;
      reasons.push('High utilization impact');
    }

    // Rewards
    const categoryReward = rewards[category] || rewards.general || 1;
    score += categoryReward * 20;
    if (categoryReward > 1) {
      reasons.push(`${categoryReward}x rewards on ${category}`);
    }

    // Days until due (more days = better)
    const today = new Date().getDate();
    const daysUntilDue = dueDate >= today ? dueDate - today : 30 - today + dueDate;
    score += daysUntilDue;
    if (daysUntilDue > 15) {
      reasons.push('Long interest-free period');
    }

    return {
      ...card,
      score,
      newUtilization: Math.round(newUtilization),
      reasons,
    };
  });

  const validCards = scoredCards.filter(c => c.score >= 0);
  if (validCards.length === 0) {
    return { suggestion: null, reason: 'No card has sufficient credit' };
  }

  const best = validCards.sort((a, b) => b.score - a.score)[0];

  return {
    suggestion: best.name,
    score: best.score,
    newUtilization: best.newUtilization,
    reasons: best.reasons,
    allOptions: validCards.map(c => ({
      name: c.name,
      score: c.score,
      utilization: c.newUtilization,
    })),
  };
}

/**
 * Calculate debt-to-income ratio
 */
function calculateDTI(monthlyDebt, monthlyIncome) {
  if (monthlyIncome <= 0) {
    return { ratio: 0, status: 'UNKNOWN', message: 'Income required' };
  }

  const dti = (monthlyDebt / monthlyIncome) * 100;

  let status = 'EXCELLENT';
  let message = 'Very healthy debt level';

  if (dti > 50) {
    status = 'CRITICAL';
    message = 'Dangerous debt level - avoid new debt';
  } else if (dti > 43) {
    status = 'HIGH';
    message = 'May have trouble getting approved for loans';
  } else if (dti > 36) {
    status = 'MODERATE';
    message = 'Acceptable but try to reduce';
  } else if (dti > 28) {
    status = 'GOOD';
    message = 'Healthy debt level';
  }

  return {
    ratio: Math.round(dti),
    status,
    message,
    monthlyDebt,
    maxRecommendedDebt: Math.round(monthlyIncome * 0.36),
    roomForDebt: Math.max(0, Math.round(monthlyIncome * 0.36 - monthlyDebt)),
  };
}

export const CreditRiskEngine = {
  calculateCreditScoreProxy,
  forecastUtilization,
  optimizeBillingCycle,
  suggestCardForPurchase,
  calculateDTI,
};
