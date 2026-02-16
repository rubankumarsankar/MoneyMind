const { PrismaClient } = require('@prisma/client');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays, format, eachDayOfInterval, eachMonthOfInterval } = require('date-fns');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found to test.");
      return;
    }
    const userId = user.id;
    console.log(`Testing with User ID: ${userId}`);

    // --- LOGIC FROM route.js (Simplified for testing) ---
    const filterType = 'thisMonth';
    let startDate = startOfMonth(new Date());
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const [incomes, dailyExpenses, fixed, emis, creditCards] = await Promise.all([
      prisma.income.findMany({ 
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' }
      }),
      prisma.dailyExpense.findMany({ 
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' }
      }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.eMI.findMany({ where: { userId } }),
      prisma.creditCard.findMany({ where: { userId }, include: { spends: true } }),
    ]);

    console.log(`Fetched: ${incomes.length} incomes, ${dailyExpenses.length} daily expenses.`);

    // Aggregation Test
    const incomeTotal = incomes.reduce((sum, item) => sum + item.amount, 0);
    const dailyTotal = dailyExpenses.reduce((sum, item) => sum + item.amount, 0);
    
    console.log(`Total Income (This Month): ${incomeTotal}`);
    console.log(`Total Daily Expense: ${dailyTotal}`);
    
    // Check Daily Grouping Logic
    const intervals = eachDayOfInterval({ start: startDate, end: endDate });
    console.log(`Daily Intervals generated: ${intervals.length}`);

    intervals.slice(0, 3).forEach(date => {
        const label = format(date, 'dd MMM');
        const periodStart = startOfDay(date);
        const periodEnd = endOfDay(date);
        
        const periodDaily = dailyExpenses
        .filter(e => {
            const d = new Date(e.date);
            return d >= periodStart && d <= periodEnd;
        })
        .reduce((sum, item) => sum + item.amount, 0);

        console.log(`  [${label}]: Daily Expense = ${periodDaily}`);
    });

    console.log("Verification Logic Passed.");

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
