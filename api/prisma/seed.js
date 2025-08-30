const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Default password for all test users
  const defaultPassword = 'Test1234!'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  // Create default company
  const company = await prisma.company.upsert({
    where: { id: 'fsw-default-company' },
    update: {},
    create: {
      id: 'fsw-default-company',
      name: 'Iron Task',
    },
  })

  console.log('✅ Company created:', company.name)

  // Seed users with different roles
  const users = [
    {
      email: 'admin@fsw-denver.com',
      name: 'Admin User',
      role: 'ADMIN',
      unionMember: false,
    },
    {
      email: 'pm@fsw-denver.com',
      name: 'Project Manager',
      role: 'PROJECT_MANAGER',
      unionMember: false,
    },
    {
      email: 'foreman@fsw-denver.com',
      name: 'Field Foreman',
      role: 'FOREMAN',
      unionMember: true,
    },
    {
      email: 'worker@fsw-denver.com',
      name: 'Iron Worker',
      role: 'WORKER',
      unionMember: true,
    },
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedPassword,
        companyId: company.id,
        phoneNumber:
          '(303) 555-01' +
          Math.floor(Math.random() * 100)
            .toString()
            .padStart(2, '0'),
      },
    })

    console.log(`✅ User created: ${user.email} (${user.role})`)
  }

  // Create sample projects
  const projects = [
    {
      jobNumber: '2024-001',
      name: 'Denver Tech Center Tower',
      location: 'Downtown Denver',
      address: '1801 California St, Denver, CO 80202',
      status: 'ACTIVE',
      companyId: company.id,
      metadata: {
        client: 'DTC Development LLC',
        value: 2500000,
        startDate: '2024-01-15',
        estimatedCompletion: '2024-12-31',
      },
    },
    {
      jobNumber: '2024-002',
      name: 'Cherry Creek Mall Expansion',
      location: 'Cherry Creek',
      address: '3000 E 1st Ave, Denver, CO 80206',
      status: 'ACTIVE',
      companyId: company.id,
      metadata: {
        client: 'Cherry Creek Shopping Center',
        value: 1800000,
        startDate: '2024-02-01',
        estimatedCompletion: '2024-10-15',
      },
    },
    {
      jobNumber: '2023-115',
      name: 'Union Station Platform Cover',
      location: 'LoDo',
      address: '1701 Wynkoop St, Denver, CO 80202',
      status: 'COMPLETED',
      companyId: company.id,
      metadata: {
        client: 'RTD Denver',
        value: 950000,
        startDate: '2023-06-01',
        completedDate: '2023-12-20',
      },
    },
  ]

  for (const projectData of projects) {
    const project = await prisma.project.upsert({
      where: { jobNumber: projectData.jobNumber },
      update: {},
      create: projectData,
    })

    console.log(`✅ Project created: ${project.jobNumber} - ${project.name}`)

    // Assign PM and Foreman to active projects
    if (project.status === 'ACTIVE') {
      const pmUser = await prisma.user.findUnique({
        where: { email: 'pm@fsw-denver.com' },
      })
      const foremanUser = await prisma.user.findUnique({
        where: { email: 'foreman@fsw-denver.com' },
      })

      // Add project members
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: pmUser.id,
          },
        },
        update: {},
        create: {
          projectId: project.id,
          userId: pmUser.id,
          role: 'Project Manager',
        },
      })

      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: foremanUser.id,
          },
        },
        update: {},
        create: {
          projectId: project.id,
          userId: foremanUser.id,
          role: 'Site Foreman',
        },
      })

      console.log(`  → Assigned PM and Foreman to ${project.jobNumber}`)
    }
  }

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📝 Test credentials:')
  console.log(
    '  Email: admin@fsw-denver.com | Password: Test1234! | Role: Admin'
  )
  console.log(
    '  Email: pm@fsw-denver.com | Password: Test1234! | Role: Project Manager'
  )
  console.log(
    '  Email: foreman@fsw-denver.com | Password: Test1234! | Role: Foreman'
  )
  console.log(
    '  Email: worker@fsw-denver.com | Password: Test1234! | Role: Worker'
  )
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
