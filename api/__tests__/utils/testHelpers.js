/**
 * Test Helpers for FSW Iron Task API Testing
 * Provides utilities for database setup, mocking, and common test patterns
 */

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Test database utilities
class TestDatabase {
  constructor() {
    this.cleanupFunctions = [];
  }

  /**
   * Create isolated test database connection
   */
  async setup() {
    // Use test database URL
    const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    
    // Initialize test client
    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    return this.client;
  }

  /**
   * Clean up all test data
   */
  async cleanup() {
    for (const cleanupFn of this.cleanupFunctions.reverse()) {
      await cleanupFn();
    }
    this.cleanupFunctions = [];
  }

  /**
   * Register cleanup function
   */
  onCleanup(fn) {
    this.cleanupFunctions.push(fn);
  }
}

// Mock data factories
class TestDataFactory {
  /**
   * Generate test user data
   */
  static createUser(overrides = {}) {
    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `test-${Date.now()}@example.com`,
      password: 'hashedPassword123',
      name: 'Test User',
      role: 'WORKER',
      companyId: 'test-company-id',
      unionMember: false,
      phoneNumber: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test company data
   */
  static createCompany(overrides = {}) {
    return {
      id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Company ${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test project data
   */
  static createProject(overrides = {}) {
    return {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Project ${Date.now()}`,
      description: 'Test construction project',
      status: 'ACTIVE',
      companyId: 'test-company-id',
      location: 'Test Location',
      startDate: new Date(),
      expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test media data
   */
  static createMedia(overrides = {}) {
    return {
      id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'PHOTO',
      url: 'https://test-bucket.s3.amazonaws.com/test-photo.jpg',
      thumbnailUrl: 'https://test-bucket.s3.amazonaws.com/test-photo-thumb.jpg',
      filename: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024576, // 1MB
      projectId: 'test-project-id',
      userId: 'test-user-id',
      description: 'Test construction photo',
      capturedAt: new Date(),
      location: { lat: 39.7392, lng: -104.9903 },
      metadata: { camera: 'iPhone 12', iso: 100 },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test activity data
   */
  static createActivity(overrides = {}) {
    return {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ERECTION',
      description: 'Steel beam installation',
      projectId: 'test-project-id',
      userId: 'test-user-id',
      location: 'Building A, Level 3',
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      actualStart: new Date(),
      actualEnd: null,
      status: 'IN_PROGRESS',
      metadata: { crew_size: 4, equipment: ['crane', 'welder'] },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test safety inspection data
   */
  static createSafetyInspection(overrides = {}) {
    return {
      id: `inspection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: 'test-project-id',
      inspectorId: 'test-inspector-id',
      type: 'GENERAL_SAFETY',
      status: 'PASSED',
      score: 95,
      findings: [
        { category: 'PPE', status: 'PASS', notes: 'All workers wearing proper PPE' },
        { category: 'FALL_PROTECTION', status: 'PASS', notes: 'Harnesses properly secured' }
      ],
      recommendations: ['Continue current safety practices'],
      inspectionDate: new Date(),
      nextInspectionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }
}

// Authentication helpers
class AuthHelpers {
  /**
   * Generate valid JWT token for testing
   */
  static generateToken(payload = {}) {
    const defaultPayload = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'WORKER',
      companyId: 'test-company-id',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    };

    return jwt.sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET || 'test-secret'
    );
  }

  /**
   * Generate expired JWT token for testing
   */
  static generateExpiredToken(payload = {}) {
    const defaultPayload = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'WORKER',
      companyId: 'test-company-id',
      iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes ago (expired)
    };

    return jwt.sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET || 'test-secret'
    );
  }

  /**
   * Hash password for testing
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Create authorization header
   */
  static createAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
  }
}

// File upload helpers
class FileUploadHelpers {
  /**
   * Create mock file buffer
   */
  static createMockImageBuffer(size = 1024) {
    return Buffer.alloc(size, 'test-image-data');
  }

