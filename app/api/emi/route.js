import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

import { FinanceEngine } from "@/lib/finance";

function calculatePaidMonths(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    
    // Difference in months
    let months = (now.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += now.getMonth();
    
    return months > 0 ? months : 0;
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const emis = await prisma.eMI.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-calculate logic
    const enrichedEMIs = emis.map(emi => {
        const calculatedPaid = calculatePaidMonths(emi.startDate);
        const paidMonths = Math.min(calculatedPaid, emi.totalMonths);
        const remainingMonths = emi.totalMonths - paidMonths;
        const totalPaid = paidMonths * emi.monthlyAmount;
        const remainingAmount = emi.totalAmount - totalPaid;
        
        const status = remainingMonths <= 0 ? "CLOSED" : "ACTIVE";

        return {
            ...emi,
            paidMonths, 
            remainingMonths,
            remainingAmount,
            status
        };
    });

    // Optimize
    const activeEmis = enrichedEMIs.filter(e => e.status === 'ACTIVE');
    const optimization = FinanceEngine.optimizeEMIs(activeEmis);

    return NextResponse.json({
        emis: enrichedEMIs,
        optimization
    });
  } catch (error) {
    console.error("EMI Fetch Error:", error);
    return NextResponse.json({ message: "Error fetching EMIs" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name, totalAmount, monthlyAmount, totalMonths, startDate, interestRate } = await req.json();

    let finalMonthlyAmount = parseFloat(monthlyAmount);
    const rate = interestRate ? parseFloat(interestRate) : null;
    const principal = parseFloat(totalAmount);
    const months = parseInt(totalMonths);

    // Auto-calculate if monthlyAmount is missing or 0, but we have rate and principal
    if ((!finalMonthlyAmount || finalMonthlyAmount <= 0) && rate && principal && months) {
        finalMonthlyAmount = FinanceEngine.calculateEMI(principal, rate, months);
    } 
    // Fallback if no rate: simple division
    else if ((!finalMonthlyAmount || finalMonthlyAmount <= 0) && principal && months) {
        finalMonthlyAmount = principal / months;
    }

    const newEMI = await prisma.eMI.create({
      data: {
        userId: session.user.id,
        name,
        totalAmount: principal,
        monthlyAmount: finalMonthlyAmount,
        totalMonths: months,
        startDate: new Date(startDate),
        interestRate: rate,
      },
    });

    return NextResponse.json(newEMI, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding EMI" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id'));

  try {
    await prisma.eMI.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("EMI Delete Error:", error);
    return NextResponse.json({ message: "Error deleting" }, { status: 500 });
  }
}

// PATCH - Update EMI
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id, name, totalAmount, monthlyAmount, totalMonths, startDate, interestRate, paidMonths } = await req.json();

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount);
    if (monthlyAmount !== undefined) updateData.monthlyAmount = parseFloat(monthlyAmount);
    if (totalMonths !== undefined) updateData.totalMonths = parseInt(totalMonths);
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (interestRate !== undefined) updateData.interestRate = parseFloat(interestRate) || null;
    if (paidMonths !== undefined) updateData.paidMonths = parseInt(paidMonths);

    const updatedEMI = await prisma.eMI.update({
      where: { id: parseInt(id), userId: session.user.id },
      data: updateData,
    });

    return NextResponse.json(updatedEMI);
  } catch (error) {
    console.error("EMI Update Error:", error);
    return NextResponse.json({ message: "Error updating EMI" }, { status: 500 });
  }
}
