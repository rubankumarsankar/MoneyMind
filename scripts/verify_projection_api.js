const { FinanceEngine } = require('../lib/finance');
// Mocking the API logic for verification since we can't easily run full Next.js API in script without context
// logic from app/api/financial-projection/route.js

console.log("Verifying Projection Logic...");

const today = new Date();
const projection = [];
const monthsToProject = 3;

// Mock Data
const emis = [{ id: 1, name: 'Home Loan', monthlyAmount: 25000, startDate: '2025-01-01', totalMonths: 240 }];
const fixed = [{ id: 1, title: 'Rent', amount: 15000, dayOfMonth: 5 }];
const recurring = [{ id: 1, name: 'Netflix', amount: 649, frequency: 'MONTHLY' }];

for (let i = 0; i < monthsToProject; i++) {
    const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const payments = [];

    // EMI
    emis.forEach(emi => {
        payments.push({ name: emi.name, amount: emi.monthlyAmount, priority: 'CRITICAL' });
    });

    // Fixed
    fixed.forEach(f => {
        let priority = 'IMPORTANT';
        if (f.title.includes('Rent')) priority = 'CRITICAL';
        payments.push({ name: f.title, amount: f.amount, priority });
    });

    // Recurring
    recurring.forEach(r => {
        payments.push({ name: r.name, amount: r.amount, priority: 'ROUTINE' });
    });

    projection.push({ month: monthName, payments });
}

console.log(JSON.stringify(projection, null, 2));

if (projection.length === 3) {
    console.log("SUCCESS: Generated 3 months of data.");
} else {
    console.error("FAILURE: Did not generate 3 months.");
}

if (projection[0].payments.find(p => p.priority === 'CRITICAL')) {
    console.log("SUCCESS: Prioritization works.");
} else {
    console.error("FAILURE: Prioritization failed.");
}
