const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found.");
        return;
    }
    const userId = user.id;
    console.log(`Verifying Planning Logic for User ID: ${userId}`);

    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    threeMonthsAgo.setDate(1);

    console.log(`Fetching data since: ${threeMonthsAgo.toISOString()}`);

    // Fetch Data
    const incomes = await prisma.income.findMany({ 
        where: { userId, date: { gte: threeMonthsAgo } } 
    });
    
    const dailyExpenses = await prisma.dailyExpense.findMany({ 
        where: { userId, date: { gte: threeMonthsAgo } } 
    });

    // 1. Verify Income Average
    const totalRecentIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const monthlyIncome = totalRecentIncome > 0 ? (totalRecentIncome / 3) : 0;
    
    console.log(`\n--- Income Calculation ---`);
    console.log(`Total Income (Last 3 Months): ${totalRecentIncome}`);
    console.log(`Calculated Monthly Average: ${monthlyIncome.toFixed(2)}`);

    // 2. Verify Variable Expense Average
    const expensesByMonth = {};
    dailyExpenses.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getMonth()}-${d.getFullYear()}`;
        expensesByMonth[key] = (expensesByMonth[key] || 0) + e.amount;
    });

    const numMonths = Object.keys(expensesByMonth).length || 1;
    const totalVar = dailyExpenses.reduce((sum, d) => sum + d.amount, 0);
    const avgVar = totalVar / (numMonths > 0 ? numMonths : 1);

    console.log(`\n--- Variable Expense Calculation ---`);
    console.log(`Total Variable Expenses (Last 3 Months): ${totalVar}`);
    console.log(`Months with Data: ${numMonths} (${Object.keys(expensesByMonth).join(', ')})`);
    console.log(`Calculated Monthly Average: ${avgVar.toFixed(2)}`);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
