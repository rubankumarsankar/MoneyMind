import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    
    // 1. Fetch all rules for user
    const rules = await prisma.categoryRule.findMany({
        where: { userId },
        orderBy: { pattern: 'asc' } // Order might matter if we want priority
    });

    if (rules.length === 0) {
        return NextResponse.json({ message: "No rules defined", count: 0 });
    }

    // 2. Fetch all expenses (or maybe just uncategorized ones? User might want to re-run everything)
    // Let's fetch ALL for now to ensure comprehensive refiling.
    // Optimization: filtering by `category: 'Uncategorized'` or just fetch everything.
    // For now, let's process everything to correct mistakes.
    const expenses = await prisma.dailyExpense.findMany({
        where: { userId },
        select: { id: true, note: true } // Only need ID and Note
    });

    let updateCount = 0;
    const updates = [];

    // 3. Match and Prepare Updates
    for (const expense of expenses) {
        if (!expense.note) continue;

        const noteLower = expense.note.toLowerCase();
        let matchedCategory = null;

        // Simple Rule Engine Logic (Duplicate of lib/rulesEngine to avoid importing if possible, or import common)
        // Let's import the common one or rewrite simple logic here.
        // Rewriting simple logic for speed in loop
        
        for (const rule of rules) {
            const patternLower = rule.pattern.toLowerCase();
            if (rule.matchType === 'EXACT' && noteLower === patternLower) {
                matchedCategory = rule.category;
                break;
            } else if (rule.matchType === 'STARTS_WITH' && noteLower.startsWith(patternLower)) {
                matchedCategory = rule.category;
                break;
            } else if ((rule.matchType === 'CONTAINS' || !rule.matchType) && noteLower.includes(patternLower)) {
                matchedCategory = rule.category;
                break;
            }
        }

        if (matchedCategory) {
            updates.push(prisma.dailyExpense.update({
                where: { id: expense.id },
                data: { category: matchedCategory }
            }));
            updateCount++;
        }
    }

    // 4. Execute Batch Updates
    // Prisma doesn't have a true bulk update for different values yet without raw SQL or loop.
    // Use transaction for safety
    if (updates.length > 0) {
        await prisma.$transaction(updates);
    }

    return NextResponse.json({ message: "Rules applied successfully", count: updateCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error applying rules" }, { status: 500 });
  }
}
