import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { salaryDate, monthlyIncome, bankName, bankBalance, accountPurpose, categories } = body;

    const userId = session.user.id;

    // 1. Update User Profile with salary date
    await prisma.user.update({
      where: { id: userId },
      data: {
        salaryDate,
        onboardingCompleted: true,
      },
    });

    // 2. Create Primary Account first (so we can link income to it)
    let createdAccountId = null;
    if (bankName && bankBalance !== undefined) {
      const existingAccount = await prisma.account.findFirst({
        where: { userId, name: bankName },
      });

      if (!existingAccount) {
        const account = await prisma.account.create({
          data: {
            userId,
            name: bankName,
            type: "BANK",
            purpose: accountPurpose || "SALARY", // SALARY, SAVINGS, SPENDING
            balance: bankBalance,
          },
        });
        createdAccountId = account.id;
      } else {
        // Update existing account with purpose
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: { purpose: accountPurpose || "SALARY", balance: bankBalance },
        });
        createdAccountId = existingAccount.id;
      }
    }

    // 3. Add Monthly Income Source linked to account
    if (monthlyIncome > 0) {
      const existingIncome = await prisma.income.findFirst({
        where: { userId, source: "Salary" },
      });

      if (!existingIncome) {
        await prisma.income.create({
          data: {
            userId,
            amount: monthlyIncome,
            source: "Salary",
            date: new Date(),
            accountId: createdAccountId, // Link to the created account
          },
        });
      } else {
        // Update existing income amount and link
        await prisma.income.update({
          where: { id: existingIncome.id },
          data: { amount: monthlyIncome, accountId: createdAccountId },
        });
      }
    }

    // 4. Save Categories
    if (categories && categories.length > 0) {
      await prisma.category.deleteMany({ where: { userId } });

      const categoryData = categories.map(c => ({
        userId,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
      }));

      await prisma.category.createMany({
        data: categoryData,
      });
    }

    return NextResponse.json({ message: "Setup complete", accountId: createdAccountId });
  } catch (error) {
    console.error("Onboarding Error:", error);
    return NextResponse.json({ message: "Internal Error", error: error.message }, { status: 500 });
  }
}
