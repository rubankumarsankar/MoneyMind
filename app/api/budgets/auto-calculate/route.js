import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    
    // 1. Get data from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setDate(1); // Start of month

    const expenses = await prisma.dailyExpense.aggregate({
        _sum: { amount: true },
        where: {
            userId,
            date: { gte: threeMonthsAgo }
        },
        groupBy: ['category', 'date'] // Group by category and date? No, just category.
        // Wait, to get monthly average, I need to know how many months passed or group by month.
        // Simplest: Group by Category, divide total by 3.
    });

    const categoryTotals = await prisma.dailyExpense.groupBy({
        by: ['category'],
        _sum: { amount: true },
        where: {
            userId,
            date: { gte: threeMonthsAgo }
        }
    });

    let count = 0;

    // 2. Process each category
    for (const cat of categoryTotals) {
        if (!cat.category || cat.category === 'Uncategorized') continue;

        const total = cat._sum.amount || 0;
        const avg = total / 3;

        if (avg < 100) continue; // Ignore tiny categories

        // Round to nearest 100 or 500
        let suggestedLimit = Math.ceil(avg / 100) * 100;
        
        // Add 10% buffer?
        suggestedLimit = Math.ceil((suggestedLimit * 1.1) / 100) * 100;

        // 3. Upsert Budget
        await prisma.budget.upsert({
            where: {
                userId_category: { userId, category: cat.category }
            },
            update: {
                monthlyLimit: suggestedLimit,
                alertThreshold: 80 // Default
            },
            create: {
                userId,
                category: cat.category,
                monthlyLimit: suggestedLimit,
                alertThreshold: 80
            }
        });
        count++;
    }

    return NextResponse.json({ message: "Budgets auto-set successfully", count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error setting budgets" }, { status: 500 });
  }
}
