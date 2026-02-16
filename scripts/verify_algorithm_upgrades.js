const { FinanceEngine } = require('../lib/finance');
const { PredictiveEngine } = require('../lib/predictiveEngine');
const { CreditRiskEngine } = require('../lib/creditRiskEngine');

console.log("=== Verifying Algorithm Upgrades & UI Data ===\n");

// 1. Finance Engine - IQR Anomaly Detection
console.log("--- 1. Anomaly Detection (IQR) ---");
const normalHistory = Array(10).fill({ category: 'Food', amount: 500 });
// Outlier: 2000 vs Median 500
const anomalies = FinanceEngine.detectExpenseLeaks(
    [{ category: 'Food', amount: 2000 }], 
    normalHistory
);
console.log("Anomalies found:", anomalies.length);
if (anomalies.length > 0) {
    console.log("Anomaly Message:", anomalies[0].message);
    console.log("Severity:", anomalies[0].severity);
} else {
    console.log("FAILED: No anomaly detected for 4x spend.");
}

// 2. Predictive Engine - Holt's Trend
console.log("\n--- 2. Prediction (Holt's Linear Trend) ---");
const upwardTrend = [1000, 1100, 1200, 1300, 1400]; // Clearly going up
const prediction = PredictiveEngine.predictNextMonthWithCI(upwardTrend);
console.log("History:", upwardTrend.join(', '));
console.log("Predicted Next:", prediction.predicted);
console.log("Method Used:", prediction.method);
if (prediction.predicted > 1400) {
    console.log("SUCCESS: Prediction followed upward trend.");
} else {
    console.log("FAILED: Prediction did not follow trend (Expected > 1400).");
}

// 3. Credit Risk Engine - Granular Scoring
console.log("\n--- 3. Credit Scoring (Granular Mix) ---");
const mixedAccounts = ['CC', 'LOAN_SECURED', 'LOAN_UNSECURED'];
const scoreResult = CreditRiskEngine.calculateCreditScoreProxy({
    paymentHistory: [{ onTime: true }, { onTime: true }],
    creditUtilization: 20, // Good
    creditAge: 36,
    accountMix: mixedAccounts,
    creditMix: 3
});
console.log("Score with Mixed Accounts:", scoreResult.score);
// Check if score is decent (base 300 + ~200 payment + ~150 util + ~60 age + ~45 mix = ~750)
if (scoreResult.score > 700) {
    console.log("SUCCESS: Score reflects balanced mix and good habits.");
} else {
    console.log("WARNING: Score seems low for good inputs.");
}

// 4. API Integrity Check (Mock)
console.log("\n--- 4. API Response Structure Check ---");
const mockApiResponse = {
    anomalies: anomalies,
    prediction: prediction,
    creditScore: scoreResult
};

if (mockApiResponse.anomalies && mockApiResponse.prediction && mockApiResponse.creditScore.accountMix) {
    console.log("SUCCESS: API response structure contains all new fields.");
    console.log("- Anomalies present");
    console.log("- Prediction present");
    console.log("- Credit Score Account Mix present");
} else {
    console.log("FAILED: API response missing some fields.");
}


console.log("\n=== Verification Complete ===");
