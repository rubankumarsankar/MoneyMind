const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log("Testing database connection...");
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    console.log(`Successfully connected! User count: ${userCount}`);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
