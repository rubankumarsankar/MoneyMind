/**
 * MoneyMind Engine - Simple Verification Tests
 * Verifies all engines are exported and callable
 */

const engines = [
  { name: 'FinanceEngine', path: './lib/finance.js', key: 'FinanceEngine' },
  { name: 'BudgetEngine', path: './lib/budgetEngine.js', key: 'BudgetEngine' },
  { name: 'NotificationsEngine', path: './lib/notifications.js', key: 'NotificationsEngine' },
  { name: 'PlanningEngine', path: './lib/planningEngine.js', key: 'PlanningEngine' },
  { name: 'PredictiveEngine', path: './lib/predictiveEngine.js', key: 'PredictiveEngine' },
  { name: 'CreditRiskEngine', path: './lib/creditRiskEngine.js', key: 'CreditRiskEngine' },
  { name: 'Explainability', path: './lib/explainability.js', key: 'Explainability' },
];

const passed = [];
const failed = [];

console.log('\n🔍 === MONEYMIND ENGINE VERIFICATION ===\n');

engines.forEach(({ name, path, key }) => {
  try {
    const module = require(path);
    const engine = module[key];
    
    if (!engine) {
      failed.push(`${name}: Not exported from module`);
      console.log(`❌ ${name}: Export not found`);
      return;
    }
    
    const functions = Object.keys(engine).filter(k => typeof engine[k] === 'function');
    
    if (functions.length === 0) {
      failed.push(`${name}: No functions found`);
      console.log(`❌ ${name}: No functions`);
      return;
    }
    
    console.log(`✅ ${name}: ${functions.length} functions`);
    console.log(`   └─ ${functions.join(', ')}`);
    passed.push(name);
    
  } catch (err) {
    failed.push(`${name}: ${err.message}`);
    console.log(`❌ ${name}: ${err.message.split('\n')[0]}`);
  }
});

// Quick functional tests
console.log('\n🧪 === FUNCTIONAL TESTS ===\n');

try {
  const { FinanceEngine } = require('./lib/finance.js');
  const result = FinanceEngine.calculateHealthDimensions({ totalIncome: 100000 });
  console.log(`✅ FinanceEngine.calculateHealthDimensions → overallScore: ${result.overallScore}`);
  passed.push('FinanceEngine.calculateHealthDimensions');
} catch (e) {
  console.log(`❌ FinanceEngine.calculateHealthDimensions: ${e.message}`);
  failed.push('FinanceEngine.calculateHealthDimensions');
}

try {
  const { PlanningEngine } = require('./lib/planningEngine.js');
  const result = PlanningEngine.simulateCashFlow({ monthlyIncome: 100000, fixedExpenses: 30000 }, 3);
  console.log(`✅ PlanningEngine.simulateCashFlow → ${result.simulation?.length || 0} months`);
  passed.push('PlanningEngine.simulateCashFlow');
} catch (e) {
  console.log(`❌ PlanningEngine.simulateCashFlow: ${e.message}`);
  failed.push('PlanningEngine.simulateCashFlow');
}

try {
  const { CreditRiskEngine } = require('./lib/creditRiskEngine.js');
  const result = CreditRiskEngine.calculateCreditScoreProxy({ creditUtilization: 25 });
  console.log(`✅ CreditRiskEngine.calculateCreditScoreProxy → score: ${result.score}`);
  passed.push('CreditRiskEngine.calculateCreditScoreProxy');
} catch (e) {
  console.log(`❌ CreditRiskEngine.calculateCreditScoreProxy: ${e.message}`);
  failed.push('CreditRiskEngine.calculateCreditScoreProxy');
}

try {
  const { PredictiveEngine } = require('./lib/predictiveEngine.js');
  const result = PredictiveEngine.predictNextMonthWithCI([50000, 55000, 52000]);
  console.log(`✅ PredictiveEngine.predictNextMonthWithCI → predicted: ${result.predicted}`);
  passed.push('PredictiveEngine.predictNextMonthWithCI');
} catch (e) {
  console.log(`❌ PredictiveEngine.predictNextMonthWithCI: ${e.message}`);
  failed.push('PredictiveEngine.predictNextMonthWithCI');
}

try {
  const { Explainability } = require('./lib/explainability.js');
  const result = Explainability.explainMethodology('HEALTH_SCORE');
  console.log(`✅ Explainability.explainMethodology → ${result.name}`);
  passed.push('Explainability.explainMethodology');
} catch (e) {
  console.log(`❌ Explainability.explainMethodology: ${e.message}`);
  failed.push('Explainability.explainMethodology');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 TEST SUMMARY`);
console.log(`✅ Passed: ${passed.length}`);
console.log(`❌ Failed: ${failed.length}`);
console.log('='.repeat(50));

if (failed.length > 0) {
  console.log('\n❌ FAILURES:');
  failed.forEach(f => console.log(`  - ${f}`));
}

process.exit(failed.length > 0 ? 1 : 0);
