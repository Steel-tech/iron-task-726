/**
 * Projects Routes Test Suite
 * Comprehensive testing for project management, team assignment, and access control
 */

const { TestDatabase, AuthHelpers, MockServiceHelpers, APITestHelpers } = require('../utils/testHelpers');
const { setupTestDatabase, cleanupTestDatabase } = require('../utils/testDatabase');

// Mock external services
jest.mock('../../src/lib/prisma');
jest.mock('../../src/services/emailService');
jest.mock('../../src/middleware/validation');

// Mock modules
const mockPrisma = MockServiceHelpers.createPrismaMock();
const mockEmailService = MockServiceHelpers.createEmailMock();

require('../../src/lib/prisma').default = mockPrisma;
require('../../src/services/emailService').default = mockEmailService;

// Mock validation middleware
require('../../src/middleware/validation').validate = jest.fn((schema) => (req, reply, done) => {
  // Simulate validation - reject invalid data
  if (req.body?.name === 'INVALID') {
    return reply.code(400).send({ error: 'Validation failed' });
  }
  if (req.body?.email === 'invalid-email') {
    return reply.code(400).send({ error: 'Invalid email format' });
  }
  done && done();
});

// Mock Fastify app
const fastify = require('fastify')({ logger: false });

describe('Projects Routes', () => {
  let testDb;
  let testCompany;
  let adminUser;
  let projectManager;
  let foreman;
  let worker;
  let adminToken;
  let pmToken;
  let foremanToken;
  let workerToken;

  beforeAll(async () => {
    // Register routes
    await fastify.register(require('../../src/routes/projects'));
    
    // Register required plugins
    await fastify.register(require('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'test-secret'
    });
    
    testDb = await setupTestDatabase();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create test company and users with different roles
    testCompany = await testDb.createCompany({
      name: 'Test Construction Company'
    });

    adminUser = await testDb.createUser({
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
      companyId: testCompany.id
    });

    projectManager = await testDb.createUser({
      email: 'pm@test.com',
      name: 'Project Manager',
      role: 'PROJECT_MANAGER',
      companyId: testCompany.id
    });

    foreman = await testDb.createUser({
      email: 'foreman@test.com',
      name: 'Foreman',
      role: 'FOREMAN',
      companyId: testCompany.id
    });

    worker = await testDb.createUser({
      email: 'worker@test.com',
      name: 'Worker',
      role: 'WORKER',
      companyId: testCompany.id
    });

    // Generate auth tokens
    adminToken = AuthHelpers.generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      companyId: adminUser.companyId
    });

    pmToken = AuthHelpers.generateToken({
      id: projectManager.id,
      email: projectManager.email,
      role: projectManager.role,
      companyId: projectManager.companyId
    });

    foremanToken = AuthHelpers.generateToken({
      id: foreman.id,
      email: foreman.email,
      role: foreman.role,
      companyId: foreman.companyId
    });

    workerToken = AuthHelpers.generateToken({
      id: worker.id,
      email: worker.email,
      role: worker.role,
      companyId: worker.companyId
    });

    // Setup default mock responses
    mockPrisma.user.findUnique
      .mockImplementation((args) => {
        const users = [adminUser, projectManager, foreman, worker];
        return Promise.resolve(users.find(u => u.id === args.where.id));
      });

    mockPrisma.company.findUnique.mockResolvedValue(testCompany);
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await fastify.close();
  });

  describe('POST /projects', () => {
    it('should create project as admin', async () => {
      const newProject = {
        id: 'project-123',
        name: 'New Construction Project',
        description: 'High-rise building construction',
        status: 'PLANNING',
        location: 'Downtown Denver',
        companyId: testCompany.id,
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      };

      mockPrisma.project.create.mockResolvedValue(newProject);

      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          name: 'New Construction Project',
          description: 'High-rise building construction',
          location: 'Downtown Denver',
          startDate: new Date().toISOString(),
          expectedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'project-123');
      expect(result).toHaveProperty('name', 'New Construction Project');
      
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Construction Project',
          companyId: testCompany.id,
          status: 'PLANNING'
        }),
        include: expect.any(Object)
      });
    });

    it('should create project as project manager', async () => {
      const newProject = {
        id: 'project-456',
        name: 'PM Created Project',
        companyId: testCompany.id
      };

      mockPrisma.project.create.mockResolvedValue(newProject);

      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          name: 'PM Created Project',
          description: 'Project created by PM'
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'project-456');
    });

    it('should reject project creation by worker', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          name: 'Unauthorized Project',
          description: 'Should not be allowed'
        }
      });

      APITestHelpers.expectError(response, 403);
      const result = response.json();
      expect(result.error).toContain('Insufficient permissions');
    });

    it('should validate required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          name: 'INVALID' // Will trigger validation error
        }
      });

      APITestHelpers.expectError(response, 400);
    });

    it('should set default values correctly', async () => {
      const newProject = {
        id: 'project-789',
        name: 'Project with Defaults',
        status: 'PLANNING',
        companyId: testCompany.id
      };

      mockPrisma.project.create.mockResolvedValue(newProject);

      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          name: 'Project with Defaults'
        }
      });

      APITestHelpers.expectSuccess(response, 201);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'PLANNING',
          companyId: testCompany.id
        }),
        include: expect.any(Object)
      });
    });
  });

  describe('GET /projects', () => {
    it('should return paginated projects for company', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          status: 'ACTIVE',
          companyId: testCompany.id,
          _count: { media: 10, activities: 5, members: 3 }
        },
        {
          id: 'project-2',
          name: 'Project 2',
          status: 'PLANNING',
          companyId: testCompany.id,
          _count: { media: 0, activities: 2, members: 1 }
        }
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockPrisma.project.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects?page=1&limit=10',
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('pagination');
      expect(result.projects).toHaveLength(2);
      expect(result.pagination.total).toBe(2);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { companyId: testCompany.id },
        include: expect.objectContaining({
          _count: expect.any(Object)
        }),
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should filter projects by status', async () => {
      const activeProjects = [
        { id: 'active-1', status: 'ACTIVE', companyId: testCompany.id }
      ];

      mockPrisma.project.findMany.mockResolvedValue(activeProjects);

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects?status=ACTIVE',
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          companyId: testCompany.id,
          status: 'ACTIVE'
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should search projects by name', async () => {
      const searchResults = [
        { id: 'search-1', name: 'Downtown Tower', companyId: testCompany.id }
      ];

      mockPrisma.project.findMany.mockResolvedValue(searchResults);

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects?search=Downtown',
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          companyId: testCompany.id,
          OR: [
            { name: { contains: 'Downtown', mode: 'insensitive' } },
            { description: { contains: 'Downtown', mode: 'insensitive' } },
            { location: { contains: 'Downtown', mode: 'insensitive' } }
          ]
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should return only projects user has access to as worker', async () => {
      // Mock projects where user is a member
      const userProjects = [
        { id: 'worker-project-1', name: 'Worker Project', companyId: testCompany.id }
      ];

      mockPrisma.project.findMany.mockResolvedValue(userProjects);

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects',
        headers: AuthHelpers.createAuthHeader(workerToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          companyId: testCompany.id,
          members: {
            some: { userId: worker.id }
          }
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('GET /projects/:id', () => {
    it('should return project details with full information', async () => {
      const testProject = await testDb.createProject({
        name: 'Detailed Test Project',
        companyId: testCompany.id
      });

      const projectWithDetails = {
        ...testProject,
        company: testCompany,
        members: [
          {
            id: 'member-1',
            userId: projectManager.id,
            role: 'PROJECT_MANAGER',
            user: projectManager
          }
        ],
        _count: {
          media: 25,
          activities: 12,
          members: 3
        }
      };

      mockPrisma.project.findUnique.mockResolvedValue(projectWithDetails);

      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('id', testProject.id);
      expect(result).toHaveProperty('company');
      expect(result).toHaveProperty('members');
      expect(result).toHaveProperty('_count');

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: testProject.id },
        include: expect.objectContaining({
          company: true,
          members: expect.any(Object),
          _count: expect.any(Object)
        })
      });
    });

    it('should return 404 for non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects/non-existent',
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectError(response, 404);
    });

    it('should deny access to unauthorized project', async () => {
      const testProject = await testDb.createProject({
        companyId: 'different-company-id'
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);

      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(workerToken)
      });

      APITestHelpers.expectError(response, 403);
    });
  });

  describe('PUT /projects/:id', () => {
    it('should update project as admin', async () => {
      const testProject = await testDb.createProject({
        name: 'Original Project',
        companyId: testCompany.id
      });

      const updatedProject = {
        ...testProject,
        name: 'Updated Project Name',
        description: 'Updated description',
        status: 'ACTIVE'
      };

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue(updatedProject);

      const response = await fastify.inject({
        method: 'PUT',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          name: 'Updated Project Name',
          description: 'Updated description',
          status: 'ACTIVE'
        }
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('name', 'Updated Project Name');
      expect(result).toHaveProperty('status', 'ACTIVE');

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: testProject.id },
        data: {
          name: 'Updated Project Name',
          description: 'Updated description',
          status: 'ACTIVE'
        },
        include: expect.any(Object)
      });
    });

    it('should prevent unauthorized updates', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);

      const response = await fastify.inject({
        method: 'PUT',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          name: 'Unauthorized Update'
        }
      });

      APITestHelpers.expectError(response, 403);
    });

    it('should validate status transitions', async () => {
      const testProject = await testDb.createProject({
        status: 'COMPLETED',
        companyId: testCompany.id
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);

      const response = await fastify.inject({
        method: 'PUT',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          status: 'PLANNING' // Invalid transition
        }
      });

      APITestHelpers.expectError(response, 400);
    });
  });

  describe('POST /projects/:id/members', () => {
    it('should add team member to project', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      const newMember = {
        id: 'member-123',
        projectId: testProject.id,
        userId: worker.id,
        role: 'WORKER',
        assignedAt: new Date()
      };

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.user.findUnique.mockResolvedValue(worker);
      mockPrisma.projectMember.create.mockResolvedValue(newMember);

      const response = await fastify.inject({
        method: 'POST',
        url: `/projects/${testProject.id}/members`,
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          userId: worker.id,
          role: 'WORKER'
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('userId', worker.id);
      expect(result).toHaveProperty('role', 'WORKER');

      expect(mockPrisma.projectMember.create).toHaveBeenCalledWith({
        data: {
          projectId: testProject.id,
          userId: worker.id,
          role: 'WORKER',
          assignedAt: expect.any(Date)
        },
        include: expect.any(Object)
      });
    });

    it('should send notification email to new member', async () => {
      const testProject = await testDb.createProject({
        name: 'Email Test Project',
        companyId: testCompany.id
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.user.findUnique.mockResolvedValue(worker);
      mockPrisma.projectMember.create.mockResolvedValue({});

      const response = await fastify.inject({
        method: 'POST',
        url: `/projects/${testProject.id}/members`,
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          userId: worker.id,
          role: 'WORKER'
        }
      });

      APITestHelpers.expectSuccess(response, 201);
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: worker.email,
        subject: expect.stringContaining('Email Test Project'),
        template: 'project-invitation',
        data: expect.objectContaining({
          projectName: 'Email Test Project',
          userName: worker.name
        })
      });
    });

    it('should prevent adding duplicate members', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.user.findUnique.mockResolvedValue(worker);
      mockPrisma.projectMember.create.mockRejectedValue(
        new Error('Unique constraint failed')
      );

      const response = await fastify.inject({
        method: 'POST',
        url: `/projects/${testProject.id}/members`,
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          userId: worker.id,
          role: 'WORKER'
        }
      });

      APITestHelpers.expectError(response, 409);
      const result = response.json();
      expect(result.error).toContain('already a member');
    });

    it('should validate user belongs to same company', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      const outsideUser = await testDb.createUser({
        email: 'outside@different.com',
        companyId: 'different-company'
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.user.findUnique.mockResolvedValue(outsideUser);

      const response = await fastify.inject({
        method: 'POST',
        url: `/projects/${testProject.id}/members`,
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          userId: outsideUser.id,
          role: 'WORKER'
        }
      });

      APITestHelpers.expectError(response, 400);
      const result = response.json();
      expect(result.error).toContain('different company');
    });
  });

  describe('DELETE /projects/:id/members/:userId', () => {
    it('should remove team member from project', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      const existingMember = {
        id: 'member-456',
        projectId: testProject.id,
        userId: worker.id,
        role: 'WORKER'
      };

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.projectMember.findUnique.mockResolvedValue(existingMember);
      mockPrisma.projectMember.delete.mockResolvedValue(existingMember);

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/projects/${testProject.id}/members/${worker.id}`,
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectSuccess(response, 204);
      expect(mockPrisma.projectMember.delete).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: testProject.id,
            userId: worker.id
          }
        }
      });
    });

    it('should prevent removing non-existent member', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/projects/${testProject.id}/members/non-existent-user`,
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectError(response, 404);
    });

    it('should prevent removing last project manager', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      const lastPM = {
        id: 'last-pm',
        projectId: testProject.id,
        userId: projectManager.id,
        role: 'PROJECT_MANAGER'
      };

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.projectMember.findUnique.mockResolvedValue(lastPM);
      mockPrisma.projectMember.count.mockResolvedValue(1); // Only one PM

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/projects/${testProject.id}/members/${projectManager.id}`,
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectError(response, 400);
      const result = response.json();
      expect(result.error).toContain('last project manager');
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should soft delete project as admin', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      const archivedProject = {
        ...testProject,
        status: 'ARCHIVED',
        archivedAt: new Date()
      };

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue(archivedProject);

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectSuccess(response, 204);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: testProject.id },
        data: {
          status: 'ARCHIVED',
          archivedAt: expect.any(Date)
        }
      });
    });

    it('should prevent deletion of active projects with recent activity', async () => {
      const testProject = await testDb.createProject({
        status: 'ACTIVE',
        companyId: testCompany.id
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.media.count.mockResolvedValue(5); // Recent media uploads

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectError(response, 400);
      const result = response.json();
      expect(result.error).toContain('recent activity');
    });

    it('should require admin privileges for deletion', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      mockPrisma.project.findUnique.mockResolvedValue(testProject);

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      APITestHelpers.expectError(response, 403);
    });
  });

  describe('Access Control Tests', () => {
    it('should enforce company boundaries', async () => {
      const otherCompany = await testDb.createCompany({
        name: 'Other Company'
      });

      const otherProject = await testDb.createProject({
        companyId: otherCompany.id
      });

      mockPrisma.project.findUnique.mockResolvedValue(otherProject);

      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${otherProject.id}`,
        headers: AuthHelpers.createAuthHeader(workerToken)
      });

      APITestHelpers.expectError(response, 403);
    });

    it('should allow cross-role project access for company members', async () => {
      const testProject = await testDb.createProject({
        companyId: testCompany.id
      });

      const projectWithMember = {
        ...testProject,
        members: [{
          userId: worker.id,
          role: 'WORKER'
        }]
      };

      mockPrisma.project.findUnique.mockResolvedValue(projectWithMember);

      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(workerToken)
      });

      APITestHelpers.expectSuccess(response);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent project creation efficiently', async () => {
      const createPromises = Array(3).fill().map((_, index) => {
        mockPrisma.project.create.mockResolvedValueOnce({
          id: `concurrent-${index}`,
          name: `Concurrent Project ${index}`,
          companyId: testCompany.id
        });

        return fastify.inject({
          method: 'POST',
          url: '/projects',
          headers: AuthHelpers.createAuthHeader(adminToken),
          payload: {
            name: `Concurrent Project ${index}`,
            description: `Project ${index} description`
          }
        });
      });

      const responses = await Promise.all(createPromises);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(201);
      });
    });

    it('should efficiently query projects with complex filters', async () => {
      const complexQuery = {
        status: 'ACTIVE',
        search: 'construction',
        page: 1,
        limit: 50
      };

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: `/projects?${new URLSearchParams(complexQuery).toString()}`,
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectSuccess(response);
      
      // Verify efficient query structure
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'ACTIVE',
          OR: expect.any(Array)
        }),
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 50
      });
    });
  });
});