import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const incomes = await prisma.income.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      include: {
        account: true
      }
    });
    return NextResponse.json(incomes);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching income" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, source, date, accountId } = body;
    const parsedAmount = parseFloat(amount);

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Income
        const newIncome = await tx.income.create({
            data: {
              userId: session.user.id,
              amount: parsedAmount,
              source,
              date: new Date(date),
              accountId: accountId ? parseInt(accountId) : null
            },
        });

        // 2. Update Account Balance if linked
        if (accountId) {
            await tx.account.update({
                where: { id: parseInt(accountId) },
                data: {
                    balance: { increment: parsedAmount }
                }
            });
        }

        return newIncome;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding income" }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id, amount, source, date, accountId } = await req.json();
    const newAmount = parseFloat(amount);
    const newAccountId = accountId ? parseInt(accountId) : null;

    const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch old income
        const oldIncome = await tx.income.findUnique({
            where: { id: parseInt(id) }
        });

        if (!oldIncome) throw new Error("Income not found");

        // 2. Revert logic (Deduct old amount from old account)
        if (oldIncome.accountId) {
            await tx.account.update({
                where: { id: oldIncome.accountId },
                data: { balance: { decrement: oldIncome.amount } }
            });
        }

        // 3. Update Income
        const updatedIncome = await tx.income.update({
            where: { id: parseInt(id) },
            data: {
                amount: newAmount,
                source,
                date: new Date(date),
                accountId: newAccountId // Allow changing account
            }
        });

        // 4. Apply new logic (Add new amount to new account)
        if (newAccountId) {
            await tx.account.update({
                where: { id: newAccountId },
                data: { balance: { increment: newAmount } }
            });
        }

        return updatedIncome;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error updating income" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });
    const idInt = parseInt(id);

    await prisma.$transaction(async (tx) => {
        const income = await tx.income.findUnique({ where: { id: idInt } });
        if (!income) throw new Error("Income not found");

        // Revert Balance
        if (income.accountId) {
             await tx.account.update({
                 where: { id: income.accountId },
                 data: { balance: { decrement: income.amount } }
             });
        }

        await tx.income.delete({ where: { id: idInt } });
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting income" }, { status: 500 });
  }
}
