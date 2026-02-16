import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, addMonths, isSameMonth, setDate } from "date-fns";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const today = new Date();
    const monthsToProject = 3;
    const projection = [];

    // Fetch recurring data sources
    const [emis, fixedExpenses, recurringExpenses] = await Promise.all([
      prisma.eMI.findMany({ where: { userId } }),
      prisma.fixedExpense.findMany({ where: { userId } }),
      prisma.recurringExpense.findMany({ where: { userId, isActive: true } }),
    ]);

    // Generate projection for next 3 months
    for (let i = 0; i < monthsToProject; i++) {
        const currentMonthDate = addMonths(today, i);
        const monthStart = startOfMonth(currentMonthDate);
        const monthEnd = endOfMonth(currentMonthDate);
        const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const payments = [];

        // 1. Process EMIs
        emis.forEach(emi => {
            const startDate = new Date(emi.startDate);
            // Check if EMI is active in this month
            // Simple logic: if start date is before month end AND total months not exceeded
            // (Refined logic would check exact count, but date diff is good proxy for projection)
            const monthsSinceStart = (currentMonthDate.getFullYear() - startDate.getFullYear()) * 12 + (currentMonthDate.getMonth() - startDate.getMonth());
            
            if (monthsSinceStart >= 0 && monthsSinceStart < emi.totalMonths) {
                 payments.push({
                     id: `emi-${emi.id}-${i}`,
                     name: emi.name,
                     amount: emi.monthlyAmount,
                     date: setDate(currentMonthDate, new Date(emi.startDate).getDate()), // Assuming due date = start day
                     type: 'EMI',
                     priority: 'CRITICAL', // EMIs are always critical (impact CIBIL)
                     status: 'Create logic to check if paid' // simplified for now
                 });
            }
        });

        // 2. Process Fixed Expenses
        fixedExpenses.forEach(fixed => {
             // Dynamic Priority based on amount and keywords
             let priority = 'IMPORTANT';
             const lowerTitle = fixed.title.toLowerCase();
             
             if (lowerTitle.includes('rent') || lowerTitle.includes('insurance') || lowerTitle.includes('loan') || fixed.amount > 10000) {
                 priority = 'CRITICAL';
             } else if (fixed.amount > 2000) {
                 priority = 'IMPORTANT';
             } else {
                 priority = 'ROUTINE';
             }

             payments.push({
                 id: `fixed-${fixed.id}-${i}`,
                 name: fixed.title,
                 amount: fixed.amount,
                 date: setDate(currentMonthDate, fixed.dayOfMonth),
                 type: 'FIXED',
                 priority, 
                 status: 'PENDING'
             });
        });

        // 3. Process Recurring Expenses (Subscriptions)
        recurringExpenses.forEach(sub => {
            if (sub.frequency === 'MONTHLY' || sub.frequency === 'YEARLY') { // Basic handling
                let subDate = currentMonthDate;
                if (sub.dayOfMonth) subDate = setDate(currentMonthDate, sub.dayOfMonth);
                
                // Skip if yearly and not this month (simplified logic for now, assuming monthly for v1 projection)
                if (sub.frequency === 'MONTHLY') {
                    payments.push({
                        id: `sub-${sub.id}-${i}`,
                        name: sub.name,
                        amount: sub.amount,
                        date: subDate,
                        type: 'SUBSCRIPTION',
                        priority: sub.amount > 1000 ? 'IMPORTANT' : 'ROUTINE',
                        status: 'PENDING'
                    });
                }
            }
        });

        // Sort by Date
        payments.sort((a, b) => a.date - b.date);

        // Group by Priority for UI display
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

        projection.push({
            month: monthName,
            payments,
            totalAmount,
            stats: {
                critical: payments.filter(p => p.priority === 'CRITICAL').reduce((sum, p) => sum + p.amount, 0),
                important: payments.filter(p => p.priority === 'IMPORTANT').reduce((sum, p) => sum + p.amount, 0),
            }
        });
    }

    return NextResponse.json({ projection });

  } catch (error) {
    console.error("Projection Error:", error);
    return NextResponse.json({ message: "Error calculating projection" }, { status: 500 });
  }
}
