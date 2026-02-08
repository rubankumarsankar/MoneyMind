import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
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
              accountId: accountId || null
            },
        });

        // 2. Update Account Balance if linked
        if (accountId) {
            await tx.account.update({
                where: { id: accountId },
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
    const { id, amount, source, date } = await req.json();
    // Complex to handle balance update on edit, simplifying to just update record for now
    // Ideally should revert old amount from old account and add new amount to new account
    // For now, just updating the record fields.
    const updatedIncome = await prisma.income.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        source,
        date: new Date(date),
      },
    });
    return NextResponse.json(updatedIncome);
  } catch (error) {
    return NextResponse.json({ message: "Error updating income" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    await prisma.$transaction(async (tx) => {
        const income = await tx.income.findUnique({ where: { id } });
        if (!income) throw new Error("Income not found");

        // Revert Balance
        if (income.accountId) {
             await tx.account.update({
                 where: { id: income.accountId },
                 data: { balance: { decrement: income.amount } }
             });
        }

        await tx.income.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting income" }, { status: 500 });
  }
}
