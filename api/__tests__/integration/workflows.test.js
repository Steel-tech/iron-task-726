/**
 * Integration Workflow Tests
 * End-to-end testing for complex user journeys and business workflows
 */

const { TestDatabase, AuthHelpers, FileUploadHelpers, MockServiceHelpers, APITestHelpers, PerformanceHelpers } = require('../utils/testHelpers');
const { setupTestDatabase, cleanupTestDatabase } = require('../utils/testDatabase');
const WebSocket = require('ws');
const { Server } = require('socket.io');
const { createServer } = require('http');

// Mock external services
jest.mock('../../src/lib/prisma');
jest.mock('../../src/services/supabaseStorageService');
jest.mock('../../src/services/emailService');
jest.mock('../../src/services/pushNotificationService');

// Mock modules
const mockPrisma = MockServiceHelpers.createPrismaMock();
const mockStorageService = MockServiceHelpers.createS3Mock();
const mockEmailService = MockServiceHelpers.createEmailMock();
const mockPushService = {
  sendNotification: jest.fn(),
  sendBulkNotification: jest.fn()
};

require('../../src/lib/prisma').default = mockPrisma;
require('../../src/services/supabaseStorageService').default = mockStorageService;
require('../../src/services/emailService').default = mockEmailService;
require('../../src/services/pushNotificationService').default = mockPushService;

// Mock Fastify app with all routes
const fastify = require('fastify')({ logger: false });

