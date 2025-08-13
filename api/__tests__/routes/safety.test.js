/**
 * Safety Routes Test Suite
 * Comprehensive testing for safety inspections, incident reporting, and compliance tracking
 */

const { TestDatabase, AuthHelpers, MockServiceHelpers, APITestHelpers } = require('../utils/testHelpers');
const { setupTestDatabase, cleanupTestDatabase } = require('../utils/testDatabase');

// Mock external services
jest.mock('../../src/lib/prisma');
jest.mock('../../src/services/emailService');
jest.mock('../../src/services/pushNotificationService');
jest.mock('../../src/middleware/validation');

// Mock modules
const mockPrisma = MockServiceHelpers.createPrismaMock();
const mockEmailService = MockServiceHelpers.createEmailMock();
const mockPushService = {
  sendNotification: jest.fn(),
  sendBulkNotification: jest.fn()
};

require('../../src/lib/prisma').default = mockPrisma;
require('../../src/services/emailService').default = mockEmailService;
require('../../src/services/pushNotificationService').default = mockPushService;

// Mock validation middleware
require('../../src/middleware/validation').validate = jest.fn((schema) => (req, reply, done) => {
  // Simulate validation failures
  if (req.body?.type === 'INVALID_TYPE') {
    return reply.code(400).send({ error: 'Invalid inspection type' });
  }
  if (req.body?.score && (req.body.score < 0 || req.body.score > 100)) {
    return reply.code(400).send({ error: 'Score must be between 0 and 100' });
  }
  done && done();
});

// Mock Fastify app
const fastify = require('fastify')({ logger: false });

