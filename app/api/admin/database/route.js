import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Whitelist of allowed models to prevent unauthorized access to internal/hidden tables if any
const ALLOWED_MODELS = [
  'user',
  'account',
  'income',
  'fixedExpense',
  'dailyExpense',
  'category',
  'budget',
  'saving',
  'investment',
  'creditCard',
  'creditSpend',
  'eMI', // Prisma model names are usually camelCase, need to verify strict casing
  'borrow',
  'recurringExpense',
  'financialSnapshot',
  'notification',
  'systemSettings',
  'passwordReset'
];

export async function GET(req) {
  const session = await getServerSession(authOptions);

  // 1. Security Check
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const model = searchParams.get('model');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // 2. Validation
  if (!model || !ALLOWED_MODELS.includes(model)) {
    return NextResponse.json({ 
      error: 'Invalid or missing model', 
      allowedModels: ALLOWED_MODELS 
    }, { status: 400 });
  }

  try {
    // 3. Data Fetching
    // Prisma client instance keys are typically lowerCamelCase of the model name
    // e.g. model User -> prisma.user
    const prismaModel = prisma[model];

    if (!prismaModel) {
        return NextResponse.json({ error: `Model ${model} not found on Prisma Client` }, { status: 500 });
    }

    const total = await prismaModel.count();
    const data = await prismaModel.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { 
          // Try to order by createdAt desc if it usually exists, else id desc
          // This is a bit risky if a model doesn't have these, but standard in this app
          id: 'desc' 
      }
    });

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(`Database Explorer Error [${model}]:`, error);
    // Fallback: the model might not have 'id' or 'createdAt'
    return NextResponse.json({ error: 'Failed to fetch data. Check server logs.' }, { status: 500 });
  }
}
