const { Logger, ContextLogger, logger } = require('../logger');

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('Logger', () => {
  describe('Basic logging', () => {
    it('should log with correct format', () => {
      const testLogger = new Logger();
      testLogger.info('Test message', { key: 'value' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });

    it('should respect log levels', () => {
      const testLogger = new Logger();
      testLogger.logLevel = 'warn';

      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warn message');
      testLogger.error('Error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should format logs differently for development and production', () => {
      const testLogger = new Logger();
      const originalNodeEnv = process.env.NODE_ENV;
      
      process.env.NODE_ENV = 'development';
      testLogger.info('Test message', { key: 'value' });

      // In development, should be human readable
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );

      process.env.NODE_ENV = 'production';
      console.log.mockClear();

      testLogger.info('Test message', { key: 'value' });

      // In production, should be JSON - just check it starts with {
      const logOutput = console.log.mock.calls[0][0];
      expect(logOutput).toMatch(/^\{/);
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Context logging', () => {
    it('should create context logger with additional context', () => {
      const contextLogger = logger.createContext({
        requestId: 'req_123',
        userId: 'user_456'
      });

      expect(contextLogger).toBeInstanceOf(ContextLogger);
      expect(contextLogger.context).toEqual({
        requestId: 'req_123',
        userId: 'user_456'
      });
    });

    it('should maintain context across log calls', () => {
      const contextLogger = logger.createContext({
        requestId: 'req_123'
      });

      contextLogger.info('Test message');

      const logCall = console.log.mock.calls[0][0];
      expect(logCall).toContain('req_123');
    });

    it('should create child logger with merged context', () => {
      const parentLogger = logger.createContext({
        requestId: 'req_123'
      });

      const childLogger = parentLogger.child({
        userId: 'user_456'
      });

      expect(childLogger.context).toEqual({
        requestId: 'req_123',
        userId: 'user_456'
      });
    });
  });

  describe('Specialized logging methods', () => {
    let contextLogger;

    beforeEach(() => {
      contextLogger = logger.createContext({
        requestId: 'req_123'
      });
    });

    it('should log HTTP requests with correct type', () => {
      contextLogger.http({
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        duration: 150
      });

      const logCall = console.log.mock.calls[0][0];
      expect(logCall).toContain('HTTP Request');
      expect(logCall).toContain('GET');
      expect(logCall).toContain('/api/test');
      expect(logCall).toContain('200');
      expect(logCall).toContain('150');
    });

    it('should log authentication events', () => {
      contextLogger.auth('Login attempt', {
        email: 'test@example.com'
      });

      const logCall = console.log.mock.calls[0][0];
      expect(logCall).toContain('Authentication Event');
      expect(logCall).toContain('Login attempt');
      expect(logCall).toContain('test@example.com');
    });

    it('should log security events as warnings', () => {
      contextLogger.security('Rate limit exceeded', {
        ip: '192.168.1.1'
      });

      const logCall = console.warn.mock.calls[0][0];
      expect(logCall).toContain('Security Event');
      expect(logCall).toContain('Rate limit exceeded');
      expect(logCall).toContain('192.168.1.1');
    });

    it('should log business events', () => {
      contextLogger.business('Project created', {
        projectId: 'project_123',
        userId: 'user_456'
      });

      const logCall = console.log.mock.calls[0][0];
      expect(logCall).toContain('Business Event');
      expect(logCall).toContain('Project created');
      expect(logCall).toContain('project_123');
    });

    it('should log performance metrics', () => {
      contextLogger.performance('Database query', {
        duration: 250,
        query: 'SELECT * FROM users'
      });

      const logCall = console.log.mock.calls[0][0];
      expect(logCall).toContain('Performance Metric');
      expect(logCall).toContain('Database query');
      expect(logCall).toContain('SELECT * FROM users');
    });
  });

  describe('Performance timing', () => {
    it('should time function execution', async () => {
      // Set log level to debug so we can see debug logs
      const testLogger = new Logger();
      testLogger.logLevel = 'debug';
      
      const contextLogger = testLogger.createContext({
        requestId: 'req_123'
      });

      const mockFunction = jest.fn().mockResolvedValue('result');

      const result = await contextLogger.time('Test operation', mockFunction);

      expect(result).toBe('result');
      expect(mockFunction).toHaveBeenCalled();

      // Should log start and performance metric
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('Starting Test operation')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Performance Metric')
      );
    });

    it('should log performance on function failure', async () => {
      const contextLogger = logger.createContext({
        requestId: 'req_123'
      });

      const mockFunction = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        contextLogger.time('Failing operation', mockFunction)
      ).rejects.toThrow('Test error');

      // Should log performance metric with success: false
      const performanceLog = console.log.mock.calls.find(call =>
        call[0].includes('Performance Metric')
      );
      expect(performanceLog[0]).toContain('Failing operation');
      expect(performanceLog[0]).toContain('\"success\": false');
    });
  });

  describe('JSON logging format', () => {
    let originalNodeEnv;
    
    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
    });
    
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should produce valid JSON logs', () => {
      const contextLogger = logger.createContext({
        requestId: 'req_123',
        userId: 'user_456'
      });

      contextLogger.info('Test message', {
        key: 'value',
        nested: { prop: 'test' }
      });

      const logOutput = console.log.mock.calls[0][0];
      expect(() => JSON.parse(logOutput)).not.toThrow();

      const parsed = JSON.parse(logOutput);
      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('Test message');
      expect(parsed.requestId).toBe('req_123');
      expect(parsed.userId).toBe('user_456');
      expect(parsed.key).toBe('value');
      expect(parsed.nested).toEqual({ prop: 'test' });
    });

    it('should include service metadata', () => {
      logger.info('Test message');

      const logOutput = console.log.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.service).toBe('fsw-api');
      expect(parsed.environment).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.version).toBeDefined();
    });

    it('should filter out null and undefined values', () => {
      logger.info('Test message', {
        defined: 'value',
        nullValue: null,
        undefinedValue: undefined
      });

      const logOutput = console.log.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.defined).toBe('value');
      expect(parsed.nullValue).toBeUndefined();
      expect(parsed.undefinedValue).toBeUndefined();
    });
  });
});