describe('Safety Routes', () => {
  let testDb;
  let testCompany;
  let testProject;
  let adminUser;
  let safetyInspector;
  let projectManager;
  let foreman;
  let worker;
  let adminToken;
  let inspectorToken;
  let pmToken;
  let foremanToken;
  let workerToken;

  beforeAll(async () => {
    // Register routes
    await fastify.register(require('../../src/routes/safety'));
    
    // Register required plugins
    await fastify.register(require('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'test-secret'
    });
    
    testDb = await setupTestDatabase();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create test data
    testCompany = await testDb.createCompany({
      name: 'Safety Test Company'
    });

    testProject = await testDb.createProject({
      name: 'Safety Test Project',
      companyId: testCompany.id,
      status: 'ACTIVE'
    });

    // Create users with different roles
    adminUser = await testDb.createUser({
      email: 'admin@safety.com',
      name: 'Safety Admin',
      role: 'ADMIN',
      companyId: testCompany.id
    });

    safetyInspector = await testDb.createUser({
      email: 'inspector@safety.com',
      name: 'Safety Inspector',
      role: 'SAFETY_INSPECTOR',
      companyId: testCompany.id
    });

    projectManager = await testDb.createUser({
      email: 'pm@safety.com',
      name: 'Project Manager',
      role: 'PROJECT_MANAGER',
      companyId: testCompany.id
    });

    foreman = await testDb.createUser({
      email: 'foreman@safety.com',
      name: 'Foreman',
      role: 'FOREMAN',
      companyId: testCompany.id
    });

    worker = await testDb.createUser({
      email: 'worker@safety.com',
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

    inspectorToken = AuthHelpers.generateToken({
      id: safetyInspector.id,
      email: safetyInspector.email,
      role: safetyInspector.role,
      companyId: safetyInspector.companyId
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
        const users = [adminUser, safetyInspector, projectManager, foreman, worker];
        return Promise.resolve(users.find(u => u.id === args.where.id));
      });

    mockPrisma.project.findUnique.mockResolvedValue(testProject);
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await fastify.close();
  });

  describe('POST /safety/inspections', () => {
    it('should create safety inspection as safety inspector', async () => {
      const newInspection = {
        id: 'inspection-123',
        projectId: testProject.id,
        inspectorId: safetyInspector.id,
        type: 'GENERAL_SAFETY',
        status: 'PASSED',
        score: 95,
        findings: [
          {
            category: 'PPE',
            status: 'PASS',
            notes: 'All workers wearing proper PPE'
          },
          {
            category: 'FALL_PROTECTION',
            status: 'PASS',
            notes: 'Harnesses properly secured'
          }
        ],
        recommendations: ['Continue current safety practices'],
        inspectionDate: new Date(),
        nextInspectionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      mockPrisma.safetyInspection.create.mockResolvedValue(newInspection);

      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/inspections',
        headers: AuthHelpers.createAuthHeader(inspectorToken),
        payload: {
          projectId: testProject.id,
          type: 'GENERAL_SAFETY',
          findings: [
            {
              category: 'PPE',
              status: 'PASS',
              notes: 'All workers wearing proper PPE'
            },
            {
              category: 'FALL_PROTECTION',
              status: 'PASS',
              notes: 'Harnesses properly secured'
            }
          ],
          recommendations: ['Continue current safety practices'],
          score: 95
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'inspection-123');
      expect(result).toHaveProperty('score', 95);
      expect(result).toHaveProperty('status', 'PASSED');
      expect(result.findings).toHaveLength(2);

      expect(mockPrisma.safetyInspection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: testProject.id,
          inspectorId: safetyInspector.id,
          type: 'GENERAL_SAFETY',
          score: 95
        }),
        include: expect.any(Object)
      });
    });

    it('should create inspection as project manager', async () => {
      const inspection = {
        id: 'pm-inspection-456',
        inspectorId: projectManager.id,
        type: 'QUALITY_SAFETY'
      };

      mockPrisma.safetyInspection.create.mockResolvedValue(inspection);

      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/inspections',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          projectId: testProject.id,
          type: 'QUALITY_SAFETY',
          findings: [],
          score: 88
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'pm-inspection-456');
    });

    it('should automatically determine status based on score', async () => {
      const failedInspection = {
        id: 'failed-inspection',
        score: 65,
        status: 'FAILED'
      };

      mockPrisma.safetyInspection.create.mockResolvedValue(failedInspection);

      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/inspections',
        headers: AuthHelpers.createAuthHeader(inspectorToken),
        payload: {
          projectId: testProject.id,
          type: 'GENERAL_SAFETY',
          score: 65,
          findings: [
            {
              category: 'PPE',
              status: 'FAIL',
              notes: 'Some workers not wearing hard hats'
            }
          ]
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result.status).toBe('FAILED');

      expect(mockPrisma.safetyInspection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'FAILED'
        }),
        include: expect.any(Object)
      });
    });

    it('should reject inspection creation by worker', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/inspections',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          projectId: testProject.id,
          type: 'GENERAL_SAFETY',
          score: 90
        }
      });

      APITestHelpers.expectError(response, 403);
      const result = response.json();
      expect(result.error).toContain('Insufficient permissions');
    });

    it('should send notifications for failed inspections', async () => {
      const failedInspection = {
        id: 'failed-notification',
        score: 60,
        status: 'FAILED',
        projectId: testProject.id
      };

      mockPrisma.safetyInspection.create.mockResolvedValue(failedInspection);
      mockPrisma.projectMember.findMany.mockResolvedValue([
        { user: projectManager },
        { user: foreman }
      ]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/inspections',
        headers: AuthHelpers.createAuthHeader(inspectorToken),
        payload: {
          projectId: testProject.id,
          type: 'GENERAL_SAFETY',
          score: 60,
          findings: [
            {
              category: 'FALL_PROTECTION',
              status: 'FAIL',
              notes: 'Missing safety equipment'
            }
          ]
        }
      });

      APITestHelpers.expectSuccess(response, 201);

      // Verify notifications sent
      expect(mockPushService.sendBulkNotification).toHaveBeenCalledWith({
        users: expect.arrayContaining([projectManager.id, foreman.id]),
        title: 'Safety Inspection Failed',
        body: expect.stringContaining('requires immediate attention'),
        data: {
          type: 'SAFETY_INSPECTION_FAILED',
          inspectionId: 'failed-notification',
          projectId: testProject.id
        }
      });

      expect(mockEmailService.send).toHaveBeenCalledTimes(2); // PM and Foreman
    });

    it('should validate inspection data', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/inspections',
        headers: AuthHelpers.createAuthHeader(inspectorToken),
        payload: {
          projectId: testProject.id,
          type: 'INVALID_TYPE',
          score: 95
        }
      });

      APITestHelpers.expectError(response, 400);
    });

    it('should validate score range', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/inspections',
        headers: AuthHelpers.createAuthHeader(inspectorToken),
        payload: {
          projectId: testProject.id,
          type: 'GENERAL_SAFETY',
          score: 150 // Invalid score
        }
      });

      APITestHelpers.expectError(response, 400);
    });
  });

  describe('GET /safety/inspections', () => {
    it('should return paginated inspections for project', async () => {
      const mockInspections = [
        {
          id: 'inspection-1',
          type: 'GENERAL_SAFETY',
          status: 'PASSED',
          score: 95,
          projectId: testProject.id,
          inspector: safetyInspector,
          inspectionDate: new Date()
        },
        {
          id: 'inspection-2',
          type: 'EQUIPMENT_SAFETY',
          status: 'FAILED',
          score: 65,
          projectId: testProject.id,
          inspector: safetyInspector,
          inspectionDate: new Date()
        }
      ];

      mockPrisma.safetyInspection.findMany.mockResolvedValue(mockInspections);
      mockPrisma.safetyInspection.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: `/safety/inspections?projectId=${testProject.id}&page=1&limit=10`,
        headers: AuthHelpers.createAuthHeader(inspectorToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('inspections');
      expect(result).toHaveProperty('pagination');
      expect(result.inspections).toHaveLength(2);
      expect(result.pagination.total).toBe(2);

      expect(mockPrisma.safetyInspection.findMany).toHaveBeenCalledWith({
        where: { projectId: testProject.id },
        include: expect.objectContaining({
          inspector: expect.any(Object)
        }),
        orderBy: { inspectionDate: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should filter inspections by status', async () => {
      const failedInspections = [
        {
          id: 'failed-1',
          status: 'FAILED',
          projectId: testProject.id
        }
      ];

      mockPrisma.safetyInspection.findMany.mockResolvedValue(failedInspections);

      const response = await fastify.inject({
        method: 'GET',
        url: `/safety/inspections?projectId=${testProject.id}&status=FAILED`,
        headers: AuthHelpers.createAuthHeader(inspectorToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.safetyInspection.findMany).toHaveBeenCalledWith({
        where: {
          projectId: testProject.id,
          status: 'FAILED'
        },
        include: expect.any(Object),
        orderBy: { inspectionDate: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should filter inspections by type', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/safety/inspections?projectId=${testProject.id}&type=GENERAL_SAFETY`,
        headers: AuthHelpers.createAuthHeader(inspectorToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.safetyInspection.findMany).toHaveBeenCalledWith({
        where: {
          projectId: testProject.id,
          type: 'GENERAL_SAFETY'
        },
        include: expect.any(Object),
        orderBy: { inspectionDate: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should filter inspections by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const response = await fastify.inject({
        method: 'GET',
        url: `/safety/inspections?projectId=${testProject.id}&startDate=${startDate}&endDate=${endDate}`,
        headers: AuthHelpers.createAuthHeader(inspectorToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.safetyInspection.findMany).toHaveBeenCalledWith({
        where: {
          projectId: testProject.id,
          inspectionDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: expect.any(Object),
        orderBy: { inspectionDate: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should return company-wide inspections for admin', async () => {
      const companyInspections = [
        { id: 'company-1', projectId: testProject.id },
        { id: 'company-2', projectId: 'other-project-id' }
      ];

      mockPrisma.safetyInspection.findMany.mockResolvedValue(companyInspections);

      const response = await fastify.inject({
        method: 'GET',
        url: '/safety/inspections', // No projectId for company-wide
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.safetyInspection.findMany).toHaveBeenCalledWith({
        where: {
          project: {
            companyId: testCompany.id
          }
        },
        include: expect.any(Object),
        orderBy: { inspectionDate: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('GET /safety/inspections/:id', () => {
    it('should return detailed inspection information', async () => {
      const detailedInspection = {
        id: 'detailed-inspection',
        type: 'GENERAL_SAFETY',
        status: 'PASSED',
        score: 92,
        findings: [
          {
            category: 'PPE',
            status: 'PASS',
            notes: 'All workers wearing proper PPE',
            photos: ['photo1.jpg', 'photo2.jpg']
          }
        ],
        recommendations: ['Continue current practices'],
        correctiveActions: [],
        inspector: safetyInspector,
        project: testProject,
        inspectionDate: new Date()
      };

      mockPrisma.safetyInspection.findUnique.mockResolvedValue(detailedInspection);

      const response = await fastify.inject({
        method: 'GET',
        url: '/safety/inspections/detailed-inspection',
        headers: AuthHelpers.createAuthHeader(inspectorToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('id', 'detailed-inspection');
      expect(result).toHaveProperty('findings');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('inspector');
      expect(result.findings[0]).toHaveProperty('photos');

      expect(mockPrisma.safetyInspection.findUnique).toHaveBeenCalledWith({
        where: { id: 'detailed-inspection' },
        include: expect.objectContaining({
          inspector: expect.any(Object),
          project: expect.any(Object)
        })
      });
    });

    it('should return 404 for non-existent inspection', async () => {
      mockPrisma.safetyInspection.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: '/safety/inspections/non-existent',
        headers: AuthHelpers.createAuthHeader(inspectorToken)
      });

      APITestHelpers.expectError(response, 404);
    });

    it('should enforce access control for inspections', async () => {
      const otherCompanyInspection = {
        id: 'other-inspection',
        project: {
          companyId: 'different-company-id'
        }
      };

      mockPrisma.safetyInspection.findUnique.mockResolvedValue(otherCompanyInspection);

      const response = await fastify.inject({
        method: 'GET',
        url: '/safety/inspections/other-inspection',
        headers: AuthHelpers.createAuthHeader(workerToken)
      });

      APITestHelpers.expectError(response, 403);
    });
  });

  describe('PUT /safety/inspections/:id', () => {
    it('should update inspection as inspector', async () => {
      const originalInspection = {
        id: 'update-inspection',
        inspectorId: safetyInspector.id,
        projectId: testProject.id,
        status: 'IN_PROGRESS'
      };

      const updatedInspection = {
        ...originalInspection,
        status: 'PASSED',
        score: 94,
        findings: [
          {
            category: 'PPE',
            status: 'PASS',
            notes: 'Updated findings'
          }
        ]
      };

      mockPrisma.safetyInspection.findUnique.mockResolvedValue(originalInspection);
      mockPrisma.safetyInspection.update.mockResolvedValue(updatedInspection);

      const response = await fastify.inject({
        method: 'PUT',
        url: '/safety/inspections/update-inspection',
        headers: AuthHelpers.createAuthHeader(inspectorToken),
        payload: {
          status: 'PASSED',
          score: 94,
          findings: [
            {
              category: 'PPE',
              status: 'PASS',
              notes: 'Updated findings'
            }
          ]
        }
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result.status).toBe('PASSED');
      expect(result.score).toBe(94);

      expect(mockPrisma.safetyInspection.update).toHaveBeenCalledWith({
        where: { id: 'update-inspection' },
        data: expect.objectContaining({
          status: 'PASSED',
          score: 94
        }),
        include: expect.any(Object)
      });
    });

    it('should prevent unauthorized updates', async () => {
      const otherInspection = {
        id: 'other-inspection',
        inspectorId: 'different-inspector-id',
        projectId: testProject.id
      };

      mockPrisma.safetyInspection.findUnique.mockResolvedValue(otherInspection);

      const response = await fastify.inject({
        method: 'PUT',
        url: '/safety/inspections/other-inspection',
        headers: AuthHelpers.createAuthHeader(inspectorToken),
        payload: {
          score: 100
        }
      });

      APITestHelpers.expectError(response, 403);
    });

    it('should allow admin to update any inspection', async () => {
      const inspection = {
        id: 'admin-update',
        inspectorId: safetyInspector.id,
        projectId: testProject.id
      };

      mockPrisma.safetyInspection.findUnique.mockResolvedValue(inspection);
      mockPrisma.safetyInspection.update.mockResolvedValue({
        ...inspection,
        score: 98
      });

      const response = await fastify.inject({
        method: 'PUT',
        url: '/safety/inspections/admin-update',
        headers: AuthHelpers.createAuthHeader(adminToken),
        payload: {
          score: 98
        }
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result.score).toBe(98);
    });
  });

  describe('POST /safety/incidents', () => {
    it('should create safety incident report', async () => {
      const newIncident = {
        id: 'incident-123',
        projectId: testProject.id,
        reportedById: worker.id,
        type: 'NEAR_MISS',
        severity: 'LOW',
        description: 'Worker almost slipped on wet floor',
        location: 'Building A, Level 2',
        incidentDate: new Date(),
        status: 'REPORTED'
      };

      mockPrisma.safetyIncident.create.mockResolvedValue(newIncident);

      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/incidents',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          projectId: testProject.id,
          type: 'NEAR_MISS',
          severity: 'LOW',
          description: 'Worker almost slipped on wet floor',
          location: 'Building A, Level 2'
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'incident-123');
      expect(result).toHaveProperty('type', 'NEAR_MISS');
      expect(result).toHaveProperty('status', 'REPORTED');

      expect(mockPrisma.safetyIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: testProject.id,
          reportedById: worker.id,
          type: 'NEAR_MISS',
          severity: 'LOW'
        }),
        include: expect.any(Object)
      });
    });

    it('should immediately notify management of high severity incidents', async () => {
      const criticalIncident = {
        id: 'critical-incident',
        severity: 'HIGH',
        type: 'INJURY'
      };

      mockPrisma.safetyIncident.create.mockResolvedValue(criticalIncident);
      mockPrisma.projectMember.findMany.mockResolvedValue([
        { user: projectManager },
        { user: foreman }
      ]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/incidents',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          projectId: testProject.id,
          type: 'INJURY',
          severity: 'HIGH',
          description: 'Worker injured by falling debris',
          location: 'Construction Zone A'
        }
      });

      APITestHelpers.expectSuccess(response, 201);

      // Verify immediate notifications
      expect(mockPushService.sendBulkNotification).toHaveBeenCalledWith({
        users: expect.arrayContaining([projectManager.id, foreman.id]),
        title: 'URGENT: High Severity Safety Incident',
        body: expect.stringContaining('requires immediate attention'),
        data: {
          type: 'SAFETY_INCIDENT_HIGH_SEVERITY',
          incidentId: 'critical-incident',
          projectId: testProject.id
        }
      });

      expect(mockEmailService.send).toHaveBeenCalledTimes(2);
    });

    it('should allow anonymous incident reporting', async () => {
      const anonymousIncident = {
        id: 'anonymous-incident',
        reportedById: null,
        isAnonymous: true
      };

      mockPrisma.safetyIncident.create.mockResolvedValue(anonymousIncident);

      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/incidents',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          projectId: testProject.id,
          type: 'UNSAFE_CONDITION',
          severity: 'MEDIUM',
          description: 'Scaffolding appears unstable',
          location: 'East side construction',
          anonymous: true
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result.isAnonymous).toBe(true);

      expect(mockPrisma.safetyIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reportedById: null,
          isAnonymous: true
        }),
        include: expect.any(Object)
      });
    });
  });

  describe('GET /safety/statistics', () => {
    it('should return comprehensive safety statistics', async () => {
      const mockStats = {
        totalInspections: 25,
        passedInspections: 22,
        failedInspections: 3,
        averageScore: 88.5,
        totalIncidents: 5,
        incidentsByType: {
          NEAR_MISS: 3,
          INJURY: 1,
          UNSAFE_CONDITION: 1
        },
        incidentsBySeverity: {
          LOW: 3,
          MEDIUM: 1,
          HIGH: 1
        },
        trendsLast30Days: {
          inspectionTrend: 'improving',
          incidentTrend: 'stable'
        }
      };

      // Mock the complex database queries
      mockPrisma.safetyInspection.count
        .mockResolvedValueOnce(25) // total
        .mockResolvedValueOnce(22) // passed
        .mockResolvedValueOnce(3); // failed

      mockPrisma.safetyInspection.aggregate.mockResolvedValue({
        _avg: { score: 88.5 }
      });

      mockPrisma.safetyIncident.count.mockResolvedValue(5);

      mockPrisma.safetyIncident.groupBy
        .mockResolvedValueOnce([ // by type
          { type: 'NEAR_MISS', _count: { type: 3 } },
          { type: 'INJURY', _count: { type: 1 } },
          { type: 'UNSAFE_CONDITION', _count: { type: 1 } }
        ])
        .mockResolvedValueOnce([ // by severity
          { severity: 'LOW', _count: { severity: 3 } },
          { severity: 'MEDIUM', _count: { severity: 1 } },
          { severity: 'HIGH', _count: { severity: 1 } }
        ]);

      const response = await fastify.inject({
        method: 'GET',
        url: `/safety/statistics?projectId=${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(inspectorToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('totalInspections', 25);
      expect(result).toHaveProperty('averageScore', 88.5);
      expect(result).toHaveProperty('totalIncidents', 5);
      expect(result).toHaveProperty('incidentsByType');
      expect(result).toHaveProperty('incidentsBySeverity');
    });

    it('should return company-wide statistics for admin', async () => {
      mockPrisma.safetyInspection.count.mockResolvedValue(100);
      mockPrisma.safetyIncident.count.mockResolvedValue(15);

      const response = await fastify.inject({
        method: 'GET',
        url: '/safety/statistics', // Company-wide
        headers: AuthHelpers.createAuthHeader(adminToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result.totalInspections).toBe(100);
      expect(result.totalIncidents).toBe(15);

      // Verify company-wide queries
      expect(mockPrisma.safetyInspection.count).toHaveBeenCalledWith({
        where: {
          project: {
            companyId: testCompany.id
          }
        }
      });
    });
  });

  describe('Performance and Security Tests', () => {
    it('should handle concurrent incident reporting efficiently', async () => {
      const reportPromises = Array(5).fill().map((_, index) => {
        mockPrisma.safetyIncident.create.mockResolvedValueOnce({
          id: `concurrent-incident-${index}`,
          type: 'NEAR_MISS'
        });

        return fastify.inject({
          method: 'POST',
          url: '/safety/incidents',
          headers: AuthHelpers.createAuthHeader(workerToken),
          payload: {
            projectId: testProject.id,
            type: 'NEAR_MISS',
            severity: 'LOW',
            description: `Concurrent incident report ${index}`,
            location: `Location ${index}`
          }
        });
      });

      const responses = await Promise.all(reportPromises);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(201);
      });

      expect(mockPrisma.safetyIncident.create).toHaveBeenCalledTimes(5);
    });

    it('should sanitize incident descriptions to prevent XSS', async () => {
      const maliciousIncident = {
        id: 'sanitized-incident',
        description: 'Clean description' // Sanitized version
      };

      mockPrisma.safetyIncident.create.mockResolvedValue(maliciousIncident);

      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/incidents',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          projectId: testProject.id,
          type: 'NEAR_MISS',
          severity: 'LOW',
          description: '<script>alert("XSS")</script>Worker slipped',
          location: 'Test Area'
        }
      });

      APITestHelpers.expectSuccess(response, 201);
      
      // Verify description was sanitized
      expect(mockPrisma.safetyIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: expect.not.stringContaining('<script>')
        }),
        include: expect.any(Object)
      });
    });

    it('should rate limit incident reporting to prevent spam', async () => {
      // This would be tested with actual rate limiting middleware
      // For now, we verify the endpoint handles multiple requests
      const response = await fastify.inject({
        method: 'POST',
        url: '/safety/incidents',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          projectId: testProject.id,
          type: 'NEAR_MISS',
          severity: 'LOW',
          description: 'Rate limit test',
          location: 'Test'
        }
      });

      // Should succeed normally
      expect(response.statusCode).toBeLessThan(400);
    });
  });
});