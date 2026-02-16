import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { emiId, accountId, date } = await req.json();
    const userId = session.user.id;
    const paymentDate = new Date(date || new Date());

    const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch EMI
        const emi = await tx.eMI.findUnique({
            where: { id: parseInt(emiId) }
        });

        if (!emi) throw new Error("EMI not found");

        // 2. Create Daily Expense
        const expense = await tx.dailyExpense.create({
            data: {
                userId,
                category: 'EMI',
                amount: emi.monthlyAmount,
                date: paymentDate,
                note: `EMI Payment: ${emi.name}`,
                paymentMethod: 'ACCOUNT', 
                accountId: parseInt(accountId)
            }
        });

        // 3. Deduct from Account
        await tx.account.update({
            where: { id: parseInt(accountId) },
            data: { balance: { decrement: emi.monthlyAmount } }
        });

        // 4. Update EMI Progress
        const updatedEMI = await tx.eMI.update({
            where: { id: parseInt(emiId) },
            data: { 
                paidMonths: { increment: 1 }
            }
        });

        return updatedEMI;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error paying EMI" }, { status: 500 });
  }
}
