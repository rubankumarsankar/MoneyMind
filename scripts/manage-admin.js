const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const email = process.argv[2];
const action = process.argv[3] || 'promote'; // 'promote' or 'demote'

if (!email) {
  console.log("Usage: node scripts/manage-admin.js <email> [promote|demote]");
  process.exit(1);
}

async function main() {
  const role = action === 'demote' ? 'USER' : 'ADMIN';
  console.log(`Setting role for ${email} to ${role}...`);

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role },
    });
    console.log(`✅ Success! User ${user.email} is now ${role}.`);
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
