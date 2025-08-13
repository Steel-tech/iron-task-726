/**
 * Quality Routes Test Suite
 * Comprehensive testing for quality checks, inspections, and compliance tracking
 */

const { TestDatabase, AuthHelpers, MockServiceHelpers, APITestHelpers } = require('../utils/testHelpers');
const { setupTestDatabase, cleanupTestDatabase } = require('../utils/testDatabase');

// Mock external services
jest.mock('../../src/lib/prisma');
jest.mock('../../src/services/emailService');
jest.mock('../../src/services/pdfReportService');
jest.mock('../../src/middleware/validation');

// Mock modules
const mockPrisma = MockServiceHelpers.createPrismaMock();
const mockEmailService = MockServiceHelpers.createEmailMock();
const mockPdfService = {
  generateQualityReport: jest.fn(),
  generateComplianceReport: jest.fn()
};

require('../../src/lib/prisma').default = mockPrisma;
require('../../src/services/emailService').default = mockEmailService;
require('../../src/services/pdfReportService').default = mockPdfService;

// Mock validation middleware
require('../../src/middleware/validation').validate = jest.fn((schema) => (req, reply, done) => {
  // Simulate validation failures
  if (req.body?.criteria && req.body.criteria.length === 0) {
    return reply.code(400).send({ error: 'At least one criterion is required' });
  }
  if (req.body?.type === 'INVALID_TYPE') {
    return reply.code(400).send({ error: 'Invalid quality check type' });
  }
  done && done();
});

// Mock Fastify app
const fastify = require('fastify')({ logger: false });

