const { RulesEngine } = require('../lib/rulesEngine');

console.log("=== Verifying Auto-Categorization Logic ===\n");

// Mock Rules
const rules = [
    { pattern: 'uber', category: 'Transport', matchType: 'CONTAINS' },
    { pattern: 'netflix', category: 'Entertainment', matchType: 'CONTAINS' },
    { pattern: 'salary', category: 'Income', matchType: 'EXACT' },
    { pattern: 'aws', category: 'Cloud', matchType: 'STARTS_WITH' }
];

console.log("Active Rules:", rules.length);

// Test Cases
const tests = [
    { input: 'Uber ride to work', expected: 'Transport' },
    { input: 'Netflix Subscription', expected: 'Entertainment' },
    { input: 'My Salary', expected: null }, // Exact match fail
    { input: 'Salary', expected: 'Income' }, // Exact match success
    { input: 'AWS Bill', expected: 'Cloud' }, // Starts with success
    { input: 'Payment to AWS', expected: null }, // Starts with fail (is contains)
    { input: 'Unknown Expense', expected: null }
];

let passed = 0;
tests.forEach(test => {
    const result = RulesEngine.matchCategory(test.input, rules);
    const isPass = result === test.expected;
    if (isPass) passed++;
    console.log(`Input: "${test.input}" -> Matched: "${result}" [${isPass ? 'PASS' : 'FAIL'}]`);
});

console.log(`\nResult: ${passed}/${tests.length} passed.`);

if (passed === tests.length) {
    console.log("\nSUCCESS: Rules Engine logic verified.");
} else {
    console.log("\nFAILED: Some tests failed.");
}