describe('Integration Workflow Tests', () => {
  let testDb;
  let testData;
  let httpServer;
  let ioServer;

  beforeAll(async () => {
    // Register all routes
    await fastify.register(require('../../src/routes/auth'));
    await fastify.register(require('../../src/routes/projects'));
    await fastify.register(require('../../src/routes/media'));
    await fastify.register(require('../../src/routes/safety'));
    await fastify.register(require('../../src/routes/quality'));
    await fastify.register(require('../../src/routes/reports'));
    
    // Register required plugins
    await fastify.register(require('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'test-secret'
    });
    
    await fastify.register(require('@fastify/multipart'));
    
    // Setup WebSocket server for real-time testing
    httpServer = createServer();
    ioServer = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    await new Promise((resolve) => {
      httpServer.listen(0, resolve);
    });
    
    testDb = await setupTestDatabase();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Seed comprehensive test data
    testData = await testDb.seed();
    
    // Setup extensive mock responses
    setupMockResponses();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await fastify.close();
    httpServer.close();
  });

  function setupMockResponses() {
    // User authentication mocks
    mockPrisma.user.findUnique.mockImplementation((args) => {
      const users = Object.values(testData.users);
      return Promise.resolve(users.find(u => 
        u.id === args.where.id || u.email === args.where.email
      ));
    });

    // Project access mocks
    mockPrisma.project.findUnique.mockImplementation((args) => {
      const projects = Object.values(testData.projects);
      return Promise.resolve(projects.find(p => p.id === args.where.id));
    });

    // Media upload mocks
    mockStorageService.upload.mockResolvedValue({
      Location: 'https://test-bucket.s3.amazonaws.com/test-file.jpg',
      Key: 'uploads/test-file.jpg',
      Bucket: 'test-bucket'
    });

    mockStorageService.getSignedUrl.mockResolvedValue(
      'https://signed-url.example.com/test-file.jpg?expires=3600'
    );
  }

  describe('Complete User Journey: Worker Documentation Workflow', () => {
    it('should complete full workflow: Login → Project Access → Media Upload → Safety Check', async () => {
      const workflow = new WorkflowTracker();
      
      // Step 1: Worker login
      workflow.startStep('authentication');
      
      const loginResponse = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testData.users.worker.email,
          password: 'password123'
        }
      });

      const authResult = APITestHelpers.expectSuccess(loginResponse);
      expect(authResult).toHaveProperty('accessToken');
      expect(authResult).toHaveProperty('user');
      
      const workerToken = authResult.accessToken;
      workflow.completeStep('authentication');

      // Step 2: Access project details
      workflow.startStep('project_access');
      
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testData.projects.activeProject,
        members: [{
          userId: testData.users.worker.id,
          role: 'WORKER'
        }]
      });

      const projectResponse = await fastify.inject({
        method: 'GET',
        url: `/projects/${testData.projects.activeProject.id}`,
        headers: AuthHelpers.createAuthHeader(workerToken)
      });

      const projectResult = APITestHelpers.expectSuccess(projectResponse);
      expect(projectResult).toHaveProperty('id', testData.projects.activeProject.id);
      expect(projectResult).toHaveProperty('name');
      
      workflow.completeStep('project_access');

      // Step 3: Upload construction photos
      workflow.startStep('media_upload');
      
      const uploadedMedia = {
        id: 'workflow-media-123',
        type: 'PHOTO',
        url: 'https://test-bucket.s3.amazonaws.com/construction-photo.jpg',
        thumbnailUrl: 'https://test-bucket.s3.amazonaws.com/construction-photo-thumb.jpg',
        filename: 'construction-photo.jpg',
        projectId: testData.projects.activeProject.id,
        userId: testData.users.worker.id
      };

      mockPrisma.media.create.mockResolvedValue(uploadedMedia);

      const uploadResponse = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(workerToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: createMultipartPayload([{
          name: 'projectId',
          value: testData.projects.activeProject.id
        }, {
          name: 'file',
          filename: 'construction-photo.jpg',
          contentType: 'image/jpeg',
          data: Buffer.from('test-image-data')
        }])
      });

      const uploadResult = APITestHelpers.expectSuccess(uploadResponse, 201);
      expect(uploadResult).toHaveProperty('media');
      expect(uploadResult.media).toHaveProperty('id', 'workflow-media-123');
      
      workflow.completeStep('media_upload');

      // Step 4: Report safety observation
      workflow.startStep('safety_reporting');
      
      const safetyIncident = {
        id: 'workflow-incident-456',
        projectId: testData.projects.activeProject.id,
        reportedById: testData.users.worker.id,
        type: 'NEAR_MISS',
        severity: 'LOW',
        status: 'REPORTED'
      };

      mockPrisma.safetyIncident.create.mockResolvedValue(safetyIncident);

      const safetyResponse = await fastify.inject({
        method: 'POST',
        url: '/safety/incidents',
        headers: AuthHelpers.createAuthHeader(workerToken),
        payload: {
          projectId: testData.projects.activeProject.id,
          type: 'NEAR_MISS',
          severity: 'LOW',
          description: 'Worker noticed loose scaffolding bolt',
          location: 'Building A, Level 3'
        }
      });

      const safetyResult = APITestHelpers.expectSuccess(safetyResponse, 201);
      expect(safetyResult).toHaveProperty('id', 'workflow-incident-456');
      expect(safetyResult).toHaveProperty('type', 'NEAR_MISS');
      
      workflow.completeStep('safety_reporting');

      // Verify complete workflow timing
      const totalTime = workflow.getTotalTime();
      expect(totalTime).toBeLessThan(5000); // Should complete in under 5 seconds
      
      const stepTimes = workflow.getStepTimes();
      expect(stepTimes.authentication).toBeLessThan(500);
      expect(stepTimes.project_access).toBeLessThan(300);
      expect(stepTimes.media_upload).toBeLessThan(1000);
      expect(stepTimes.safety_reporting).toBeLessThan(400);

      // Verify all expected side effects occurred
      expect(mockPrisma.media.create).toHaveBeenCalled();
      expect(mockPrisma.safetyIncident.create).toHaveBeenCalled();
      expect(mockStorageService.upload).toHaveBeenCalled();
    });
  });

  describe('Project Manager Workflow: Create Project → Add Team → Quality Inspection', () => {
    it('should complete PM workflow with team management and quality control', async () => {
      const pmToken = AuthHelpers.generateToken({
        id: testData.users.projectManager.id,
        email: testData.users.projectManager.email,
        role: testData.users.projectManager.role,
        companyId: testData.users.projectManager.companyId
      });

      // Step 1: Create new project
      const newProject = {
        id: 'pm-workflow-project',
        name: 'PM Workflow Project',
        description: 'Integration test project',
        status: 'PLANNING',
        companyId: testData.company.id
      };

      mockPrisma.project.create.mockResolvedValue(newProject);

      const createProjectResponse = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          name: 'PM Workflow Project',
          description: 'Integration test project',
          location: 'Downtown Construction Site'
        }
      });

      const projectResult = APITestHelpers.expectSuccess(createProjectResponse, 201);
      expect(projectResult).toHaveProperty('id', 'pm-workflow-project');

      // Step 2: Add team members
      const newMember = {
        id: 'workflow-member-123',
        projectId: newProject.id,
        userId: testData.users.worker.id,
        role: 'WORKER',
        assignedAt: new Date()
      };

      mockPrisma.projectMember.create.mockResolvedValue(newMember);

      const addMemberResponse = await fastify.inject({
        method: 'POST',
        url: `/projects/${newProject.id}/members`,
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          userId: testData.users.worker.id,
          role: 'WORKER'
        }
      });

      const memberResult = APITestHelpers.expectSuccess(addMemberResponse, 201);
      expect(memberResult).toHaveProperty('userId', testData.users.worker.id);

      // Verify invitation email sent
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: testData.users.worker.email,
        subject: expect.stringContaining('PM Workflow Project'),
        template: 'project-invitation',
        data: expect.objectContaining({
          projectName: 'PM Workflow Project',
          userName: testData.users.worker.name
        })
      });

      // Step 3: Conduct quality inspection
      const qualityCheck = {
        id: 'workflow-quality-789',
        projectId: newProject.id,
        inspectorId: testData.users.projectManager.id,
        type: 'STRUCTURAL_INTEGRITY',
        status: 'PASSED',
        overallScore: 95
      };

      mockPrisma.qualityCheck.create.mockResolvedValue(qualityCheck);

      const qualityResponse = await fastify.inject({
        method: 'POST',
        url: '/quality/checks',
        headers: AuthHelpers.createAuthHeader(pmToken),
        payload: {
          projectId: newProject.id,
          type: 'STRUCTURAL_INTEGRITY',
          criteria: [
            {
              name: 'Column Alignment',
              requirement: '1/4 inch tolerance',
              measurement: '1/8 inch deviation',
              status: 'PASS',
              notes: 'Excellent alignment achieved'
            }
          ]
        }
      });

      const qualityResult = APITestHelpers.expectSuccess(qualityResponse, 201);
      expect(qualityResult).toHaveProperty('id', 'workflow-quality-789');
      expect(qualityResult).toHaveProperty('status', 'PASSED');
    });
  });

  describe('Real-time Communication Workflow', () => {
    it('should handle WebSocket connections and real-time updates', async () => {
      const wsPort = httpServer.address().port;
      const client1 = new WebSocket(`ws://localhost:${wsPort}`);
      const client2 = new WebSocket(`ws://localhost:${wsPort}`);

      // Wait for connections
      await Promise.all([
        new Promise(resolve => client1.on('open', resolve)),
        new Promise(resolve => client2.on('open', resolve))
      ]);

      // Mock authentication for WebSocket
      const workerToken = AuthHelpers.generateToken({
        id: testData.users.worker.id,
        role: testData.users.worker.role
      });

      const pmToken = AuthHelpers.generateToken({
        id: testData.users.projectManager.id,
        role: testData.users.projectManager.role
      });

      // Authenticate WebSocket connections
      client1.send(JSON.stringify({
        type: 'authenticate',
        token: workerToken
      }));

      client2.send(JSON.stringify({
        type: 'authenticate',
        token: pmToken
      }));

      // Join project room
      client1.send(JSON.stringify({
        type: 'join_project',
        projectId: testData.projects.activeProject.id
      }));

      client2.send(JSON.stringify({
        type: 'join_project',
        projectId: testData.projects.activeProject.id
      }));

      // Track received messages
      const client1Messages = [];
      const client2Messages = [];

      client1.on('message', (data) => {
        client1Messages.push(JSON.parse(data.toString()));
      });

      client2.on('message', (data) => {
        client2Messages.push(JSON.parse(data.toString()));
      });

      // Simulate real-time media upload notification
      const mediaUploadEvent = {
        type: 'media_uploaded',
        projectId: testData.projects.activeProject.id,
        mediaId: 'realtime-media-123',
        userId: testData.users.worker.id,
        mediaType: 'PHOTO'
      };

      // Broadcast to project room
      ioServer.to(`project:${testData.projects.activeProject.id}`).emit('project_update', mediaUploadEvent);

      // Wait for message propagation
      await APITestHelpers.waitFor(() => client2Messages.length > 0, 2000);

      // Verify PM received worker's upload notification
      expect(client2Messages).toContainEqual(
        expect.objectContaining({
          type: 'project_update',
          data: expect.objectContaining({
            type: 'media_uploaded',
            mediaType: 'PHOTO'
          })
        })
      );

      client1.close();
      client2.close();
    });
  });

  describe('Batch Processing Workflow', () => {
    it('should handle batch media upload with progress tracking', async () => {
      const workerToken = AuthHelpers.generateToken({
        id: testData.users.worker.id,
        role: testData.users.worker.role,
        companyId: testData.company.id
      });

      // Mock multiple file uploads
      const batchFiles = Array(5).fill().map((_, index) => ({
        id: `batch-media-${index}`,
        filename: `construction-${index}.jpg`,
        type: 'PHOTO',
        projectId: testData.projects.activeProject.id,
        userId: testData.users.worker.id
      }));

      mockPrisma.media.createMany.mockResolvedValue({ count: 5 });
      mockPrisma.media.findMany.mockResolvedValue(batchFiles);

      // Create multipart payload with multiple files
      const batchUploadResponse = await fastify.inject({
        method: 'POST',
        url: '/media/upload/batch',
        headers: {
          ...AuthHelpers.createAuthHeader(workerToken),
          'content-type': 'multipart/form-data; boundary=----batch'
        },
        payload: createBatchMultipartPayload(testData.projects.activeProject.id, batchFiles)
      });

      const batchResult = APITestHelpers.expectSuccess(batchUploadResponse, 201);
      expect(batchResult).toHaveProperty('uploaded', 5);
      expect(batchResult).toHaveProperty('failed', 0);
      expect(batchResult.media).toHaveLength(5);

      // Verify all files were processed
      expect(mockStorageService.upload).toHaveBeenCalledTimes(5);
      expect(mockPrisma.media.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('construction-'),
            projectId: testData.projects.activeProject.id
          })
        ])
      });
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent user operations efficiently', async () => {
      const concurrentOperations = [
        // Multiple users accessing projects
        ...Array(10).fill().map(() => 
          fastify.inject({
            method: 'GET',
            url: `/projects/${testData.projects.activeProject.id}`,
            headers: AuthHelpers.createAuthHeader(
              AuthHelpers.generateToken({ id: testData.users.worker.id })
            )
          })
        ),
        
        // Multiple media uploads
        ...Array(5).fill().map(() => {
          mockPrisma.media.create.mockResolvedValueOnce({
            id: `concurrent-media-${Math.random()}`,
            type: 'PHOTO'
          });
          
          return fastify.inject({
            method: 'POST',
            url: '/media/upload',
            headers: {
              ...AuthHelpers.createAuthHeader(
                AuthHelpers.generateToken({ id: testData.users.worker.id })
              ),
              'content-type': 'multipart/form-data; boundary=----test'
            },
            payload: createMultipartPayload([{
              name: 'projectId',
              value: testData.projects.activeProject.id
            }, {
              name: 'file',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              data: Buffer.from('test')
            }])
          });
        }),

        // Multiple safety reports
        ...Array(3).fill().map(() => {
          mockPrisma.safetyIncident.create.mockResolvedValueOnce({
            id: `concurrent-incident-${Math.random()}`,
            type: 'NEAR_MISS'
          });
          
          return fastify.inject({
            method: 'POST',
            url: '/safety/incidents',
            headers: AuthHelpers.createAuthHeader(
              AuthHelpers.generateToken({ id: testData.users.worker.id })
            ),
            payload: {
              projectId: testData.projects.activeProject.id,
              type: 'NEAR_MISS',
              severity: 'LOW',
              description: 'Concurrent test incident'
            }
          });
        })
      ];

      const startTime = Date.now();
      const results = await PerformanceHelpers.runConcurrently(
        concurrentOperations.map(op => () => op),
        10 // concurrency limit
      );
      const endTime = Date.now();

      // Verify all operations completed successfully
      results.forEach(result => {
        expect(result).not.toHaveProperty('error');
        expect(result.statusCode).toBeLessThan(400);
      });

      // Verify performance meets requirements
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify database efficiency
      const dbCallCount = Object.values(mockPrisma)
        .flat()
        .reduce((count, method) => count + (method.mock?.calls?.length || 0), 0);
      
      expect(dbCallCount).toBeLessThan(100); // Efficient database usage
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should gracefully handle service failures and recover', async () => {
      const workerToken = AuthHelpers.generateToken({
        id: testData.users.worker.id,
        role: testData.users.worker.role
      });

      // Simulate storage service failure
      mockStorageService.upload.mockRejectedValueOnce(new Error('Storage unavailable'));

      const failedUploadResponse = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(workerToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: createMultipartPayload([{
          name: 'projectId',
          value: testData.projects.activeProject.id
        }, {
          name: 'file',
          filename: 'test.jpg',
          contentType: 'image/jpeg',
          data: Buffer.from('test')
        }])
      });

      // Should handle failure gracefully
      APITestHelpers.expectError(failedUploadResponse, 500);

      // Storage service recovers
      mockStorageService.upload.mockResolvedValueOnce({
        Location: 'https://test-bucket.s3.amazonaws.com/recovered.jpg'
      });

      mockPrisma.media.create.mockResolvedValue({
        id: 'recovered-media',
        type: 'PHOTO'
      });

      // Retry should succeed
      const recoveredUploadResponse = await fastify.inject({
        method: 'POST',
        url: '/media/upload',
        headers: {
          ...AuthHelpers.createAuthHeader(workerToken),
          'content-type': 'multipart/form-data; boundary=----test'
        },
        payload: createMultipartPayload([{
          name: 'projectId',
          value: testData.projects.activeProject.id
        }, {
          name: 'file',
          filename: 'recovered.jpg',
          contentType: 'image/jpeg',
          data: Buffer.from('recovered')
        }])
      });

      APITestHelpers.expectSuccess(recoveredUploadResponse, 201);
    });
  });
});

