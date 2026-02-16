import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    
    // 1. Fetch last 6 months of expenses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const expenses = await prisma.dailyExpense.findMany({
        where: { 
            userId,
            date: { gte: sixMonthsAgo }
        },
        orderBy: { date: 'desc' },
        select: {
            id: true,
            amount: true,
            date: true,
            category: true,
            note: true, // Use note as description
            // creditSpend description? DailyExpense uses 'note' usually or 'category' if empty.
            // If credit spend, might have better description.
            creditSpend: {
                select: { description: true }
            }
        }
    });

    // 2. Group by normalized description
    const groups = {};

    expenses.forEach(exp => {
        // Prefer CreditSpend description, then note, then category
        let desc = exp.creditSpend?.description || exp.note || exp.category;
        if (!desc) return;

        // Normalize: "Netflix.com" -> "netflix"
        // Remove numbers/dates? "Netflix Jan", "Netflix Feb" -> "Netflix"
        // Simple heuristic: First 2 words or just lowercase
        let normalized = desc.toLowerCase().trim();
        
        // Advanced: Remove dates or digits at end
        normalized = normalized.replace(/\d+[-/]\d+[-/]\d+/, '').trim(); // Remove dates
        normalized = normalized.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/g, '').trim(); // Remove months
        normalized = normalized.replace(/\s+/g, ' '); // Collapse spaces

        if (!groups[normalized]) {
            groups[normalized] = [];
        }
        groups[normalized].push(exp);
    });

    // 3. Analyze groups for patterns
    const candidates = [];

    for (const [name, txs] of Object.entries(groups)) {
        // Needs at least 3 occurrences to be "recurring" (or 2 if monthly exact?)
        if (txs.length < 2) continue;

        // Check variance in amount
        const amounts = txs.map(t => t.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.some(a => Math.abs(a - avgAmount) > (avgAmount * 0.1)); // 10% variance allowed

        if (variance) {
             // Maybe variable bill like Electricity?
             // Allow if dates are roughly 30 days apart
        }

        // Check frequency (roughly monthly?)
        // Sort dates
        const dates = txs.map(t => new Date(t.date)).sort((a,b) => a - b);
        let isMonthly = true;
        for (let i = 1; i < dates.length; i++) {
            const diffDays = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
            if (diffDays < 20 || diffDays > 40) {
                 isMonthly = false; // Not monthly 
                 // Could be weekly? allow 7 days?
                 // For now, let's just return anything > 2 occurrences with similar amount as candidate
            }
        }
        
        // Filter out if already exists in recurring
        const exists = await prisma.recurringExpense.findFirst({
            where: { 
                userId,
                name: { contains: name } // basic check
            }
        });

        if (!exists) {
            candidates.push({
                name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
                amount: Math.round(avgAmount),
                frequency: isMonthly ? 'MONTHLY' : 'IRREGULAR',
                category: txs[0].category || 'Uncategorized',
                occurrences: txs.length,
                lastDate: dates[dates.length - 1]
            });
        }
    }

    return NextResponse.json(candidates);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error detecting subscriptions" }, { status: 500 });
  }
}
