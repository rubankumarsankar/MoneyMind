import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays, format, eachDayOfInterval, eachMonthOfInterval, isSameMonth, isSameDay } from "date-fns";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  
  const filterType = searchParams.get('filter') || 'thisMonth';
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');
  const viewMode = searchParams.get('view') || 'auto'; // 'auto', 'daily', 'monthly'

  // 1. Determine Date Range
  let startDate = new Date();
  let endDate = new Date(); // Today end
  endDate.setHours(23, 59, 59, 999);

  if (customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch(filterType) {
      case 'today':
        startDate = startOfDay(new Date());
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(new Date(), 1));
        endDate = endOfDay(subDays(new Date(), 1));
        break;
      case 'last7':
        startDate = startOfDay(subDays(new Date(), 6));
        break;
      case 'last30':
        startDate = startOfDay(subDays(new Date(), 29));
        break;
      case 'thisMonth':
        startDate = startOfMonth(new Date());
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(new Date(), 1));
        endDate = endOfMonth(subMonths(new Date(), 1));
        break;
      case '3month':
        startDate = startOfMonth(subMonths(new Date(), 2));
        break;
      case '6month':
        startDate = startOfMonth(subMonths(new Date(), 5));
        break;
      case '1year':
        startDate = startOfMonth(subMonths(new Date(), 11));
        break;
      case 'all':
        // Find first transaction date or default to 1 year ago
        const firstIncome = await prisma.income.findFirst({ where: { userId }, orderBy: { date: 'asc' } });
        const firstExpense = await prisma.dailyExpense.findFirst({ where: { userId }, orderBy: { date: 'asc' } });
        const d1 = firstIncome?.date || new Date();
        const d2 = firstExpense?.date || new Date();
        startDate = d1 < d2 ? d1 : d2;
        if (!firstIncome && !firstExpense) startDate = subMonths(new Date(), 11);
        startDate = startOfMonth(startDate);
        break;
      default:
        startDate = startOfMonth(new Date());
    }
  }

  // 2. Determine Grouping (Daily vs Monthly)
  let groupBy = 'monthly';
  if (viewMode === 'daily') groupBy = 'daily';
  else if (viewMode === 'monthly') groupBy = 'monthly';
  else {
    // Auto determines based on duration
    const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    groupBy = diffDays <= 60 ? 'daily' : 'monthly';
  }

  try {
    // 3. Fetch Data within Range
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

    // 4. Process Data Intervals
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    const savingsData = [];

    let intervals = [];
    if (groupBy === 'daily') {
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    }

    intervals.forEach(date => {
      let label = '';
      let periodStart, periodEnd;

      if (groupBy === 'daily') {
        label = format(date, 'dd MMM'); // 12 Feb
        periodStart = startOfDay(date);
        periodEnd = endOfDay(date);
      } else {
        label = format(date, 'MMM yyyy'); // Feb 2024
        periodStart = startOfMonth(date);
        periodEnd = endOfMonth(date);
      }
      labels.push(label);

      // --- Aggregation Logic ---

      // Income
      const periodIncome = incomes
        .filter(i => {
            const d = new Date(i.date);
            return d >= periodStart && d <= periodEnd;
        })
        .reduce((sum, item) => sum + item.amount, 0);

      // Daily Expenses
      const periodDaily = dailyExpenses
        .filter(e => {
            const d = new Date(e.date);
            return d >= periodStart && d <= periodEnd;
        })
        .reduce((sum, item) => sum + item.amount, 0);

      // Fixed Expenses (Only applies once per month for monthly view, 
      // or distributed/on specific day for daily view? simplistic: monthly view includes full amount, daily view typically doesn't show fixed unless on specific day.
      // For simplicity in this graph:
      // - Monthly View: Add all fixed expenses + EMIs
      // - Daily View: Only show Daily Expenses + Credit Spends. Fixed/EMI usually don't map to specific days easily without 'dayOfMonth' logic.
      // Let's implement DayOfMonth logic for Daily View if possible, or just ignore Fixed for daily trends to avoid spikes.
      // BETTER UX: Pro-rate or show on 1st? Let's show on specific 'dayOfMonth' if daily view.

      let periodFixed = 0;
      let periodEMI = 0;

      if (groupBy === 'monthly') {
          // Full amount for the month
          periodFixed = fixed.reduce((sum, f) => sum + f.amount, 0);
          periodEMI = emis
            .filter(e => new Date(e.startDate) <= periodEnd) // Active EMIs
            .reduce((sum, e) => sum + e.monthlyAmount, 0);
      } else {
          // Daily view: check if today is the day
          const day = date.getDate();
          periodFixed = fixed
            .filter(f => f.dayOfMonth === day)
            .reduce((sum, f) => sum + f.amount, 0);
            
          // EMIs usually on 1st or specific date. Let's assume 5th for now if not specified or check schema? Schema doesn't have day for EMI.
          // Schema EMI has startDate. We can use startDate's day.
          periodEMI = emis
            .filter(e => {
                const emiDay = new Date(e.startDate).getDate();
                return emiDay === day && new Date(e.startDate) <= date;
            })
            .reduce((sum, e) => sum + e.monthlyAmount, 0);
      }

      // Credit Card Spends (Transaction Date)
      const periodCC = creditCards.reduce((total, card) => {
         const cardSpends = card.spends.filter(s => {
             const d = new Date(s.date);
             return !s.dailyExpenseId && // avoidable double counting if linked
                    s.type !== 'PAYMENT' &&
                    d >= periodStart && d <= periodEnd;
         });
         return total + cardSpends.reduce((sum, s) => sum + s.amount, 0);
      }, 0);

      const totalPeriodExpense = periodDaily + periodFixed + periodEMI + periodCC;
      
      incomeData.push(periodIncome);
      expenseData.push(totalPeriodExpense);
      savingsData.push(periodIncome - totalPeriodExpense);
    });

    // 5. Category Breakdown (Aggregated for entire range)
    const categoryMap = {};
    dailyExpenses.forEach(exp => {
       const cat = exp.category || 'Other';
       categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
    });
    
    // Add Fixed/EMI Categories too?
    fixed.forEach(f => {
       const cat = f.category || 'Bills';
       // Only add if we are in a range that covers this fixed expense? 
       // For simple Pie chart, we assume "Average Monthly" breakdown or "Actual Spent in Range".
       // If range < 1 month, fixed expenses might distort it if simply added. 
       // Logic: If range >= 1 month, add occurrences.
       // For now, let's keep Pie Chart strictly for "Daily/Variable" spending as that's what user controls most.
       // Or we can add them. Let's add them for completeness if view is Monthly.
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);


    // 6. Totals
    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpense = expenseData.reduce((a, b) => a + b, 0);

    return NextResponse.json({
        labels,
        income: incomeData,
        expense: expenseData,
        savings: savingsData,
        categoryBreakdown,
        // Summary Cards
        yearlyComparison: {
            income: totalIncome,
            expense: totalExpense,
            savings: totalIncome - totalExpense,
            savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
        },
        fixedExpenses: fixed, 
        totalFixed: fixed.reduce((sum, f) => sum + f.amount, 0),
        totalEMI: emis.reduce((sum, e) => sum + e.monthlyAmount, 0),
        meta: {
            startDate,
            endDate,
            groupBy
        }
    });

  } catch (error) {
    console.error("Report API Error:", error);
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 });
  }
}