// Helper classes and functions
class WorkflowTracker {
  constructor() {
    this.steps = {};
    this.startTime = Date.now();
  }

  startStep(stepName) {
    this.steps[stepName] = { start: Date.now() };
  }

  completeStep(stepName) {
    if (this.steps[stepName]) {
      this.steps[stepName].end = Date.now();
      this.steps[stepName].duration = this.steps[stepName].end - this.steps[stepName].start;
    }
  }

  getTotalTime() {
    return Date.now() - this.startTime;
  }

  getStepTimes() {
    const stepTimes = {};
    Object.entries(this.steps).forEach(([name, step]) => {
      stepTimes[name] = step.duration || 0;
    });
    return stepTimes;
  }
}

function createMultipartPayload(fields) {
  let payload = '';
  
  fields.forEach(field => {
    payload += '------test\r\n';
    
    if (field.filename) {
      payload += `Content-Disposition: form-data; name="${field.name}"; filename="${field.filename}"\r\n`;
      payload += `Content-Type: ${field.contentType || 'application/octet-stream'}\r\n\r\n`;
      payload += field.data.toString();
    } else {
      payload += `Content-Disposition: form-data; name="${field.name}"\r\n\r\n`;
      payload += field.value;
    }
    
    payload += '\r\n';
  });
  
  payload += '------test--';
  return payload;
}

function createBatchMultipartPayload(projectId, files) {
  let payload = '------batch\r\n';
  payload += `Content-Disposition: form-data; name="projectId"\r\n\r\n${projectId}\r\n`;
  
  files.forEach(file => {
    payload += '------batch\r\n';
    payload += `Content-Disposition: form-data; name="files"; filename="${file.filename}"\r\n`;
    payload += 'Content-Type: image/jpeg\r\n\r\n';
    payload += `test-data-${file.filename}\r\n`;
  });
  
  payload += '------batch--';
  return payload;
}