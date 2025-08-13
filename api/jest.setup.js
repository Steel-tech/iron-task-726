// Enhanced Jest Setup for FSW Iron Task API Testing
// Load test environment variables early
require('dotenv').config({ path: '.env.test' });

const { performance } = require('perf_hooks');
const { setupTestDatabase, cleanupTestDatabase } = require('./__tests__/utils/testDatabase');

// Set test environment defaults if not provided
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'test-cookie-secret-for-testing-only';

// Database configuration for testing
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Disable external services in test mode
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

// Configure console behavior based on test type
const shouldSuppressLogs = !process.env.JEST_VERBOSE && process.argv.includes('--silent');

if (shouldSuppressLogs) {
  // Suppress console logs during tests unless explicitly enabled
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
} else {
  // Keep console.error for debugging test failures
  const originalConsoleError = console.error;
  global.console = {
    ...console,
    log: jest.fn(),
    error: originalConsoleError, // Keep errors visible
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// Global test configuration
global.testConfig = {
  timeouts: {
    unit: 5000,           // 5 seconds for unit tests
    integration: 15000,   // 15 seconds for integration tests
    performance: 30000,   // 30 seconds for performance tests
    load: 60000          // 1 minute for load tests
  },
  performance: {
    maxResponseTime: 500,     // 500ms max for API responses
    maxDbQueryTime: 100,      // 100ms max for database queries
    maxMemoryGrowth: 50,      // 50MB max memory growth
    concurrentUsers: 100      // Max concurrent users for load testing
  },
  retries: {
    flaky: 2,            // Retry flaky tests twice
    performance: 1       // Retry performance tests once
  }
};

// Performance monitoring for tests
global.testPerformanceTracker = {
  testStartTimes: new Map(),
  slowTests: [],
  memorySnapshots: [],
  
  startTest(testName) {
    this.testStartTimes.set(testName, performance.now());
    this.memorySnapshots.push({
      test: testName,
      memory: process.memoryUsage(),
      timestamp: Date.now()
    });
  },
  
  endTest(testName) {
    const startTime = this.testStartTimes.get(testName);
    if (startTime) {
      const duration = performance.now() - startTime;
      if (duration > 2000) { // Tests taking more than 2 seconds
        this.slowTests.push({ test: testName, duration });
      }
      this.testStartTimes.delete(testName);
    }
  },
  
  getSlowTests() {
    return this.slowTests.sort((a, b) => b.duration - a.duration);
  },
  
  getMemoryTrend() {
    if (this.memorySnapshots.length < 2) return null;
    
    const first = this.memorySnapshots[0];
    const last = this.memorySnapshots[this.memorySnapshots.length - 1];
    
    return {
      heapGrowth: last.memory.heapUsed - first.memory.heapUsed,
      rssGrowth: last.memory.rss - first.memory.rss,
      totalTests: this.memorySnapshots.length
    };
  }
};

// Enhanced matchers for construction-specific testing
expect.extend({
  toBeWithinTolerance(received, expected, tolerance = 0.1) {
    const pass = Math.abs(received - expected) <= tolerance;
    return {
      pass,
      message: () => `expected ${received} to be within ${tolerance} of ${expected}`
    };
  },
  
  toBeValidConstructionData(received) {
    const requiredFields = ['id', 'createdAt', 'updatedAt'];
    const hasRequiredFields = requiredFields.every(field => received.hasOwnProperty(field));
    
    return {
      pass: hasRequiredFields,
      message: () => `expected object to have required fields: ${requiredFields.join(', ')}`
    };
  },
  
  toBeValidMediaUpload(received) {
    const requiredFields = ['id', 'type', 'url', 'filename', 'mimeType', 'fileSize'];
    const validTypes = ['PHOTO', 'VIDEO', 'DUAL_CAMERA_VIDEO'];
    
    const hasRequiredFields = requiredFields.every(field => received.hasOwnProperty(field));
    const hasValidType = validTypes.includes(received.type);
    const hasPositiveFileSize = received.fileSize > 0;
    
    return {
      pass: hasRequiredFields && hasValidType && hasPositiveFileSize,
      message: () => `expected valid media upload object with required fields and valid type`
    };
  },
  
  toBeValidSafetyScore(received) {
    const isNumber = typeof received === 'number';
    const inRange = received >= 0 && received <= 100;
    
    return {
      pass: isNumber && inRange,
      message: () => `expected safety score to be a number between 0 and 100, got ${received}`
    };
  },
  
  toHavePerformantResponse(received, maxTime = 500) {
    const responseTime = received.responseTime || received;
    const pass = responseTime <= maxTime;
    
    return {
      pass,
      message: () => `expected response time ${responseTime}ms to be <= ${maxTime}ms`
    };
  }
});

// Global test utilities
global.testUtils = {
  // Wait for condition with timeout
  async waitFor(condition, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Create delay for testing timing-sensitive operations
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // Generate unique test identifiers
  generateTestId(prefix = 'test') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Mock date for consistent testing
  mockDate(date) {
    const mockDate = new Date(date);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    return () => global.Date.mockRestore();
  }
};

// Error handling improvements for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit process in tests, but log the error
});

// Global setup and teardown
beforeAll(async () => {
  // Global test setup
  if (process.env.JEST_WORKER_ID === '1' || !process.env.JEST_WORKER_ID) {
    console.log('🧪 Setting up test environment...');
    
    // Initialize test database if needed for integration tests
    if (process.argv.includes('integration') || process.argv.includes('workflows')) {
      try {
        await setupTestDatabase();
        console.log('✅ Test database initialized');
      } catch (error) {
        console.warn('⚠️ Test database setup failed:', error.message);
      }
    }
  }
}, 30000); // 30 second timeout for setup

afterAll(async () => {
  // Global test cleanup
  if (process.env.JEST_WORKER_ID === '1' || !process.env.JEST_WORKER_ID) {
    console.log('🧹 Cleaning up test environment...');
    
    // Cleanup test database
    try {
      await cleanupTestDatabase();
      console.log('✅ Test database cleaned up');
    } catch (error) {
      console.warn('⚠️ Test database cleanup warning:', error.message);
    }
    
    // Report performance metrics
    const slowTests = global.testPerformanceTracker.getSlowTests();
    if (slowTests.length > 0) {
      console.log('🐌 Slow tests detected:');
      slowTests.slice(0, 5).forEach(test => {
        console.log(`  - ${test.test}: ${test.duration.toFixed(2)}ms`);
      });
    }
    
    const memoryTrend = global.testPerformanceTracker.getMemoryTrend();
    if (memoryTrend && memoryTrend.heapGrowth > 10 * 1024 * 1024) { // > 10MB
      console.log(`📈 Memory growth detected: ${(memoryTrend.heapGrowth / 1024 / 1024).toFixed(2)}MB over ${memoryTrend.totalTests} tests`);
    }
  }
}, 10000); // 10 second timeout for cleanup

// Individual test setup and teardown
beforeEach(() => {
  const testName = expect.getState().currentTestName;
  if (testName) {
    global.testPerformanceTracker.startTest(testName);
  }
});

afterEach(() => {
  const testName = expect.getState().currentTestName;
  if (testName) {
    global.testPerformanceTracker.endTest(testName);
  }
});

// Jest configuration warnings
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key') {
  console.warn('⚠️ JWT_SECRET not set for testing. Using default test secret.');
}

if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  console.warn('⚠️ No test database URL configured. Database tests may fail.');
}

// Performance monitoring
if (process.env.MONITOR_PERFORMANCE === 'true') {
  setInterval(() => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > 200 * 1024 * 1024) { // > 200MB
      console.warn(`⚠️ High memory usage: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
  }, 5000);
}

console.log('🚀 Jest setup complete for FSW Iron Task API testing');