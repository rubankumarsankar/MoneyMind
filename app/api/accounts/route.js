import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching accounts" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name, type, purpose, balance } = await req.json();
    const newAccount = await prisma.account.create({
      data: {
        userId: session.user.id,
        name,
        type,
        purpose: purpose || 'GENERAL',
        balance: parseFloat(balance),
      },
    });
    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding account" }, { status: 500 });
  }
}

export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
    try {
      const { id, name, type, purpose, balance } = await req.json();
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: {
          name,
          type,
          purpose: purpose || 'GENERAL',
          balance: parseFloat(balance),
        },
      });
      return NextResponse.json(updatedAccount);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ message: "Error updating account" }, { status: 500 });
    }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
  
    try {
      await prisma.account.delete({ where: { id } });
      return NextResponse.json({ message: "Deleted" });
    } catch (error) {
      return NextResponse.json({ message: "Error deleting account" }, { status: 500 });
    }
}
