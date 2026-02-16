const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Testing SQLite connection...')
  try {
    await prisma.$connect()
    console.log('Successfully connected to SQLite database.')
    const userCount = await prisma.user.count()
    console.log(`User count: ${userCount}`)
  } catch (e) {
    console.error('Connection failed:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
