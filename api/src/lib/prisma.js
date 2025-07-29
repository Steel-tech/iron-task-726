const env = require('../config/env');

// Check if we're in mock mode (when DATABASE_URL starts with 'mock://')
const isMockMode = process.env.DATABASE_URL?.startsWith('mock://');

let prisma;

if (isMockMode) {
  // Create a mock Prisma client that doesn't require database connection
  console.log('🔧 Running in mock database mode');
  prisma = {
    // Mock all Prisma operations to return empty results
    user: {
      findUnique: async (query) => {
        // Return mock user for testing
        const mockUser = {
          id: 'mock-id',
          email: 'test@example.com',
          password: '$2b$12$wSTuJLH/sm.xc3yxt7/7muv37K7WadWWLDrJsk9m8ePkHlWIv4nOC', // Test123@
          name: 'Test User',
          role: 'ADMIN',
          companyId: 'fsw-default-company',
          unionMember: false,
          phoneNumber: null,
          createdAt: new Date(),
          company: {
            id: 'fsw-default-company',
            name: 'FSW Denver'
          }
        };
        
        if (query.where?.email === 'test@example.com' || query.where?.id === 'mock-id') {
          return mockUser;
        }
        return null;
      },
      findMany: async () => [],
      create: async (data) => ({ id: 'mock-id', ...data.data }),
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id })
    },
    project: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data) => ({ id: 'mock-id', ...data.data }),
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id })
    },
    company: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data) => ({ id: 'mock-id', ...data.data }),
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id })
    },
    refreshToken: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data) => ({ id: 'mock-token-id', ...data.data }),
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id }),
      deleteMany: async () => ({ count: 0 })
    },
    $connect: async () => { console.log('Mock Prisma connected'); },
    $disconnect: async () => { console.log('Mock Prisma disconnected'); }
  };
} else {
  // Use real Prisma client
  const { PrismaClient } = require('@prisma/client');
  
  // Prevent multiple instances of Prisma Client in development
  const globalForPrisma = global;

  const prismaClientSingleton = () => {
    return new PrismaClient({
      log: env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      errorFormat: env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
    });
  };

  prisma = globalForPrisma.prisma || prismaClientSingleton();

  if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
}

module.exports = prisma;