import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getCustomMonthRange, getCurrentCustomMonth } from "@/lib/dateUtils";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  
  // Enhanced filtering
  const filterType = searchParams.get('filter') || 'thisMonth';
  const days = parseInt(searchParams.get('days') || '30', 10);
  
  // Calculate number of months to show based on filter
  let months = 1;
  if (filterType === 'today') months = 1;
  else if (filterType === 'thisMonth') months = 1;
  else if (filterType === '3month') months = 3;
  else if (filterType === '6month') months = 6;
  else if (filterType === '1year') months = 12;
  else months = Math.max(1, Math.ceil(days / 30));

  try {
    const [incomes, fixed, daily, emis, creditCards] = await Promise.all([
      prisma.income.findMany({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.dailyExpense.findMany({ where: { userId } }),
      prisma.eMI.findMany({ where: { userId } }),
      prisma.creditCard.findMany({ where: { userId }, include: { spends: true } }),
    ]);

    // Calculate date range based on filter
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let filterStart = new Date();
    let filterEnd = new Date(today);
    
    if (filterType === 'today') {
      filterStart.setHours(0, 0, 0, 0);
    } else {
      filterStart.setDate(filterStart.getDate() - days);
      filterStart.setHours(0, 0, 0, 0);
    }

    // Generate labels and data based on filter type
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    const savingsData = [];

    if (filterType === 'today') {
      // Single data point for today
      labels.push('Today');
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayIncome = incomes
        .filter(inc => {
          const date = new Date(inc.date);
          return date >= todayStart && date <= todayEnd;
        })
        .reduce((sum, curr) => sum + curr.amount, 0);

      const todayDaily = daily
        .filter(exp => {
          const date = new Date(exp.date);
          return date >= todayStart && date <= todayEnd;
        })
        .reduce((sum, curr) => sum + curr.amount, 0);

      incomeData.push(todayIncome);
      expenseData.push(todayDaily);
      savingsData.push(todayIncome - todayDaily);
    } else {
      // Monthly data points using custom month ranges
      const { start: currentCycleStart } = getCurrentCustomMonth(6);
      
      for (let i = months - 1; i >= 0; i--) {
        const refDate = new Date(currentCycleStart);
        refDate.setMonth(refDate.getMonth() - i);
        const { start: monthStart, end: monthEnd, label } = getCustomMonthRange(refDate, 6);
        
        labels.push(label);

        // Filter Income
        const monthlyIncome = incomes
          .filter(inc => {
            const date = new Date(inc.date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, curr) => sum + curr.amount, 0);

        // Filter Daily Expense
        const monthlyDaily = daily
          .filter(exp => {
            const date = new Date(exp.date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, curr) => sum + curr.amount, 0);

        // Fixed (static per month)
        const monthlyFixed = fixed.reduce((sum, curr) => sum + curr.amount, 0);
        
        // EMI (active during this month)
        const monthlyEMI = emis
          .filter(emi => new Date(emi.startDate) <= monthEnd)
          .reduce((sum, curr) => sum + curr.monthlyAmount, 0);

        // CC Spends
        const monthlyCCSpends = creditCards.reduce((acc, card) => {
          return acc + card.spends
            .filter(s => s.type !== 'PAYMENT' && !s.dailyExpenseId)
            .filter(s => {
              const d = new Date(s.date);
              return d >= monthStart && d <= monthEnd;
            })
            .reduce((sum, s) => sum + s.amount, 0);
        }, 0);

        const totalExpense = monthlyDaily + monthlyFixed + monthlyEMI + monthlyCCSpends;
        
        incomeData.push(monthlyIncome);
        expenseData.push(totalExpense);
        savingsData.push(monthlyIncome - totalExpense);
      }
    }

    // Category breakdown for the filtered period
    const categoryMap = {};
    daily
      .filter(exp => {
        const date = new Date(exp.date);
        return date >= filterStart && date <= filterEnd;
      })
      .forEach(exp => {
        const cat = exp.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
      });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Fixed expenses list
    const fixedExpensesList = fixed.map(f => ({
      id: f.id,
      name: f.name,
      amount: f.amount,
      category: f.category
    }));

    // Period totals
    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpense = expenseData.reduce((a, b) => a + b, 0);
    
    const yearlyComparison = {
        income: totalIncome,
        expense: totalExpense,
        savings: totalIncome - totalExpense,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
    };

    return NextResponse.json({
        labels,
        income: incomeData,
        expense: expenseData,
        savings: savingsData,
        categoryBreakdown,
        fixedExpenses: fixedExpensesList,
        totalFixed: fixed.reduce((sum, f) => sum + f.amount, 0),
        totalEMI: emis.reduce((sum, e) => sum + e.monthlyAmount, 0),
        yearlyComparison,
        filterType,
        periodLabel: filterType === 'today' ? 'Today' : 
                     filterType === 'thisMonth' ? 'This Month' :
                     filterType === '3month' ? 'Last 3 Months' :
                     filterType === '6month' ? 'Last 6 Months' : 'Last Year'
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error generating reports" }, { status: 500 });
  }
}
