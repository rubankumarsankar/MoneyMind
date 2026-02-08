import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const expenses = await prisma.dailyExpense.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      include: {
        account: true,
        creditCard: true
      }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching daily expenses" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { category, amount, date, note, paymentMethod, accountId, creditCardId } = await req.json();
    const parsedAmount = parseFloat(amount);
    const userId = session.user.id;
    const expenseDate = new Date(date);

    // --- Anomaly Detection Logic (Pre-computation) ---
    // Rule: if currentMonth(category) > avg(last3Months(category)) * 1.3
    
    // 1. Get current month total for this category (excluding this new one)
    const startOfMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
    const endOfMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0);
    
    // Use unique variable names to avoid conflicts if 'expenses' is used elsewhere (though it was in GET)
    // This is POST, so 'expenses' from GET isn't in scope, but let's be safe.
    const currentMonthData = await prisma.dailyExpense.aggregate({
        _sum: { amount: true },
        where: {
            userId,
            category,
            date: { gte: startOfMonth, lte: endOfMonth }
        }
    });
    const currentTotal = (currentMonthData._sum.amount || 0) + parsedAmount;

    // 2. Get average of last 3 months
    // Go back 3 months from start of month
    const startOfHistory = new Date(startOfMonth);
    startOfHistory.setMonth(startOfHistory.getMonth() - 3);
    
    const historyData = await prisma.dailyExpense.aggregate({
        _sum: { amount: true },
        where: {
            userId,
            category,
            date: { gte: startOfHistory, lt: startOfMonth }
        }
    });
    
    const historyTotal = historyData._sum.amount || 0;
    const monthlyAvg = historyTotal / 3;

    let isAnomaly = false;
    if (monthlyAvg > 0 && currentTotal > monthlyAvg * 1.3 && (currentTotal - monthlyAvg) > 500) {
        isAnomaly = true;
    }
    // ------------------------------------------------

    // Transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Daily Expense
        const expense = await tx.dailyExpense.create({
            data: {
                userId,
                category,
                amount: parsedAmount,
                date: expenseDate,
                note,
                isAnomaly, // Stored in DB
                paymentMethod,
                accountId: paymentMethod === 'ACCOUNT' || paymentMethod === 'UPI' ? accountId : null,
                creditCardId: paymentMethod === 'CREDIT_CARD' ? creditCardId : null
            }
        });

        // 2. Handle Payment Logic
        if (paymentMethod === 'CREDIT_CARD' && creditCardId) {
            // Create Credit Spend linked to this expense
            await tx.creditSpend.create({
                data: {
                    cardId: creditCardId,
                    amount: parsedAmount,
                    description: `${category} (Expense)`,
                    date: expenseDate,
                    type: 'SPEND',
                    dailyExpenseId: expense.id
                }
            });
        } else if ((paymentMethod === 'ACCOUNT' || paymentMethod === 'UPI') && accountId) {
            // Deduct from Account Balance
            await tx.account.update({
                where: { id: accountId },
                data: {
                    balance: { decrement: parsedAmount }
                }
            });
        }

        return expense;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding daily expense" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

  try {
    // We need to revert the payment logic if deleting
    await prisma.$transaction(async (tx) => {
        const expense = await tx.dailyExpense.findUnique({
            where: { id },
             include: { creditSpend: true }
        });

        if (!expense) throw new Error("Expense not found");

        // Revert Account Balance
        if ((expense.paymentMethod === 'ACCOUNT' || expense.paymentMethod === 'UPI') && expense.accountId) {
             await tx.account.update({
                 where: { id: expense.accountId },
                 data: { balance: { increment: expense.amount } }
             });
        }

        // CreditSpend will be deleted automatically due to Cascade? 
        // No, relation is on CreditSpend.dailyExpenseId? 
        // Let's check schema: `DailyExpense` has `creditSpend CreditSpend?`. 
        // `CreditSpend` has `dailyExpenseId ... onDelete: Cascade`? 
        // No, current schema doesn't specify cascade for this relation side.
        // Wait, schema says: `dailyExpense   DailyExpense? @relation(fields: [dailyExpenseId], references: [id])`.
        // Default is usually restrictive or set null unless Cascade is specified.
        // I should probably manually delete it or rely on Cascade if I added it. 
        // I didn't add Cascade to `dailyExpenseId` relation.
        // So I should delete it manually if it exists.
        
        if (expense.creditSpend) {
            await tx.creditSpend.delete({ where: { id: expense.creditSpend.id } });
        }

        await tx.dailyExpense.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error deleting" }, { status: 500 });
  }
}
