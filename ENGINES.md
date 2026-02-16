# MoneyMind Engine Documentation

## Overview

MoneyMind is an intelligent personal finance management system built with Next.js 16. This documentation covers the engine architecture and available functions.

---

## Engine Architecture

MoneyMind uses a layered engine architecture:

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  (Dashboard, Planning, Components)                   │
├─────────────────────────────────────────────────────┤
│                   API Routes                         │
│  (/api/dashboard, /api/planning, /api/planning/sim) │
├─────────────────────────────────────────────────────┤
│                 v3 Engines (Intelligence)            │
│  PlanningEngine │ PredictiveEngine │ CreditRiskEngine│
│                 │  Explainability                    │
├─────────────────────────────────────────────────────┤
│                 v2 Engines (Adaptive)                │
│  FinanceEngine │ BudgetEngine │ NotificationsEngine │
│                 │ AutomationEngine                   │
├─────────────────────────────────────────────────────┤
│                    Database                          │
│  (Prisma + PostgreSQL)                              │
└─────────────────────────────────────────────────────┘
```

---

## v2 Engines (Automation & Adaptive)

### FinanceEngine (`lib/finance.js`)

Core financial calculations with multi-dimensional health scoring.

| Function | Description |
|----------|-------------|
| `calculateFinancialHealth(data)` | Overall health score (0-100) |
| `calculateHealthDimensions(data)` | **v2** 5-dimension score (Liquidity, Stability, Risk, Discipline, Growth) |
| `detectFinancialStress(data)` | **v2** Stress signals with severity |
| `generateTrendSignals(expenses)` | **v2** Per-category trend analysis |
| `calculateSafeToSpend(data)` | Daily/weekly spending limit |
| `analyzeBudgetRule503020(data)` | 50/30/20 rule compliance |

### BudgetEngine (`lib/budgetEngine.js`)

Adaptive budget management with learning algorithms.

| Function | Description |
|----------|-------------|
| `suggestBudgets(incomes, expenses)` | Auto-suggest category budgets |
| `suggestDynamicBudgets(userId, history)` | **v2** ML-lite adaptive budgets |
| `rebalanceBudgets(budgets)` | **v2** Auto-reallocation from underspent |
| `lockEssentialCategories(expenses, income)` | **v2** Protect essential spending |
| `generateContextualAlerts(budgets)` | **v2** Category-aware alerts |

### NotificationsEngine (`lib/notifications.js`)

Context-aware notification system with batching.

| Function | Description |
|----------|-------------|
| `generateNotifications(data)` | Standard financial alerts |
| `generateContextualNotifications(data)` | **v2** Cause + Impact + Recommendation |
| `generateDailyDigest(data)` | **v2** Morning summary digest |
| `batchNotifications(notifications)` | **v2** Group by priority |

### AutomationEngine (`lib/automationEngine.js`) - NEW

Event-driven automation for real-time financial management.

| Function | Description |
|----------|-------------|
| `processEvent(event, data)` | Main event router |
| `handleSalaryEvent(data)` | Monthly reset on salary credit |
| `handleExpenseEvent(expense, state)` | Budget + anomaly check |
| `handleEMIEvent(emi, dueDate)` | Due date reminders |
| `handleCreditUtilization(cards)` | Credit risk monitoring |
| `autoAdjustBudgets(budgets, history)` | Adaptive limit adjustment |
| `autoAdjustSavings(rate, income, expenses)` | Dynamic savings rate |

---

## v3 Engines (Predictive & Planning)

### PlanningEngine (`lib/planningEngine.js`) - NEW

Future financial simulations and what-if analysis.

| Function | Description |
|----------|-------------|
| `simulateCashFlow(data, months)` | N-month income/expense projection |
| `calculateGoalTimeline(goal, current, contribution)` | Months to reach savings goal |
| `calculatePrepaymentImpact(emi, amount)` | EMI prepayment interest savings |
| `calculateFinancialFreedomDate(data)` | Debt-free timeline with phases |
| `analyzeWhatIf(scenario, currentState)` | Interactive scenario simulation |
| `performStressTest(data, incomeDropPercent)` | Survival analysis |

### PredictiveEngine (`lib/predictiveEngine.js`) - NEW

Enhanced forecasting with multiple prediction models.

| Function | Description |
|----------|-------------|
| `calculateSeasonalEWMA(history)` | Seasonal-aware exponential smoothing |
| `predictWithSalaryCycle(data)` | Salary-day-aware projections |
| `predictWithEvents(baseline, events)` | Event override predictions |
| `predictByCategory(categoryHistory)` | Per-category forecasts |
| `predictNextMonthWithCI(history)` | Prediction with confidence interval |
| `detectSpendingAnomalies(expenses, avg)` | Outlier detection |

### CreditRiskEngine (`lib/creditRiskEngine.js`) - NEW

Credit score estimation and optimization.

| Function | Description |
|----------|-------------|
| `calculateCreditScoreProxy(data)` | Estimated credit score (300-900) |
| `forecastUtilization(data)` | End-of-cycle utilization prediction |
| `optimizeBillingCycle(cards)` | Optimal payment timing |
| `suggestCardForPurchase(cards, amount, category)` | Best card recommendation |
| `calculateDTI(debt, income)` | Debt-to-income ratio analysis |

### Explainability (`lib/explainability.js`) - NEW

Transparent AI with plain-English explanations.

| Function | Description |
|----------|-------------|
| `explainHealthScore(data)` | Score breakdown with dimension details |
| `explainRecommendation(rec)` | Why + How + What for each suggestion |
| `generateInsightNarrative(data)` | Human-readable financial summary |
| `explainMethodology(type)` | Calculation documentation |
| `formatWithContext(value, type)` | Contextual value formatting |

---

### AuthEngine (`lib/authEngine.js`) - NEW

Centralized authentication logic for Credentials and OAuth.

| Function | Description |
|----------|-------------|
| `validateCredentials(email, password)` | Verify login and active status |
| `handleGoogleLogin(user, account)` | Manage OAuth user creation/linking |

---

## API Routes

### Dashboard API (`/api/dashboard`)

Returns comprehensive financial overview including:

- Health score (single + 5 dimensions)
- Stress analysis
- Budget status
- Trend signals
- Notifications (batched)

### Planning API (`/api/planning`)

Returns planning simulations:

- Cash flow projection (6 months)
- Goals timeline
- Financial freedom roadmap
- Stress test results
- Credit score proxy

### Simulation API (`/api/planning/simulate`)

POST endpoint for what-if scenarios:

```json
{
  "scenario": {
    "incomeChange": 10000,
    "expenseChange": 0,
    "newEMI": 5000
  }
}
```

---

## UI Components

### v2 Components

| Component | File | Purpose |
|-----------|------|---------|
| `HealthDimensions` | `components/HealthDimensions.js` | 5-dimension health bars |
| `StressIndicator` | `components/StressIndicator.js` | Stress level with signals |
| `CategoryTrends` | `components/CategoryTrends.js` | Trend arrows per category |

### Pages

| Page | Path | Features |
|------|------|----------|
| Dashboard | `/dashboard` | Overview, health, budgets, notifications |
| Planning | `/planning` | Cash flow, goals, what-if, freedom date |

---

## Testing

Run engine verification tests:

```bash
node test-engines.js
```

Expected output: All 7 engines verified with 40+ functions.

---

## Version History

| Version | Phase | Features |
|---------|-------|----------|
| v1 | Base | Core finance calculations |
| v2 | Phase 1 | Multi-dimensional health, adaptive budgets, context notifications |
| v3 | Phase 2 | Planning, predictions, credit risk, explainability |

---

*Generated: February 2026*
