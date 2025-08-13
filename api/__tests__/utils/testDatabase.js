/**
 * Test Database Utilities
 * Provides isolated database setup and cleanup for reliable testing
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

class TestDatabase {
  constructor() {
    this.prisma = null;
    this.createdData = {
      users: [],
      companies: [],
      projects: [],
      media: [],
      activities: [],
      safetyInspections: [],
      qualityChecks: []
    };
  }

  /**
   * Initialize test database connection
   */
  async connect() {
    if (!this.prisma) {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
          }
        }
      });
      
      await this.prisma.$connect();
    }
    return this.prisma;
  }

  /**
   * Clean up all test data and close connection
   */
  async cleanup() {
    if (!this.prisma) return;

    try {
      // Clean up in reverse dependency order to avoid foreign key constraints
      await this.cleanupMediaRelations();
      await this.cleanupProjectRelations();
      await this.cleanupUserRelations();
      await this.cleanupCompanies();
      
      await this.prisma.$disconnect();
    } catch (error) {
      console.warn('Database cleanup warning:', error.message);
    } finally {
      this.prisma = null;
      this.createdData = {
        users: [],
        companies: [],
        projects: [],
        media: [],
        activities: [],
        safetyInspections: [],
        qualityChecks: []
      };
    }
  }

  /**
   * Clean up media-related data
   */
  async cleanupMediaRelations() {
    // Clean up media comments, views, tags
    if (this.createdData.media.length > 0) {
      const mediaIds = this.createdData.media.map(m => m.id);
      
      await this.prisma.mediaView.deleteMany({
        where: { mediaId: { in: mediaIds } }
      });
      
      await this.prisma.mediaTag.deleteMany({
        where: { mediaId: { in: mediaIds } }
      });
      
      await this.prisma.comment.deleteMany({
        where: { mediaId: { in: mediaIds } }
      });
      
      await this.prisma.reaction.deleteMany({
        where: { mediaId: { in: mediaIds } }
      });
      
      await this.prisma.media.deleteMany({
        where: { id: { in: mediaIds } }
      });
    }
  }

  /**
   * Clean up project-related data
   */
  async cleanupProjectRelations() {
    if (this.createdData.projects.length > 0) {
      const projectIds = this.createdData.projects.map(p => p.id);
      
      // Clean up activities
      await this.prisma.activity.deleteMany({
        where: { projectId: { in: projectIds } }
      });
      
      // Clean up safety inspections
      await this.prisma.safetyInspection.deleteMany({
        where: { projectId: { in: projectIds } }
      });
      
      // Clean up quality checks
      await this.prisma.qualityCheck.deleteMany({
        where: { projectId: { in: projectIds } }
      });
      
      // Clean up project members
      await this.prisma.projectMember.deleteMany({
        where: { projectId: { in: projectIds } }
      });
      
      // Clean up AI reports
      await this.prisma.aIReport.deleteMany({
        where: { projectId: { in: projectIds } }
      });
      
      // Clean up galleries
      await this.prisma.gallery.deleteMany({
        where: { projectId: { in: projectIds } }
      });
      
      await this.prisma.project.deleteMany({
        where: { id: { in: projectIds } }
      });
    }
  }

  /**
   * Clean up user-related data
   */
  async cleanupUserRelations() {
    if (this.createdData.users.length > 0) {
      const userIds = this.createdData.users.map(u => u.id);
      
      // Clean up refresh tokens
      await this.prisma.refreshToken.deleteMany({
        where: { userId: { in: userIds } }
      });
      
      // Clean up notifications
      await this.prisma.notification.deleteMany({
        where: { userId: { in: userIds } }
      });
      
      // Clean up push subscriptions
      await this.prisma.pushSubscription.deleteMany({
        where: { userId: { in: userIds } }
      });
      
      // Clean up feed preferences
      await this.prisma.feedPreferences.deleteMany({
        where: { userId: { in: userIds } }
      });
      
      await this.prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }
  }

  /**
   * Clean up companies
   */
  async cleanupCompanies() {
    if (this.createdData.companies.length > 0) {
      const companyIds = this.createdData.companies.map(c => c.id);
      
      // Clean up tags
      await this.prisma.tag.deleteMany({
        where: { companyId: { in: companyIds } }
      });
      
      // Clean up labels
      await this.prisma.label.deleteMany({
        where: { companyId: { in: companyIds } }
      });
      
      await this.prisma.company.deleteMany({
        where: { id: { in: companyIds } }
      });
    }
  }

  /**
   * Create test company with proper cleanup tracking
   */
  async createCompany(data = {}) {
    await this.connect();
    
    const company = await this.prisma.company.create({
      data: {
        name: `Test Company ${Date.now()}`,
        ...data
      }
    });
    
    this.createdData.companies.push(company);
    return company;
  }

  /**
   * Create test user with proper cleanup tracking
   */
  async createUser(data = {}) {
    await this.connect();
    
    // Ensure we have a company
    let companyId = data.companyId;
    if (!companyId) {
      const company = await this.createCompany();
      companyId = company.id;
    }
    
    const user = await this.prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: '$2b$10$hashedpassword', // bcrypt hash of 'password123'
        name: 'Test User',
        role: 'WORKER',
        companyId,
        unionMember: false,
        ...data
      }
    });
    
    this.createdData.users.push(user);
    return user;
  }

  /**
   * Create test project with proper cleanup tracking
   */
  async createProject(data = {}) {
    await this.connect();
    
    // Ensure we have a company
    let companyId = data.companyId;
    if (!companyId) {
      const company = await this.createCompany();
      companyId = company.id;
    }
    
    const project = await this.prisma.project.create({
      data: {
        name: `Test Project ${Date.now()}`,
        description: 'Test construction project',
        status: 'ACTIVE',
        companyId,
        location: 'Test Location',
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        ...data
      }
    });
    
    this.createdData.projects.push(project);
    return project;
  }

  /**
   * Create test media with proper cleanup tracking
   */
  async createMedia(data = {}) {
    await this.connect();
    
    // Ensure we have a project and user
    let projectId = data.projectId;
    let userId = data.userId;
    
    if (!projectId) {
      const project = await this.createProject();
      projectId = project.id;
    }
    
    if (!userId) {
      const user = await this.createUser();
      userId = user.id;
    }
    
    const media = await this.prisma.media.create({
      data: {
        type: 'PHOTO',
        url: `https://test-bucket.s3.amazonaws.com/test-${Date.now()}.jpg`,
        thumbnailUrl: `https://test-bucket.s3.amazonaws.com/thumb-${Date.now()}.jpg`,
        filename: `test-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 1024576,
        projectId,
        userId,
        description: 'Test construction photo',
        capturedAt: new Date(),
        ...data
      }
    });
    
    this.createdData.media.push(media);
    return media;
  }

  /**
   * Create test activity with proper cleanup tracking
   */
  async createActivity(data = {}) {
    await this.connect();
    
    // Ensure we have a project and user
    let projectId = data.projectId;
    let userId = data.userId;
    
    if (!projectId) {
      const project = await this.createProject();
      projectId = project.id;
    }
    
    if (!userId) {
      const user = await this.createUser();
      userId = user.id;
    }
    
    const activity = await this.prisma.activity.create({
      data: {
        type: 'ERECTION',
        description: 'Steel beam installation',
        projectId,
        userId,
        location: 'Building A, Level 3',
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 8 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        ...data
      }
    });
    
    this.createdData.activities.push(activity);
    return activity;
  }

  /**
   * Create test safety inspection
   */
  async createSafetyInspection(data = {}) {
    await this.connect();
    
    // Ensure we have a project and inspector
    let projectId = data.projectId;
    let inspectorId = data.inspectorId;
    
    if (!projectId) {
      const project = await this.createProject();
      projectId = project.id;
    }
    
    if (!inspectorId) {
      const inspector = await this.createUser({ role: 'SAFETY_INSPECTOR' });
      inspectorId = inspector.id;
    }
    
    const inspection = await this.prisma.safetyInspection.create({
      data: {
        projectId,
        inspectorId,
        type: 'GENERAL_SAFETY',
        status: 'PASSED',
        score: 95,
        findings: [
          { category: 'PPE', status: 'PASS', notes: 'All workers wearing proper PPE' }
        ],
        inspectionDate: new Date(),
        ...data
      }
    });
    
    this.createdData.safetyInspections.push(inspection);
    return inspection;
  }

  /**
   * Create test quality check
   */
  async createQualityCheck(data = {}) {
    await this.connect();
    
    // Ensure we have a project and inspector
    let projectId = data.projectId;
    let inspectorId = data.inspectorId;
    
    if (!projectId) {
      const project = await this.createProject();
      projectId = project.id;
    }
    
    if (!inspectorId) {
      const inspector = await this.createUser({ role: 'PROJECT_MANAGER' });
      inspectorId = inspector.id;
    }
    
    const qualityCheck = await this.prisma.qualityCheck.create({
      data: {
        projectId,
        inspectorId,
        type: 'STRUCTURAL_INTEGRITY',
        status: 'PASSED',
        criteria: [
          { name: 'Bolt Torque', status: 'PASS', measurement: '250 ft-lbs' }
        ],
        checkDate: new Date(),
        ...data
      }
    });
    
    this.createdData.qualityChecks.push(qualityCheck);
    return qualityCheck;
  }

  /**
   * Seed database with comprehensive test data
   */
  async seed() {
    await this.connect();
    
    // Create test company
    const company = await this.createCompany({
      name: 'FSW Test Company'
    });
    
    // Create test users with different roles
    const admin = await this.createUser({
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'ADMIN',
      companyId: company.id
    });
    
    const projectManager = await this.createUser({
      email: 'pm@test.com',
      name: 'Test Project Manager',
      role: 'PROJECT_MANAGER',
      companyId: company.id
    });
    
    const foreman = await this.createUser({
      email: 'foreman@test.com',
      name: 'Test Foreman',
      role: 'FOREMAN',
      companyId: company.id
    });
    
    const worker = await this.createUser({
      email: 'worker@test.com',
      name: 'Test Worker',
      role: 'WORKER',
      companyId: company.id
    });
    
    const safetyInspector = await this.createUser({
      email: 'safety@test.com',
      name: 'Test Safety Inspector',
      role: 'SAFETY_INSPECTOR',
      companyId: company.id
    });
    
    // Create test projects
    const activeProject = await this.createProject({
      name: 'Active Test Project',
      status: 'ACTIVE',
      companyId: company.id
    });
    
    const completedProject = await this.createProject({
      name: 'Completed Test Project',
      status: 'COMPLETED',
      companyId: company.id
    });
    
    // Create test media for active project
    const photo1 = await this.createMedia({
      projectId: activeProject.id,
      userId: worker.id,
      type: 'PHOTO',
      description: 'Steel beam installation progress'
    });
    
    const video1 = await this.createMedia({
      projectId: activeProject.id,
      userId: foreman.id,
      type: 'VIDEO',
      description: 'Welding process demonstration'
    });
    
    // Create test activities
    const activity1 = await this.createActivity({
      projectId: activeProject.id,
      userId: foreman.id,
      type: 'ERECTION',
      status: 'IN_PROGRESS'
    });
    
    const activity2 = await this.createActivity({
      projectId: activeProject.id,
      userId: worker.id,
      type: 'WELDING',
      status: 'COMPLETED'
    });
    
    // Create test safety inspection
    const safetyInspection = await this.createSafetyInspection({
      projectId: activeProject.id,
      inspectorId: safetyInspector.id
    });
    
    // Create test quality check
    const qualityCheck = await this.createQualityCheck({
      projectId: activeProject.id,
      inspectorId: projectManager.id
    });
    
    return {
      company,
      users: { admin, projectManager, foreman, worker, safetyInspector },
      projects: { activeProject, completedProject },
      media: { photo1, video1 },
      activities: { activity1, activity2 },
      safetyInspection,
      qualityCheck
    };
  }

  /**
   * Reset database to clean state
   */
  async reset() {
    await this.cleanup();
    await this.connect();
  }
}

// Global test database instance
let globalTestDb = null;

/**
 * Get or create global test database instance
 */
function getTestDatabase() {
  if (!globalTestDb) {
    globalTestDb = new TestDatabase();
  }
  return globalTestDb;
}

/**
 * Setup test database for Jest tests
 */
async function setupTestDatabase() {
  const testDb = getTestDatabase();
  await testDb.connect();
  return testDb;
}

/**
 * Cleanup test database for Jest tests
 */
async function cleanupTestDatabase() {
  if (globalTestDb) {
    await globalTestDb.cleanup();
  }
}

module.exports = {
  TestDatabase,
  getTestDatabase,
  setupTestDatabase,
  cleanupTestDatabase
};