  /**
   * Create mock file stream
   */
  static createMockFileStream(filename = 'test.jpg', size = 1024) {
    const { Readable } = require('stream');
    const stream = new Readable({
      read() {
        if (size > 0) {
          this.push(Buffer.alloc(Math.min(size, 64), 'x'));
          size -= 64;
        } else {
          this.push(null);
        }
      }
    });
    
    stream.filename = filename;
    stream.mimetype = 'image/jpeg';
    return stream;
  }

  /**
   * Create multipart form data for file upload
   */
  static createFileUploadFormData(files = []) {
    const FormData = require('form-data');
    const form = new FormData();
    
    files.forEach((file, index) => {
      const buffer = this.createMockImageBuffer(file.size || 1024);
      form.append('files', buffer, {
        filename: file.filename || `test-${index}.jpg`,
        contentType: file.mimetype || 'image/jpeg'
      });
    });
    
    return form;
  }
}

// Mock service helpers
class MockServiceHelpers {
  /**
   * Create Prisma mock with common methods
   */
  static createPrismaMock() {
    return {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      company: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      project: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      media: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      activity: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn()
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn()
      },
      safetyInspection: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      qualityCheck: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      $transaction: jest.fn()
    };
  }

  /**
   * Create S3 service mock
   */
  static createS3Mock() {
    return {
      upload: jest.fn(() => ({
        promise: () => Promise.resolve({
          Location: 'https://test-bucket.s3.amazonaws.com/test-file.jpg',
          Key: 'test-file.jpg',
          Bucket: 'test-bucket'
        })
      })),
      getSignedUrl: jest.fn(() => 'https://signed-url.example.com'),
      deleteObject: jest.fn(() => ({
        promise: () => Promise.resolve()
      }))
    };
  }

  /**
   * Create email service mock
   */
  static createEmailMock() {
    return {
      send: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
      sendBulk: jest.fn(() => Promise.resolve({ sent: 5, failed: 0 }))
    };
  }
}

// API testing helpers
class APITestHelpers {
  /**
   * Create test request with authentication
   */
  static authenticatedRequest(app, token = null) {
    const request = app.inject.bind(app);
    const authToken = token || AuthHelpers.generateToken();
    
    return {
      get: (url) => request({
        method: 'GET',
        url,
        headers: AuthHelpers.createAuthHeader(authToken)
      }),
      post: (url, payload) => request({
        method: 'POST',
        url,
        headers: AuthHelpers.createAuthHeader(authToken),
        payload
      }),
      put: (url, payload) => request({
        method: 'PUT',
        url,
        headers: AuthHelpers.createAuthHeader(authToken),
        payload
      }),
      delete: (url) => request({
        method: 'DELETE',
        url,
        headers: AuthHelpers.createAuthHeader(authToken)
      })
    };
  }

  /**
   * Assert successful API response
   */
  static expectSuccess(response, expectedStatus = 200) {
    expect(response.statusCode).toBe(expectedStatus);
    expect(response.json().error).toBeUndefined();
    return response.json();
  }

  /**
   * Assert error API response
   */
  static expectError(response, expectedStatus = 400) {
    expect(response.statusCode).toBe(expectedStatus);
    expect(response.json().error).toBeDefined();
    return response.json();
  }

  /**
   * Wait for async operation
   */
  static async waitFor(condition, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

// Performance testing helpers
class PerformanceHelpers {
  /**
   * Measure execution time
   */
  static async measureTime(operation) {
    const start = process.hrtime();
    const result = await operation();
    const end = process.hrtime(start);
    const timeInMs = end[0] * 1000 + end[1] / 1000000;
    
    return { result, timeInMs };
  }

  /**
   * Run concurrent operations
   */
  static async runConcurrently(operations, concurrency = 10) {
    const results = [];
    
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (operation) => {
          try {
            return await operation();
          } catch (error) {
            return { error: error.message };
          }
        })
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Generate load test data
   */
  static generateLoadTestData(count = 100) {
    return Array.from({ length: count }, (_, index) => ({
      id: `load-test-${index}`,
      timestamp: new Date(Date.now() + index * 1000),
      data: `test-data-${index}`
    }));
  }
}

module.exports = {
  TestDatabase,
  TestDataFactory,
  AuthHelpers,
  FileUploadHelpers,
  MockServiceHelpers,
  APITestHelpers,
  PerformanceHelpers
};