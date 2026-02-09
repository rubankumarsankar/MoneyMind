const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "srirubankumar@gmail.com"; 
  console.log(`Promoting user ${email} to ADMIN...`);

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`✅ Success! User ${user.email} is now an ADMIN.`);
  } catch (e) {
    if (e.code === 'P2025') {
       console.error(`❌ User with email ${email} not found.`);
    } else {
       console.error(e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
