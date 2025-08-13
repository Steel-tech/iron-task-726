/**
 * Performance and Load Testing Suite
 * Testing API performance under various load conditions for construction site reliability
 */

const { TestDatabase, AuthHelpers, PerformanceHelpers, APITestHelpers } = require('../utils/testHelpers');
const { setupTestDatabase, cleanupTestDatabase } = require('../utils/testDatabase');
const { Worker } = require('worker_threads');
const path = require('path');

// Mock external services for consistent performance testing
jest.mock('../../src/lib/prisma');
jest.mock('../../src/services/supabaseStorageService');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  project: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  },
  media: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn()
  },
  safetyInspection: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  },
  qualityCheck: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  },
  activity: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  }
};

const mockStorageService = {
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://test-bucket.s3.amazonaws.com/test-file.jpg',
    key: 'uploads/test-file.jpg'
  }),
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
  deleteFile: jest.fn().mockResolvedValue()
};

require('../../src/lib/prisma').default = mockPrisma;
require('../../src/services/supabaseStorageService').default = mockStorageService;

// Mock Fastify app
const fastify = require('fastify')({ logger: false });

describe('Performance and Load Tests', () => {
  let testDb;
  let testData;
  let baselineMetrics;

  beforeAll(async () => {
    // Register all routes for comprehensive testing
    await fastify.register(require('../../src/routes/auth'));
    await fastify.register(require('../../src/routes/projects'));
    await fastify.register(require('../../src/routes/media'));
    await fastify.register(require('../../src/routes/safety'));
    await fastify.register(require('../../src/routes/quality'));
    
    // Register required plugins
    await fastify.register(require('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'test-secret'
    });
    
    await fastify.register(require('@fastify/multipart'));
    
    testDb = await setupTestDatabase();
    
    // Establish performance baselines
    baselineMetrics = await establishBaselines();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    testData = await testDb.seed();
    setupOptimizedMocks();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await fastify.close();
  });

  async function establishBaselines() {
    // Establish baseline performance metrics for comparison
    const singleUserLogin = await measureLoginPerformance();
    const singleProjectQuery = await measureProjectQueryPerformance();
    const singleMediaUpload = await measureMediaUploadPerformance();
    
    return {
      loginTime: singleUserLogin,
      projectQueryTime: singleProjectQuery,
      mediaUploadTime: singleMediaUpload
    };
  }

  function setupOptimizedMocks() {
    // Setup mocks with realistic response times
    mockPrisma.user.findUnique.mockImplementation(async (args) => {
      await simulateDbDelay(10); // 10ms database query
      const users = Object.values(testData.users);
      return users.find(u => u.id === args.where.id || u.email === args.where.email);
    });

    mockPrisma.project.findMany.mockImplementation(async () => {
      await simulateDbDelay(25); // 25ms for complex query
      return Object.values(testData.projects);
    });

    mockPrisma.media.create.mockImplementation(async () => {
      await simulateDbDelay(15); // 15ms for insert
      return { id: `perf-media-${Date.now()}`, type: 'PHOTO' };
    });
  }

  async function simulateDbDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  describe('Authentication Performance', () => {
    it('should handle high concurrent login load', async () => {
      const concurrentUsers = 100;
      const maxResponseTime = 500; // 500ms max
      
      const loginPromises = Array(concurrentUsers).fill().map(async (_, index) => {
        const startTime = process.hrtime();
        
        const response = await fastify.inject({
          method: 'POST',
          url: '/auth/login',
          payload: {
            email: `loadtest${index}@example.com`,
            password: 'password123'
          }
        });
        
        const endTime = process.hrtime(startTime);
        const responseTime = endTime[0] * 1000 + endTime[1] / 1000000;
        
        return {
          statusCode: response.statusCode,
          responseTime,
          userIndex: index
        };
      });

      const results = await Promise.all(loginPromises);
      
      // Analyze results
      const successfulLogins = results.filter(r => r.statusCode === 200);
      const averageResponseTime = successfulLogins.reduce((sum, r) => sum + r.responseTime, 0) / successfulLogins.length;
      const maxResponseTimeActual = Math.max(...successfulLogins.map(r => r.responseTime));
      const p95ResponseTime = calculatePercentile(successfulLogins.map(r => r.responseTime), 95);

      // Performance assertions
      expect(successfulLogins.length).toBe(concurrentUsers);
      expect(averageResponseTime).toBeLessThan(maxResponseTime);
      expect(maxResponseTimeActual).toBeLessThan(maxResponseTime * 2); // Allow 2x for peak load
      expect(p95ResponseTime).toBeLessThan(maxResponseTime * 1.5); // 95th percentile within 1.5x

      console.log(`Login Performance - Avg: ${averageResponseTime.toFixed(2)}ms, Max: ${maxResponseTimeActual.toFixed(2)}ms, P95: ${p95ResponseTime.toFixed(2)}ms`);
    });

    it('should maintain token validation performance under load', async () => {
      const tokens = Array(50).fill().map(() => 
        AuthHelpers.generateToken({
          id: testData.users.worker.id,
          role: testData.users.worker.role
        })
      );

      const validationPromises = tokens.map(async (token) => {
        const { result, timeInMs } = await PerformanceHelpers.measureTime(async () => {
          return await fastify.inject({
            method: 'GET',
            url: `/projects/${testData.projects.activeProject.id}`,
            headers: AuthHelpers.createAuthHeader(token)
          });
        });

        return { result, responseTime: timeInMs };
      });

      const results = await Promise.all(validationPromises);
      const averageTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      expect(averageTime).toBeLessThan(100); // Token validation should be very fast
      expect(results.every(r => r.result.statusCode === 200)).toBe(true);
    });
  });

  describe('Media Upload Performance', () => {
    it('should handle concurrent file uploads efficiently', async () => {
      const concurrentUploads = 20;
      const fileSizes = [
        { size: 1024 * 1024, name: '1MB' },      // 1MB
        { size: 5 * 1024 * 1024, name: '5MB' },  // 5MB
        { size: 10 * 1024 * 1024, name: '10MB' } // 10MB
      ];

      for (const fileSize of fileSizes) {
        const uploadPromises = Array(concurrentUploads).fill().map(async (_, index) => {
          const fileBuffer = Buffer.alloc(fileSize.size, 'x');
          const token = AuthHelpers.generateToken({ id: testData.users.worker.id });

          const { result, timeInMs } = await PerformanceHelpers.measureTime(async () => {
            return await fastify.inject({
              method: 'POST',
              url: '/media/upload',
              headers: {
                ...AuthHelpers.createAuthHeader(token),
                'content-type': 'multipart/form-data; boundary=----test'
              },
              payload: createFileUploadPayload(testData.projects.activeProject.id, `test-${index}.jpg`, fileBuffer)
            });
          });

          return {
            statusCode: result.statusCode,
            responseTime: timeInMs,
            fileSize: fileSize.size,
            index
          };
        });

        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(r => r.statusCode === 201);
        const averageTime = successfulUploads.reduce((sum, r) => sum + r.responseTime, 0) / successfulUploads.length;

        // Performance expectations scale with file size
        const expectedMaxTime = fileSize.size <= 1024 * 1024 ? 2000 : 
                              fileSize.size <= 5 * 1024 * 1024 ? 5000 : 10000;

        expect(successfulUploads.length).toBe(concurrentUploads);
        expect(averageTime).toBeLessThan(expectedMaxTime);

        console.log(`${fileSize.name} Upload Performance - Avg: ${averageTime.toFixed(2)}ms, Success: ${successfulUploads.length}/${concurrentUploads}`);
      }
    });

    it('should handle batch upload performance', async () => {
      const batchSizes = [5, 10, 15];
      
      for (const batchSize of batchSizes) {
        const token = AuthHelpers.generateToken({ id: testData.users.worker.id });
        
        mockPrisma.media.createMany.mockResolvedValue({ count: batchSize });
        mockPrisma.media.findMany.mockResolvedValue(
          Array(batchSize).fill().map((_, i) => ({ id: `batch-${i}`, filename: `file-${i}.jpg` }))
        );

        const { result, timeInMs } = await PerformanceHelpers.measureTime(async () => {
          return await fastify.inject({
            method: 'POST',
            url: '/media/upload/batch',
            headers: {
              ...AuthHelpers.createAuthHeader(token),
              'content-type': 'multipart/form-data; boundary=----batch'
            },
            payload: createBatchUploadPayload(testData.projects.activeProject.id, batchSize)
          });
        });

        APITestHelpers.expectSuccess(result, 201);
        
        // Batch upload should be more efficient than individual uploads
        const expectedMaxTime = batchSize * 300; // 300ms per file max
        expect(timeInMs).toBeLessThan(expectedMaxTime);

        console.log(`Batch ${batchSize} files: ${timeInMs.toFixed(2)}ms (${(timeInMs/batchSize).toFixed(2)}ms per file)`);
      }
    });
  });

  describe('Database Query Performance', () => {
    it('should efficiently handle complex project queries with filters', async () => {
      // Simulate large dataset
      const mockProjects = Array(1000).fill().map((_, i) => ({
        id: `project-${i}`,
        name: `Project ${i}`,
        status: i % 3 === 0 ? 'ACTIVE' : i % 3 === 1 ? 'COMPLETED' : 'PLANNING',
        companyId: testData.company.id,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
      }));

      mockPrisma.project.findMany.mockImplementation(async (args) => {
        await simulateDbDelay(50); // Simulate complex query time
        
        // Apply filters as database would
        let filtered = mockProjects;
        if (args.where?.status) {
          filtered = filtered.filter(p => p.status === args.where.status);
        }
        if (args.where?.OR) {
          const searchTerm = args.where.OR[0]?.name?.contains;
          if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
          }
        }
        
        // Apply pagination
        const skip = args.skip || 0;
        const take = args.take || 20;
        return filtered.slice(skip, skip + take);
      });

      mockPrisma.project.count.mockResolvedValue(1000);

      const token = AuthHelpers.generateToken({ 
        id: testData.users.projectManager.id,
        role: 'PROJECT_MANAGER'
      });

      // Test various query scenarios
      const queryScenarios = [
        { name: 'Basic pagination', params: 'page=1&limit=20' },
        { name: 'Status filter', params: 'status=ACTIVE&page=1&limit=20' },
        { name: 'Search query', params: 'search=Project&page=1&limit=20' },
        { name: 'Complex filter', params: 'status=ACTIVE&search=Project&page=1&limit=50' }
      ];

      for (const scenario of queryScenarios) {
        const { result, timeInMs } = await PerformanceHelpers.measureTime(async () => {
          return await fastify.inject({
            method: 'GET',
            url: `/projects?${scenario.params}`,
            headers: AuthHelpers.createAuthHeader(token)
          });
        });

        APITestHelpers.expectSuccess(result);
        
        // Complex queries should still be fast
        expect(timeInMs).toBeLessThan(200); // 200ms max for database queries
        
        console.log(`${scenario.name}: ${timeInMs.toFixed(2)}ms`);
      }
    });

    it('should handle concurrent database operations without degradation', async () => {
      const concurrentQueries = 50;
      const token = AuthHelpers.generateToken({ 
        id: testData.users.projectManager.id,
        role: 'PROJECT_MANAGER' 
      });

      // Mix of different query types
      const queryTypes = [
        () => fastify.inject({
          method: 'GET',
          url: `/projects/${testData.projects.activeProject.id}`,
          headers: AuthHelpers.createAuthHeader(token)
        }),
        () => fastify.inject({
          method: 'GET',
          url: '/projects?status=ACTIVE',
          headers: AuthHelpers.createAuthHeader(token)
        }),
        () => fastify.inject({
          method: 'GET',
          url: `/media?projectId=${testData.projects.activeProject.id}`,
          headers: AuthHelpers.createAuthHeader(token)
        }),
        () => fastify.inject({
          method: 'GET',
          url: `/safety/inspections?projectId=${testData.projects.activeProject.id}`,
          headers: AuthHelpers.createAuthHeader(token)
        })
      ];

      const queries = Array(concurrentQueries).fill().map((_, index) => {
        const queryFn = queryTypes[index % queryTypes.length];
        return async () => {
          const { result, timeInMs } = await PerformanceHelpers.measureTime(queryFn);
          return { result, responseTime: timeInMs, queryType: index % queryTypes.length };
        };
      });

      const results = await PerformanceHelpers.runConcurrently(queries, 10);
      
      // Analyze performance by query type
      const performanceByType = {};
      results.forEach(({ result, responseTime, queryType }) => {
        if (!performanceByType[queryType]) {
          performanceByType[queryType] = { times: [], successes: 0 };
        }
        performanceByType[queryType].times.push(responseTime);
        if (result.statusCode === 200) {
          performanceByType[queryType].successes++;
        }
      });

      Object.entries(performanceByType).forEach(([type, data]) => {
        const avgTime = data.times.reduce((sum, t) => sum + t, 0) / data.times.length;
        const successRate = (data.successes / data.times.length) * 100;
        
        expect(avgTime).toBeLessThan(300); // 300ms max average
        expect(successRate).toBe(100); // 100% success rate
        
        console.log(`Query Type ${type}: ${avgTime.toFixed(2)}ms avg, ${successRate}% success`);
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain stable memory usage under sustained load', async () => {
      const initialMemory = process.memoryUsage();
      const token = AuthHelpers.generateToken({ id: testData.users.worker.id });

      // Sustained load for memory leak detection
      const iterations = 100;
      const memorySnapshots = [];

      for (let i = 0; i < iterations; i++) {
        await fastify.inject({
          method: 'GET',
          url: `/projects/${testData.projects.activeProject.id}`,
          headers: AuthHelpers.createAuthHeader(token)
        });

        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          memorySnapshots.push(process.memoryUsage());
        }

        // Force garbage collection periodically
        if (i % 25 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      
      // Memory growth should be minimal
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const heapGrowthMB = heapGrowth / (1024 * 1024);
      
      expect(heapGrowthMB).toBeLessThan(50); // Less than 50MB growth
      
      // Check for consistent memory pattern (no major leaks)
      const memoryTrend = memorySnapshots.map(snapshot => snapshot.heapUsed);
      const avgGrowthPerSnapshot = (memoryTrend[memoryTrend.length - 1] - memoryTrend[0]) / memoryTrend.length;
      
      expect(avgGrowthPerSnapshot).toBeLessThan(1024 * 1024); // Less than 1MB growth per 10 requests
      
      console.log(`Memory Growth: ${heapGrowthMB.toFixed(2)}MB over ${iterations} requests`);
    });
  });

  describe('Stress Testing', () => {
    it('should handle extreme load scenarios gracefully', async () => {
      const extremeLoad = 200; // 200 concurrent requests
      const token = AuthHelpers.generateToken({ id: testData.users.worker.id });

      const stressPromises = Array(extremeLoad).fill().map(async (_, index) => {
        try {
          const response = await fastify.inject({
            method: 'GET',
            url: `/projects?page=${Math.floor(index / 20) + 1}&limit=20`,
            headers: AuthHelpers.createAuthHeader(token)
          });

          return {
            success: response.statusCode < 400,
            statusCode: response.statusCode,
            index
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            index
          };
        }
      });

      const results = await Promise.all(stressPromises);
      
      const successCount = results.filter(r => r.success).length;
      const successRate = (successCount / extremeLoad) * 100;
      
      // Under extreme load, we should maintain reasonable success rate
      expect(successRate).toBeGreaterThan(95); // 95% success rate minimum
      
      // Check for graceful degradation
      const errorCodes = results
        .filter(r => !r.success)
        .map(r => r.statusCode)
        .filter(code => code);
      
      // Errors should be service unavailable (503) or rate limited (429), not server errors (500)
      const serverErrors = errorCodes.filter(code => code >= 500 && code < 600);
      expect(serverErrors.length).toBeLessThan(extremeLoad * 0.01); // Less than 1% server errors
      
      console.log(`Stress Test: ${successRate.toFixed(1)}% success rate, ${serverErrors.length} server errors`);
    });
  });
});

// Helper functions
async function measureLoginPerformance() {
  const { timeInMs } = await PerformanceHelpers.measureTime(async () => {
    // Simulate login performance measurement
    await new Promise(resolve => setTimeout(resolve, 50));
    return { statusCode: 200 };
  });
  return timeInMs;
}

async function measureProjectQueryPerformance() {
  const { timeInMs } = await PerformanceHelpers.measureTime(async () => {
    await new Promise(resolve => setTimeout(resolve, 30));
    return { statusCode: 200 };
  });
  return timeInMs;
}

async function measureMediaUploadPerformance() {
  const { timeInMs } = await PerformanceHelpers.measureTime(async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { statusCode: 201 };
  });
  return timeInMs;
}

function calculatePercentile(values, percentile) {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
  return sorted[index];
}

function createFileUploadPayload(projectId, filename, buffer) {
  return `------test\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${projectId}\r\n------test\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n${buffer.toString('binary')}\r\n------test--`;
}

function createBatchUploadPayload(projectId, fileCount) {
  let payload = `------batch\r\nContent-Disposition: form-data; name="projectId"\r\n\r\n${projectId}\r\n`;
  
  for (let i = 0; i < fileCount; i++) {
    payload += `------batch\r\nContent-Disposition: form-data; name="files"; filename="batch-${i}.jpg"\r\nContent-Type: image/jpeg\r\n\r\ntest-data-${i}\r\n`;
  }
  
  payload += '------batch--';
  return payload;
}