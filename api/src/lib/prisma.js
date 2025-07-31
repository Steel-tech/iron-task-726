const env = require('../config/env');

// Check if we're in mock mode (when DATABASE_URL starts with 'mock://')
const isMockMode = process.env.DATABASE_URL?.startsWith('mock://');

let prisma;

if (isMockMode) {
  // Create a mock Prisma client that doesn't require database connection
  console.log('🔧 Running in mock database mode');
  
  // In-memory storage for mock database
  const mockUsers = new Map();
  const mockProjects = new Map();
  const mockMedia = new Map();
  const mockActivities = new Map();
  const mockTeamChats = new Map();
  
  // Add default test user
  mockUsers.set('test@example.com', {
    id: 'mock-user-1',
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
  });

  // Add sample team members
  const teamMembers = [
    {
      id: 'mock-user-2',
      email: 'mike.torres@fsw-denver.com',
      name: 'Mike Torres',
      role: 'FOREMAN',
      companyId: 'fsw-default-company',
      unionMember: true,
      phoneNumber: '(303) 555-0102',
      createdAt: new Date()
    },
    {
      id: 'mock-user-3', 
      email: 'sarah.johnson@fsw-denver.com',
      name: 'Sarah Johnson',
      role: 'SAFETY_INSPECTOR',
      companyId: 'fsw-default-company',
      unionMember: false,
      phoneNumber: '(303) 555-0103',
      createdAt: new Date()
    },
    {
      id: 'mock-user-4',
      email: 'david.kim@fsw-denver.com', 
      name: 'David Kim',
      role: 'PROJECT_MANAGER',
      companyId: 'fsw-default-company',
      unionMember: false,
      phoneNumber: '(303) 555-0104',
      createdAt: new Date()
    }
  ];

  teamMembers.forEach(user => {
    mockUsers.set(user.email, {
      ...user,
      company: {
        id: 'fsw-default-company',
        name: 'FSW Denver'
      }
    });
  });

  // Add sample projects
  const sampleProjects = [
    {
      id: 'project-1',
      jobNumber: '2024-001',
      name: 'Downtown Office Tower',
      location: 'Denver, CO',
      address: '1801 California St, Denver, CO 80202',
      status: 'ACTIVE',
      companyId: 'fsw-default-company',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      metadata: {
        client: 'DTC Development LLC',
        value: 2500000,
        progress: 78,
        startDate: '2024-01-15',
        estimatedCompletion: '2024-12-31'
      }
    },
    {
      id: 'project-2',
      jobNumber: '2024-002', 
      name: 'Steel Bridge Renovation',
      location: 'Boulder, CO',
      address: '2800 Pearl St, Boulder, CO 80302',
      status: 'ACTIVE',
      companyId: 'fsw-default-company',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
      metadata: {
        client: 'Boulder County',
        value: 1800000,
        progress: 45,
        startDate: '2024-02-01',
        estimatedCompletion: '2024-10-15'
      }
    },
    {
      id: 'project-3',
      jobNumber: '2024-003',
      name: 'Warehouse Expansion',
      location: 'Aurora, CO', 
      address: '15800 E 40th Ave, Aurora, CO 80011',
      status: 'ACTIVE',
      companyId: 'fsw-default-company',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date(),
      metadata: {
        client: 'Aurora Industrial',
        value: 950000,
        progress: 92,
        startDate: '2024-03-01',
        estimatedCompletion: '2024-08-30'
      }
    }
  ];
  
  sampleProjects.forEach(project => {
    mockProjects.set(project.id, project);
  });

  // Add sample media for the projects  
  const sampleMedia = [
    { id: 'media-1', projectId: 'project-1', userId: 'mock-user-2', mediaType: 'PHOTO', activityType: 'ERECTION', timestamp: new Date(Date.now() - 2*60*60*1000), status: 'READY' },
    { id: 'media-2', projectId: 'project-1', userId: 'mock-user-3', mediaType: 'PHOTO', activityType: 'SAFETY', timestamp: new Date(Date.now() - 4*60*60*1000), status: 'READY' },
    { id: 'media-3', projectId: 'project-2', userId: 'mock-user-4', mediaType: 'VIDEO', activityType: 'WELDING', timestamp: new Date(Date.now() - 1*24*60*60*1000), status: 'READY' },
    { id: 'media-4', projectId: 'project-3', userId: 'mock-user-2', mediaType: 'PHOTO', activityType: 'INSPECTION', timestamp: new Date(Date.now() - 3*60*60*1000), status: 'READY' }
  ];
  
  sampleMedia.forEach(media => {
    mockMedia.set(media.id, media);
  });

  // Add sample activities
  const sampleActivities = [
    { id: 'activity-1', projectId: 'project-1', userId: 'mock-user-2', type: 'ERECTION', description: 'Beam installation progress documented', timestamp: new Date(Date.now() - 2*60*60*1000) },
    { id: 'activity-2', projectId: 'project-2', userId: 'mock-user-3', type: 'SAFETY', description: 'Weekly safety report generated', timestamp: new Date(Date.now() - 1*24*60*60*1000) },
    { id: 'activity-3', projectId: 'project-3', userId: 'mock-user-4', type: 'OTHER', description: 'New crew member added to team', timestamp: new Date(Date.now() - 3*60*60*1000) }
  ];
  
  sampleActivities.forEach(activity => {
    mockActivities.set(activity.id, activity);
  });

  // Helper function to get email by user ID
  const getEmailById = (userId) => {
    for (const [email, user] of mockUsers.entries()) {
      if (user.id === userId) {
        return email;
      }
    }
    return null;
  };
  
  prisma = {
    // Mock all Prisma operations to return empty results
    user: {
      findUnique: async (query) => {
        if (query.where?.email) {
          return mockUsers.get(query.where.email) || null;
        }
        if (query.where?.id) {
          for (const user of mockUsers.values()) {
            if (user.id === query.where.id) {
              return user;
            }
          }
        }
        return null;
      },
      findMany: async () => Array.from(mockUsers.values()),
      count: async () => mockUsers.size,
      create: async (data) => {
        const userData = data.data;
        const userId = `mock-user-${Date.now()}`;
        const newUser = {
          id: userId,
          ...userData,
          createdAt: new Date(),
          company: {
            id: 'fsw-default-company',
            name: 'FSW Denver'
          }
        };
        mockUsers.set(userData.email, newUser);
        console.log(`✅ Mock user created: ${userData.email}`);
        return newUser;
      },
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id })
    },
    project: {
      findUnique: async (query) => {
        if (query.where?.id) {
          return mockProjects.get(query.where.id) || null;
        }
        if (query.where?.jobNumber) {
          for (const project of mockProjects.values()) {
            if (project.jobNumber === query.where.jobNumber) {
              return project;
            }
          }
        }
        return null;
      },
      findMany: async (query = {}) => {
        let projects = Array.from(mockProjects.values());
        
        // Apply filters if provided
        if (query.where?.companyId) {
          projects = projects.filter(p => p.companyId === query.where.companyId);
        }
        if (query.where?.status) {
          projects = projects.filter(p => p.status === query.where.status);
        }
        
        // Apply ordering
        if (query.orderBy?.createdAt === 'desc') {
          projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return projects;
      },
      count: async (query = {}) => {
        let projects = Array.from(mockProjects.values());
        
        if (query.where?.companyId) {
          projects = projects.filter(p => p.companyId === query.where.companyId);
        }
        if (query.where?.status) {
          projects = projects.filter(p => p.status === query.where.status);
        }
        
        return projects.length;
      },
      create: async (data) => {
        const projectId = `mock-project-${Date.now()}`;
        const newProject = {
          id: projectId,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockProjects.set(projectId, newProject);
        console.log(`✅ Mock project created: ${newProject.name}`);
        return newProject;
      },
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id })
    },
    company: {
      findUnique: async (query) => {
        if (query.where?.id === 'fsw-default-company') {
          return { id: 'fsw-default-company', name: 'FSW Denver' };
        }
        return null;
      },
      findMany: async () => [{ id: 'fsw-default-company', name: 'FSW Denver' }],
      create: async (data) => ({ id: 'mock-id', ...data.data }),
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id })
    },
    media: {
      findUnique: async (query) => {
        if (query.where?.id) {
          return mockMedia.get(query.where.id) || null;
        }
        return null;
      },
      findMany: async (query = {}) => {
        let media = Array.from(mockMedia.values());
        
        if (query.where?.projectId) {
          media = media.filter(m => m.projectId === query.where.projectId);
        }
        if (query.where?.userId) {
          media = media.filter(m => m.userId === query.where.userId);
        }
        
        // Apply ordering
        if (query.orderBy?.createdAt === 'desc') {
          media.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        // Apply limit
        if (query.take) {
          media = media.slice(0, query.take);
        }
        
        // Add related data if include is specified
        if (query.include) {
          media = media.map(m => ({
            ...m,
            createdAt: m.timestamp, // Dashboard expects createdAt
            fileName: `photo_${m.id}.jpg`,
            uploadedAt: m.timestamp.toISOString(),
            user: query.include.user ? mockUsers.get(getEmailById(m.userId)) || { name: 'Unknown User' } : undefined,
            project: query.include.project ? mockProjects.get(m.projectId) || { name: 'Unknown Project' } : undefined
          }));
        }
        
        return media;
      },
      count: async (query = {}) => {
        let media = Array.from(mockMedia.values());
        
        if (query.where?.projectId) {
          media = media.filter(m => m.projectId === query.where.projectId);
        }
        if (query.where?.userId) {
          media = media.filter(m => m.userId === query.where.userId);
        }
        if (query.where?.mediaType) {
          if (Array.isArray(query.where.mediaType.in)) {
            media = media.filter(m => query.where.mediaType.in.includes(m.mediaType));
          } else {
            media = media.filter(m => m.mediaType === query.where.mediaType);
          }
        }
        
        return media.length;
      },
      create: async (data) => ({ id: `mock-media-${Date.now()}`, ...data.data }),
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id })
    },
    activity: {
      findMany: async (query = {}) => {
        let activities = Array.from(mockActivities.values());
        
        if (query.where?.projectId) {
          activities = activities.filter(a => a.projectId === query.where.projectId);
        }
        if (query.where?.userId) {
          activities = activities.filter(a => a.userId === query.where.userId);
        }
        
        // Apply ordering
        if (query.orderBy?.timestamp === 'desc') {
          activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        return activities;
      },
      create: async (data) => ({ id: `mock-activity-${Date.now()}`, ...data.data }),
      update: async (data) => ({ id: data.where.id, ...data.data }),
      delete: async (data) => ({ id: data.where.id })
    },
    projectMember: {
      findMany: async (query = {}) => {
        // Return sample project members
        const members = [
          { projectId: 'project-1', userId: 'mock-user-2', role: 'Site Foreman' },
          { projectId: 'project-1', userId: 'mock-user-4', role: 'Project Manager' },
          { projectId: 'project-2', userId: 'mock-user-3', role: 'Safety Inspector' },
          { projectId: 'project-2', userId: 'mock-user-4', role: 'Project Manager' }
        ];
        
        if (query.where?.projectId) {
          return members.filter(m => m.projectId === query.where.projectId);
        }
        
        return members;
      },
      count: async () => 4,
      create: async (data) => ({ ...data.data }),
      delete: async (data) => ({ projectId: data.where.projectId_userId.projectId, userId: data.where.projectId_userId.userId })
    },
    teamChat: {
      findMany: async (query = {}) => {
        let chats = Array.from(mockTeamChats.values());
        
        if (query.where?.projectId) {
          chats = chats.filter(c => c.projectId === query.where.projectId);
        }
        
        return chats;
      },
      create: async (data) => ({ id: `mock-chat-${Date.now()}`, ...data.data }),
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