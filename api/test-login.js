const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testLogin() {
  try {
    // Get the demo user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
    })

    if (!user) {
      console.log('User not found!')
      return
    }

    console.log('User found:', user.email)
    console.log('Stored password hash:', user.password)

    // Test password
    const testPassword = 'demo123'
    const isValid = await bcrypt.compare(testPassword, user.password)

    console.log(`Password '${testPassword}' is valid:`, isValid)

    // Let's also try with the seeded password
    const seedPassword = 'Test1234!'
    const isSeedValid = await bcrypt.compare(seedPassword, user.password)

    console.log(`Password '${seedPassword}' is valid:`, isSeedValid)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
