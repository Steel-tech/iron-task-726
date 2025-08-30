const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

function generateSecurePassword() {
  const randomBytes = crypto.randomBytes(16)
  return randomBytes.toString('base64').slice(0, 12) + '!A1'
}

async function main() {
  const adminPassword = generateSecurePassword()
  const pmPassword = generateSecurePassword()
  const foremanPassword = generateSecurePassword()
  const workerPassword = generateSecurePassword()

  const adminHash = await bcrypt.hash(adminPassword, 14)
  const pmHash = await bcrypt.hash(pmPassword, 14)
  const foremanHash = await bcrypt.hash(foremanPassword, 14)
  const workerHash = await bcrypt.hash(workerPassword, 14)

  const company = await prisma.company.upsert({
    where: { id: 'fsw-production-company' },
    update: {},
    create: {
      id: 'fsw-production-company',
      name: 'FSW Iron Task Production',
    },
  })

  const users = [
    {
      email: 'admin@fsw-denver.com',
      name: 'System Administrator',
      role: 'ADMIN',
      password: adminHash,
      plainPassword: adminPassword,
    },
    {
      email: 'pm@fsw-denver.com',
      name: 'Project Manager',
      role: 'PROJECT_MANAGER',
      password: pmHash,
      plainPassword: pmPassword,
    },
    {
      email: 'foreman@fsw-denver.com',
      name: 'Site Foreman',
      role: 'FOREMAN',
      password: foremanHash,
      plainPassword: foremanPassword,
    },
    {
      email: 'worker@fsw-denver.com',
      name: 'Construction Worker',
      role: 'WORKER',
      password: workerHash,
      plainPassword: workerPassword,
    },
  ]

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: userData.password,
        name: userData.name,
        role: userData.role,
      },
      create: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        companyId: company.id,
        unionMember: false,
      },
    })
  }

  const credentialsFile = path.join(__dirname, 'PRODUCTION_CREDENTIALS.txt')
  const credentialsContent = `FSW Iron Task - Production Credentials
Generated: ${new Date().toISOString()}

CRITICAL: Store these credentials securely and delete this file after copying to password manager!

${users.map(user => `Email: ${user.email} | Password: ${user.plainPassword} | Role: ${user.role}`).join('\n')}

SECURITY NOTES:
- Change all passwords on first login
- Enable 2FA for admin accounts  
- Delete this file immediately after copying credentials
- Monitor for unauthorized access attempts
`

  fs.writeFileSync(credentialsFile, credentialsContent, { mode: 0o600 })

  await prisma.project.upsert({
    where: { id: 'welcome-project' },
    update: {},
    create: {
      id: 'welcome-project',
      jobNumber: 'WELCOME-001',
      name: 'Welcome to FSW Iron Task',
      location: 'System Setup',
      address: 'N/A',
      status: 'ACTIVE',
      companyId: company.id,
      metadata: {
        description:
          'Initial setup project - can be deleted after creating real projects',
        isSystemProject: true,
      },
    },
  })
}

main()
  .catch(e => {
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
