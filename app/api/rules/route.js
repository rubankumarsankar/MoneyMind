import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const rules = await prisma.categoryRule.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching rules" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { pattern, category, matchType } = await req.json();
    
    // Check for duplicate pattern
    const existingRule = await prisma.categoryRule.findFirst({
        where: {
            userId: session.user.id,
            pattern
        }
    });

    if (existingRule) {
        return NextResponse.json({ message: "Rule for this keyword already exists" }, { status: 400 });
    }

    const newRule = await prisma.categoryRule.create({
      data: {
        userId: session.user.id,
        pattern,
        category,
        matchType: matchType || 'CONTAINS'
      }
    });

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding rule" }, { status: 500 });
  }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

    try {
        await prisma.categoryRule.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting" }, { status: 500 });
    }
}
