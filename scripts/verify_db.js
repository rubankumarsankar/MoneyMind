const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    // Try to count users to verify connection
    const userCount = await prisma.user.count();
    console.log(`Successfully connected! Found ${userCount} users.`);
    
    // Check if we can write (test specific for sqlite locking issues)
    const testEmail = `test_${Date.now()}@example.com`;
    // We won't actually create to avoid pollution, just reading is enough to prove connection
    // But let's try a transaction to be sure about locks if we wanted, but count is safer for now.
    
    console.log('Database connection verification passed.');
  } catch (e) {
    console.error('Database connection failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
