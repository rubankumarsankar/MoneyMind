const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Testing connection...')
  try {
    await prisma.$connect()
    console.log('Successfully connected to the database')
  } catch (e) {
    console.error('Connection failed:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