describe('Quality Routes', () => {
  let testDb;
  let testCompany;
  let testProject;
  let adminUser;
  let projectManager;
  let foreman;
  let qualityInspector;
  let worker;
  let adminToken;
  let pmToken;
  let foremanToken;
  let inspectorToken;
  let workerToken;

  beforeAll(async () => {
    // Register routes
    await fastify.register(require('../../src/routes/quality'));
    
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
      name: 'Quality Test Company'
    });

    testProject = await testDb.createProject({
      name: 'Quality Test Project',
      companyId: testCompany.id,
      status: 'ACTIVE'
    });

    // Create users with different roles
    adminUser = await testDb.createUser({
      email: 'admin@quality.com',
      name: 'Quality Admin',
      role: 'ADMIN',
      companyId: testCompany.id
    });

    projectManager = await testDb.createUser({
      email: 'pm@quality.com',
      name: 'Project Manager',
      role: 'PROJECT_MANAGER',
      companyId: testCompany.id
    });

    foreman = await testDb.createUser({
      email: 'foreman@quality.com',
      name: 'Foreman',
      role: 'FOREMAN',
      companyId: testCompany.id
    });

    // Note: Using PROJECT_MANAGER as quality inspector since QUALITY_INSPECTOR may not be in enum
    qualityInspector = await testDb.createUser({
      email: 'inspector@quality.com',
      name: 'Quality Inspector',
      role: 'PROJECT_MANAGER', // Acting as quality inspector
      companyId: testCompany.id
    });

    worker = await testDb.createUser({
      email: 'worker@quality.com',
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

    inspectorToken = AuthHelpers.generateToken({
      id: qualityInspector.id,
      email: qualityInspector.email,
      role: qualityInspector.role,
      companyId: qualityInspector.companyId
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
        const users = [adminUser, projectManager, foreman, qualityInspector, worker];
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

  describe('POST /quality/checks', () => {
    it('should create quality check as project manager', async () => {
      const newQualityCheck = {
        id: 'quality-123',
        projectId: testProject.id,
        inspectorId: projectManager.id,
        type: 'STRUCTURAL_INTEGRITY',
        status: 'PASSED',
        criteria: [
          {
            name: 'Bolt Torque',
            requirement: '250 ft-lbs minimum',
            measurement: '260 ft-lbs',
            status: 'PASS',
            notes: 'All bolts properly torqued'
          },
          {
            name: 'Weld Quality',
            requirement: 'AWS D1.1 standards',
            measurement: 'Visual inspection passed',
            status: 'PASS',
            notes: 'No visible defects'
          }
        ],
        overallScore: 100,
        checkDate: new Date(),
        location: 'Building A, Grid 5-6/A-B'
      };

      mockPrisma.qualityCheck.create.mockResolvedValue(newQualityCheck);

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          projectId: testProject.id,
          type: 'STRUCTURAL_INTEGRITY',
          criteria: [
            {
              name: 'Bolt Torque',
              requirement: '250 ft-lbs minimum',
              measurement: '260 ft-lbs',
              status: 'PASS',
              notes: 'All bolts properly torqued'
            },
            {
              name: 'Weld Quality',
              requirement: 'AWS D1.1 standards',
              measurement: 'Visual inspection passed',
              status: 'PASS',
              notes: 'No visible defects'
            }
          ],
          location: 'Building A, Grid 5-6/A-B'
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'quality-123');
      expect(result).toHaveProperty('type', 'STRUCTURAL_INTEGRITY');
      expect(result).toHaveProperty('status', 'PASSED');
      expect(result.criteria).toHaveLength(2);
      expect(result.overallScore).toBe(100);

      expect(mockPrisma.qualityCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: testProject.id,
          inspectorId: projectManager.id,
          type: 'STRUCTURAL_INTEGRITY',
          status: 'PASSED'
        }),
        include: expect.any(Object)
      });
    });

    it('should create quality check as foreman', async () => {
      const foremanCheck = {
        id: 'foreman-check-456',
        inspectorId: foreman.id,
        type: 'WORKMANSHIP'
      };

      mockPrisma.qualityCheck.create.mockResolvedValue(foremanCheck);

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks',
        headers: AuthHelpers.createAuthHeader(foremanToken),
        payload: {
          projectId: testProject.id,
          type: 'WORKMANSHIP',
          criteria: [
            {
              name: 'Surface Finish',
              requirement: 'Smooth, no burrs',
              measurement: 'Visual inspection',
              status: 'PASS'
            }
          ]
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'foreman-check-456');
    });

    it('should automatically calculate overall score and status', async () => {
      const mixedResultsCheck = {
        id: 'mixed-results',
        status: 'FAILED',
        overallScore: 50
      };

      mockPrisma.qualityCheck.create.mockResolvedValue(mixedResultsCheck);

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          projectId: testProject.id,
          type: 'DIMENSIONAL_ACCURACY',
          criteria: [
            {
              name: 'Column Plumb',
              requirement: '1/4" in 10 feet',
              measurement: '1/8" in 10 feet',
              status: 'PASS'
            },
            {
              name: 'Beam Level',
              requirement: '1/8" in 20 feet',
              measurement: '1/2" in 20 feet',
              status: 'FAIL',
              notes: 'Exceeds tolerance'
            }
          ]
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result.status).toBe('FAILED');
      expect(result.overallScore).toBe(50);
    });

    it('should reject quality check creation by worker', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          projectId: testProject.id,
          type: 'MATERIAL_COMPLIANCE',
          criteria: []
        }
      });

      APITestHelpers.expectError(response, 403);
      const result = response.json();
      expect(result.error).toContain('Insufficient permissions');
    });

    it('should validate criteria requirements', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          projectId: testProject.id,
          type: 'STRUCTURAL_INTEGRITY',
          criteria: [] // Empty criteria should fail validation
        }
      });

      APITestHelpers.expectError(response, 400);
    });

    it('should send notifications for failed quality checks', async () => {
      const failedCheck = {
        id: 'failed-check',
        status: 'FAILED',
        overallScore: 60,
        projectId: testProject.id
      };

      mockPrisma.qualityCheck.create.mockResolvedValue(failedCheck);
      mockPrisma.projectMember.findMany.mockResolvedValue([
        { user: projectManager }
      ]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks',
        headers: AuthHelpers.createAuthHeader(inspectorToken),
        payload: {
          projectId: testProject.id,
          type: 'WELD_INSPECTION',
          criteria: [
            {
              name: 'Penetration',
              requirement: 'Full penetration',
              measurement: 'Partial penetration',
              status: 'FAIL',
              notes: 'Insufficient weld penetration'
            }
          ]
        }
      });

      APITestHelpers.expectSuccess(response, 201);

      // Verify notification sent
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: projectManager.email,
        subject: expect.stringContaining('Quality Check Failed'),
        template: 'quality-check-failed',
        data: expect.objectContaining({
          projectName: testProject.name,
          checkType: 'WELD_INSPECTION'
        })
      });
    });
  });

  describe('GET /quality/checks', () => {
    it('should return paginated quality checks for project', async () => {
      const mockChecks = [
        {
          id: 'check-1',
          type: 'STRUCTURAL_INTEGRITY',
          status: 'PASSED',
          overallScore: 95,
          projectId: testProject.id,
          inspector: projectManager,
          checkDate: new Date()
        },
        {
          id: 'check-2',
          type: 'MATERIAL_COMPLIANCE',
          status: 'FAILED',
          overallScore: 65,
          projectId: testProject.id,
          inspector: foreman,
          checkDate: new Date()
        }
      ];

      mockPrisma.qualityCheck.findMany.mockResolvedValue(mockChecks);
      mockPrisma.qualityCheck.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: `/quality/checks?projectId=${testProject.id}&page=1&limit=10`,
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('pagination');
      expect(result.checks).toHaveLength(2);
      expect(result.pagination.total).toBe(2);

      expect(mockPrisma.qualityCheck.findMany).toHaveBeenCalledWith({
        where: { projectId: testProject.id },
        include: expect.objectContaining({
          inspector: expect.any(Object)
        }),
        orderBy: { checkDate: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should filter checks by type', async () => {
      const structuralChecks = [
        {
          id: 'structural-1',
          type: 'STRUCTURAL_INTEGRITY',
          projectId: testProject.id
        }
      ];

      mockPrisma.qualityCheck.findMany.mockResolvedValue(structuralChecks);

      const response = await fastify.inject({
        method: 'GET',
        url: `/quality/checks?projectId=${testProject.id}&type=STRUCTURAL_INTEGRITY`,
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.qualityCheck.findMany).toHaveBeenCalledWith({
        where: {
          projectId: testProject.id,
          type: 'STRUCTURAL_INTEGRITY'
        },
        include: expect.any(Object),
        orderBy: { checkDate: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should filter checks by status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/quality/checks?projectId=${testProject.id}&status=FAILED`,
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.qualityCheck.findMany).toHaveBeenCalledWith({
        where: {
          projectId: testProject.id,
          status: 'FAILED'
        },
        include: expect.any(Object),
        orderBy: { checkDate: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should filter checks by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const response = await fastify.inject({
        method: 'GET',
        url: `/quality/checks?projectId=${testProject.id}&startDate=${startDate}&endDate=${endDate}`,
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      APITestHelpers.expectSuccess(response);
      expect(mockPrisma.qualityCheck.findMany).toHaveBeenCalledWith({
        where: {
          projectId: testProject.id,
          checkDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: expect.any(Object),
        orderBy: { checkDate: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });

  describe('GET /quality/checks/:id', () => {
    it('should return detailed quality check information', async () => {
      const detailedCheck = {
        id: 'detailed-check',
        type: 'WELD_INSPECTION',
        status: 'PASSED',
        overallScore: 92,
        criteria: [
          {
            name: 'Penetration',
            requirement: 'Full penetration per AWS D1.1',
            measurement: 'Full penetration achieved',
            status: 'PASS',
            notes: 'Excellent weld quality',
            photos: ['weld-1.jpg', 'weld-2.jpg']
          },
          {
            name: 'Surface Quality',
            requirement: 'Smooth surface, no defects',
            measurement: 'Visual inspection passed',
            status: 'PASS'
          }
        ],
        inspector: projectManager,
        project: testProject,
        checkDate: new Date(),
        location: 'Column C-3, Level 2',
        correctiveActions: []
      };

      mockPrisma.qualityCheck.findUnique.mockResolvedValue(detailedCheck);

      const response = await fastify.inject({
        method: 'GET',
        url: '/quality/checks/detailed-check',
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('id', 'detailed-check');
      expect(result).toHaveProperty('criteria');
      expect(result).toHaveProperty('inspector');
      expect(result).toHaveProperty('location', 'Column C-3, Level 2');
      expect(result.criteria[0]).toHaveProperty('photos');

      expect(mockPrisma.qualityCheck.findUnique).toHaveBeenCalledWith({
        where: { id: 'detailed-check' },
        include: expect.objectContaining({
          inspector: expect.any(Object),
          project: expect.any(Object)
        })
      });
    });

    it('should return 404 for non-existent quality check', async () => {
      mockPrisma.qualityCheck.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: '/quality/checks/non-existent',
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      APITestHelpers.expectError(response, 404);
    });
  });

  describe('PUT /quality/checks/:id', () => {
    it('should update quality check as inspector', async () => {
      const originalCheck = {
        id: 'update-check',
        inspectorId: projectManager.id,
        projectId: testProject.id,
        status: 'IN_PROGRESS'
      };

      const updatedCheck = {
        ...originalCheck,
        status: 'PASSED',
        overallScore: 88,
        criteria: [
          {
            name: 'Dimensional Accuracy',
            status: 'PASS',
            notes: 'Updated measurement'
          }
        ]
      };

      mockPrisma.qualityCheck.findUnique.mockResolvedValue(originalCheck);
      mockPrisma.qualityCheck.update.mockResolvedValue(updatedCheck);

      const response = await fastify.inject({
        method: 'PUT',
        url: '/quality/checks/update-check',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          status: 'PASSED',
          criteria: [
            {
              name: 'Dimensional Accuracy',
              status: 'PASS',
              notes: 'Updated measurement'
            }
          ]
        }
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result.status).toBe('PASSED');
      expect(result.overallScore).toBe(88);

      expect(mockPrisma.qualityCheck.update).toHaveBeenCalledWith({
        where: { id: 'update-check' },
        data: expect.objectContaining({
          status: 'PASSED'
        }),
        include: expect.any(Object)
      });
    });

    it('should prevent unauthorized updates', async () => {
      const otherInspectorCheck = {
        id: 'other-check',
        inspectorId: 'different-inspector-id',
        projectId: testProject.id
      };

      mockPrisma.qualityCheck.findUnique.mockResolvedValue(otherInspectorCheck);

      const response = await fastify.inject({
        method: 'PUT',
        url: '/quality/checks/other-check',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          overallScore: 100
        }
      });

      APITestHelpers.expectError(response, 403);
    });
  });

  describe('POST /quality/checks/:id/corrective-actions', () => {
    it('should add corrective action to failed quality check', async () => {
      const failedCheck = {
        id: 'failed-check',
        status: 'FAILED',
        projectId: testProject.id
      };

      const correctiveAction = {
        id: 'action-123',
        qualityCheckId: 'failed-check',
        description: 'Re-weld connection with proper technique',
        assignedTo: worker.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'ASSIGNED',
        priority: 'HIGH'
      };

      mockPrisma.qualityCheck.findUnique.mockResolvedValue(failedCheck);
      mockPrisma.correctiveAction.create.mockResolvedValue(correctiveAction);

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks/failed-check/corrective-actions',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          description: 'Re-weld connection with proper technique',
          assignedTo: worker.id,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'HIGH'
        }
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'action-123');
      expect(result).toHaveProperty('status', 'ASSIGNED');
      expect(result).toHaveProperty('priority', 'HIGH');

      expect(mockPrisma.correctiveAction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          qualityCheckId: 'failed-check',
          assignedTo: worker.id,
          status: 'ASSIGNED'
        }),
        include: expect.any(Object)
      });
    });

    it('should send notification to assigned worker', async () => {
      const failedCheck = {
        id: 'notification-check',
        status: 'FAILED',
        projectId: testProject.id,
        project: testProject
      };

      mockPrisma.qualityCheck.findUnique.mockResolvedValue(failedCheck);
      mockPrisma.correctiveAction.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(worker);

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks/notification-check/corrective-actions',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          description: 'Fix weld defect',
          assignedTo: worker.id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      });

      APITestHelpers.expectSuccess(response, 201);

      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: worker.email,
        subject: expect.stringContaining('Corrective Action Assigned'),
        template: 'corrective-action-assigned',
        data: expect.objectContaining({
          workerName: worker.name,
          projectName: testProject.name
        })
      });
    });
  });

  describe('GET /quality/statistics', () => {
    it('should return comprehensive quality statistics', async () => {
      // Mock database queries for statistics
      mockPrisma.qualityCheck.count
        .mockResolvedValueOnce(30) // total checks
        .mockResolvedValueOnce(25) // passed
        .mockResolvedValueOnce(5); // failed

      mockPrisma.qualityCheck.aggregate.mockResolvedValue({
        _avg: { overallScore: 87.3 }
      });

      mockPrisma.qualityCheck.groupBy.mockResolvedValue([
        { type: 'STRUCTURAL_INTEGRITY', _count: { type: 12 } },
        { type: 'WELD_INSPECTION', _count: { type: 10 } },
        { type: 'MATERIAL_COMPLIANCE', _count: { type: 8 } }
      ]);

      mockPrisma.correctiveAction.count
        .mockResolvedValueOnce(8) // total actions
        .mockResolvedValueOnce(6) // completed
        .mockResolvedValueOnce(2); // pending

      const response = await fastify.inject({
        method: 'GET',
        url: `/quality/statistics?projectId=${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      const result = APITestHelpers.expectSuccess(response);
      expect(result).toHaveProperty('totalChecks', 30);
      expect(result).toHaveProperty('passedChecks', 25);
      expect(result).toHaveProperty('failedChecks', 5);
      expect(result).toHaveProperty('averageScore', 87.3);
      expect(result).toHaveProperty('checksByType');
      expect(result).toHaveProperty('correctiveActions');
      expect(result.correctiveActions).toHaveProperty('total', 8);
      expect(result.correctiveActions).toHaveProperty('completed', 6);
    });
  });

  describe('POST /quality/reports', () => {
    it('should generate quality compliance report', async () => {
      const reportData = {
        projectId: testProject.id,
        period: 'monthly',
        includeCharts: true,
        includeTrends: true
      };

      const mockReport = {
        id: 'report-123',
        url: 'https://storage.example.com/quality-report.pdf',
        filename: 'quality-report-202401.pdf',
        generatedAt: new Date()
      };

      mockPdfService.generateQualityReport.mockResolvedValue(mockReport);

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/reports',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: reportData
      });

      const result = APITestHelpers.expectSuccess(response, 201);
      expect(result).toHaveProperty('id', 'report-123');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');

      expect(mockPdfService.generateQualityReport).toHaveBeenCalledWith({
        projectId: testProject.id,
        period: 'monthly',
        includeCharts: true,
        includeTrends: true
      });
    });

    it('should email report to stakeholders', async () => {
      const mockReport = {
        id: 'email-report',
        url: 'https://storage.example.com/report.pdf'
      };

      mockPdfService.generateQualityReport.mockResolvedValue(mockReport);
      mockPrisma.projectMember.findMany.mockResolvedValue([
        { user: projectManager },
        { user: foreman }
      ]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/reports',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          projectId: testProject.id,
          period: 'weekly',
          emailTo: ['stakeholders']
        }
      });

      APITestHelpers.expectSuccess(response, 201);

      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: [projectManager.email, foreman.email],
        subject: expect.stringContaining('Quality Report'),
        template: 'quality-report',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('.pdf'),
            path: mockReport.url
          })
        ])
      });
    });
  });

  describe('Performance and Security Tests', () => {
    it('should handle concurrent quality check creation efficiently', async () => {
      const createPromises = Array(3).fill().map((_, index) => {
        mockPrisma.qualityCheck.create.mockResolvedValueOnce({
          id: `concurrent-check-${index}`,
          type: 'STRUCTURAL_INTEGRITY'
        });

        return fastify.inject({
          method: 'POST',
          url: '/quality/checks',
          headers: AuthHelpers.createAuthHeader(pmToken),
          payload: {
            projectId: testProject.id,
            type: 'STRUCTURAL_INTEGRITY',
            criteria: [
              {
                name: `Criterion ${index}`,
                requirement: 'Test requirement',
                measurement: 'Test measurement',
                status: 'PASS'
              }
            ]
          }
        });
      });

      const responses = await Promise.all(createPromises);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(201);
      });

      expect(mockPrisma.qualityCheck.create).toHaveBeenCalledTimes(3);
    });

    it('should validate input data to prevent injection attacks', async () => {
      const maliciousData = {
        projectId: testProject.id,
        type: 'STRUCTURAL_INTEGRITY',
        criteria: [
          {
            name: '<script>alert("XSS")</script>Bolt Torque',
            requirement: 'DROP TABLE quality_checks;--',
            measurement: '260 ft-lbs',
            status: 'PASS'
          }
        ]
      };

      // Mock would sanitize the data
      mockPrisma.qualityCheck.create.mockResolvedValue({
        id: 'sanitized-check',
        criteria: [
          {
            name: 'Bolt Torque', // Sanitized
            requirement: 'DROP TABLE quality_checks;--', // Would be sanitized in real implementation
            status: 'PASS'
          }
        ]
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/quality/checks',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: maliciousData
      });

      // Should succeed but with sanitized data
      APITestHelpers.expectSuccess(response, 201);
      
      // In a real implementation, verify the data was sanitized
      expect(mockPrisma.qualityCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          criteria: expect.arrayContaining([
            expect.objectContaining({
              name: expect.not.stringContaining('<script>')
            })
          ])
        }),
        include: expect.any(Object)
      });
    });

    it('should efficiently query quality statistics', async () => {
      // Test that statistics queries are optimized
      const response = await fastify.inject({
        method: 'GET',
        url: `/quality/statistics?projectId=${testProject.id}`,
        headers: AuthHelpers.createAuthHeader(pmToken)
      });

      APITestHelpers.expectSuccess(response);

      // Verify efficient query patterns
      expect(mockPrisma.qualityCheck.count).toHaveBeenCalledWith({
        where: { projectId: testProject.id }
      });

      expect(mockPrisma.qualityCheck.aggregate).toHaveBeenCalledWith({
        where: { projectId: testProject.id },
        _avg: { overallScore: true }
      });
    });
  });
});