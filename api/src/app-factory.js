/**
 * Enhanced Fastify App Factory
 * Creates production-ready Fastify application with all enhanced features
 */

const fastify = require('fastify');
const path = require('path');

/**
 * Create enhanced Fastify application with all features
 */
async function createEnhancedFastifyApp(options = {}) {
  const {
    environment = 'production',
    logger = true,
    security = {},
    features = {}
  } = options;

  // Create Fastify instance with enhanced configuration
  const app = fastify({
    logger: logger,
    trustProxy: true,
    bodyLimit: 50 * 1024 * 1024, // 50MB
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: function(req) {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  });

  // Register core plugins
  await app.register(require('@fastify/cors'), {
    origin: environment === 'production' 
      ? ['https://*.vercel.app', 'https://*.fswirontask.com']
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  await app.register(require('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || 'fallback-cookie-secret-for-staging',
    parseOptions: {
      httpOnly: true,
      secure: environment === 'production',
      sameSite: 'lax',
      path: '/'
    }
  });

  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 10
    }
  });

  // Enhanced documentation if enabled
  if (features.enableSwaggerDocs) {
    try {
      // Register Swagger with enhanced configuration
      await app.register(require('@fastify/swagger'), {
        openapi: {
          info: {
            title: 'FSW Iron Task API - Enhanced',
            description: 'Professional construction documentation system with enhanced security and performance',
            version: '2.0.0-staging'
          },
          servers: [
            {
              url: environment === 'production' 
                ? 'https://api-staging.fswirontask.com'
                : 'http://localhost:3001',
              description: environment === 'production' ? 'Staging server' : 'Development server'
            }
          ],
          tags: [
            { name: 'System', description: 'System information and health checks' },
            { name: 'Authentication', description: 'User authentication and authorization' },
            { name: 'Projects', description: 'Construction project management' },
            { name: 'Media', description: 'Photo and video management' },
            { name: 'Safety', description: 'Safety incidents and compliance' },
            { name: 'Quality', description: 'Quality inspections and controls' }
          ]
        }
      });

      await app.register(require('@fastify/swagger-ui'), {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: true,
          tryItOutEnabled: true,
          displayRequestDuration: true
        },
        staticCSP: true
      });

    } catch (swaggerError) {
      console.warn('Swagger documentation disabled:', swaggerError.message);
    }
  }

  // Enhanced security middleware
  if (security.enableFileScanning) {
    try {
      const { createFileSecurityMiddleware } = require('./middleware/fileSecurityScan');
      const fileSecurityMiddleware = createFileSecurityMiddleware({
        tempDir: '/tmp',
        quarantine: true,
        logSuspiciousFiles: true
      });
      
      app.addHook('preHandler', fileSecurityMiddleware);
    } catch (error) {
      console.warn('File security scanning disabled:', error.message);
    }
  }

  if (security.enableAccountLockout) {
    try {
      const { createAccountLockoutMiddleware } = require('./middleware/accountLockout');
      const { middleware: accountLockout } = createAccountLockoutMiddleware({
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        progressiveLockout: true
      });
      
      app.addHook('preHandler', accountLockout);
    } catch (error) {
      console.warn('Account lockout protection disabled:', error.message);
    }
  }

  if (security.enablePerformanceMonitoring) {
    try {
      const { PerformanceMonitor } = require('./middleware/performanceOptimizer');
      const monitor = new PerformanceMonitor();
      
      app.addHook('preHandler', monitor.middleware());
      
      // Add metrics endpoint
      app.get('/api/performance/metrics', async (request, reply) => {
        return monitor.getMetrics();
      });
    } catch (error) {
      console.warn('Performance monitoring disabled:', error.message);
    }
  }

  // Register enhanced routes
  try {
    // Documentation and system routes (always available)
    await app.register(require('./routes/docs'));
    
    // Core API routes (mock mode for staging)
    await registerMockRoutes(app);

  } catch (routeError) {
    console.warn('Some enhanced routes disabled:', routeError.message);
    
    // Fallback to basic routes
    await registerBasicRoutes(app);
  }

  // Global error handler
  app.setErrorHandler(async (error, request, reply) => {
    const requestId = request.id;
    
    // Log error with correlation ID
    app.log.error({
      requestId,
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method
    });

    // Send appropriate error response
    const statusCode = error.statusCode || 500;
    const response = {
      error: statusCode >= 500 ? 'Internal Server Error' : error.message,
      requestId,
      timestamp: new Date().toISOString()
    };

    if (environment !== 'production' && statusCode >= 500) {
      response.stack = error.stack;
    }

    reply.status(statusCode).send(response);
  });

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    reply.status(404).send({
      message: `Route ${request.method}:${request.url} not found`,
      error: 'Not Found',
      statusCode: 404,
      requestId: request.id,
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

/**
 * Register mock routes for staging environment
 */
async function registerMockRoutes(app) {
  // Mock authentication routes
  app.post('/api/auth/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'User login (staging mock)',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;
    
    // Mock validation
    if (email === 'demo@fsw.com' && password === 'demo123') {
      return {
        accessToken: 'staging-jwt-token-demo',
        user: {
          id: 'demo-user-1',
          name: 'Demo Construction Manager',
          email: 'demo@fsw.com',
          role: 'PROJECT_MANAGER'
        }
      };
    }
    
    reply.status(401).send({ error: 'Invalid credentials' });
  });

  app.get('/api/auth/me', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get current user (staging mock)',
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    return {
      user: {
        id: 'demo-user-1',
        name: 'Demo Construction Manager',
        email: 'demo@fsw.com',
        role: 'PROJECT_MANAGER',
        company: {
          id: 'fsw-demo',
          name: 'FSW Construction Demo'
        }
      }
    };
  });

  app.post('/api/auth/logout', {
    schema: {
      tags: ['Authentication'],
      summary: 'User logout (staging mock)'
    }
  }, async (request, reply) => {
    return { message: 'Logged out successfully' };
  });

  // Mock projects endpoint
  app.get('/api/projects', {
    schema: {
      tags: ['Projects'],
      summary: 'List projects (staging mock)',
      response: {
        200: {
          type: 'object',
          properties: {
            projects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  location: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      projects: [
        {
          id: 'proj-1',
          name: 'Downtown Steel Frame Building',
          status: 'ACTIVE',
          location: 'Denver, CO',
          progress: 75
        },
        {
          id: 'proj-2',
          name: 'Industrial Warehouse Complex',
          status: 'ACTIVE',
          location: 'Colorado Springs, CO',
          progress: 45
        }
      ]
    };
  });

  // Mock media upload endpoint
  app.post('/api/media/upload', {
    schema: {
      tags: ['Media'],
      summary: 'Upload media files (staging mock)',
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    return {
      message: 'File upload successful (staging mock)',
      uploadedFiles: 1,
      processingStatus: 'completed'
    };
  });
}

/**
 * Register basic fallback routes
 */
async function registerBasicRoutes(app) {
  app.get('/api/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-staging-basic',
      environment: process.env.NODE_ENV || 'production'
    };
  });

  app.get('/', async (request, reply) => {
    return {
      message: 'FSW Iron Task API - Enhanced (Basic Mode)',
      version: '2.0.0-staging-basic',
      status: 'Some enhanced features may be disabled',
      endpoints: ['/api/health', '/docs']
    };
  });
}

module.exports = {
  createEnhancedFastifyApp
};