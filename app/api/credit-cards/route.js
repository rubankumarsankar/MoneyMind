import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { FinanceEngine } from "@/lib/finance";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const cards = await prisma.creditCard.findMany({
      where: { userId: session.user.id },
      include: { spends: true },
    });

    // Calculate dynamic properties
    const enrichedCards = cards.map(card => {
        const totalSpends = card.spends
            .filter(s => s.type === 'SPEND' || !s.type) // Handle legacy null as SPEND
            .reduce((acc, curr) => acc + curr.amount, 0);
            
        const totalPayments = card.spends
            .filter(s => s.type === 'PAYMENT')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const currentBalance = totalSpends - totalPayments;
        
        // V3: Add Risk Analysis
        const riskAnalysis = FinanceEngine.calculateCreditRisk(
            card.limit, 
            currentBalance, 
            { dueDate: card.billingDay }
        );

        return {
            ...card,
            totalSpends, // Total ever spent
            totalPayments,
            currentBalance,
            riskAnalysis
        };
    });

    return NextResponse.json(enrichedCards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json({ message: "Error fetching cards" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name, limit, billingDay } = await req.json();

    const newCard = await prisma.creditCard.create({
      data: {
        userId: session.user.id,
        name,
        limit: parseFloat(limit),
        billingDay: parseInt(billingDay),
      },
    });

    return NextResponse.json(newCard, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error adding card" }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id, name, limit, billingDay } = await req.json();
    const updatedCard = await prisma.creditCard.update({
      where: { id },
      data: {
        name,
        limit: parseFloat(limit),
        billingDay: parseInt(billingDay),
      },
    });
    return NextResponse.json(updatedCard);
  } catch (error) {
    return NextResponse.json({ message: "Error updating card" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    await prisma.creditCard.delete({ where: { id: id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting" }, { status: 500 });
  }
}
