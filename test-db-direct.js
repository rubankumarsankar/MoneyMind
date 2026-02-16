const { PrismaClient } = require('@prisma/client')

// Direct URL from .env (port 5432 instead of 6543)
const directUrl = "postgresql://postgres:ex8EJjo8lKDaAbcc@db.nglteeoqpktxnvisrtsg.supabase.co:5432/postgres"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl,
    },
  },
})

async function main() {
  console.log('Testing DIRECT connection (port 5432)...')
  try {
    await prisma.$connect()
    console.log('Successfully connected to the database via Direct URL')
    const userCount = await prisma.user.count()
    console.log(`User count: ${userCount}`)
  } catch (e) {
    console.error('Direct connection failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
