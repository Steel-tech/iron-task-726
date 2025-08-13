/**
 * API Documentation Routes
 * Serves OpenAPI/Swagger documentation with interactive UI
 */

const swaggerConfig = require('../config/swagger');

/**
 * Register documentation routes with Fastify
 * @param {import('fastify').FastifyInstance} fastify 
 */
async function docsRoutes(fastify) {
  // Register Swagger plugin for OpenAPI documentation
  await fastify.register(require('@fastify/swagger'), swaggerConfig);
  
  // Register Swagger UI for interactive documentation
  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      syntaxHighlight: {
        activate: true,
        theme: 'agate'
      }
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        // Optional: Add authentication for docs in production
        next();
      }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      // Dynamically set server URL based on request
      const protocol = request.headers['x-forwarded-proto'] || 'http';
      const host = request.headers.host;
      
      swaggerObject.servers = [
        {
          url: `${protocol}://${host}`,
          description: 'Current server'
        },
        ...swaggerConfig.openapi.servers
      ];
      
      return swaggerObject;
    }
  });

  // JSON specification endpoint
  fastify.get('/api-spec', {
    schema: {
      tags: ['Documentation'],
      summary: 'Get OpenAPI specification',
      description: 'Returns the raw OpenAPI/Swagger specification in JSON format',
      response: {
        200: {
          type: 'object',
          description: 'OpenAPI 3.0 specification'
        }
      }
    }
  }, async (request, reply) => {
    return fastify.swagger();
  });

  // API information endpoint
  fastify.get('/api-info', {
    schema: {
      tags: ['Documentation'],
      summary: 'Get API information',
      description: 'Returns basic information about the API including available endpoints',
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            documentation: { type: 'string' },
            specification: { type: 'string' },
            endpoints: {
              type: 'object',
              properties: {
                authentication: { type: 'string' },
                users: { type: 'string' },
                projects: { type: 'string' },
                media: { type: 'string' },
                safety: { type: 'string' },
                quality: { type: 'string' },
                dashboard: { type: 'string' }
              }
            },
            security: {
              type: 'object',
              properties: {
                authentication: { type: 'string' },
                rateLimiting: { type: 'array', items: { type: 'string' } },
                cors: { type: 'boolean' }
              }
            },
            features: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers.host;
    const baseUrl = `${protocol}://${host}`;

    return {
      name: 'FSW Iron Task API',
      version: '1.0.0',
      description: 'Professional construction documentation system API for ironworkers and construction teams',
      documentation: `${baseUrl}/docs`,
      specification: `${baseUrl}/api-spec`,
      endpoints: {
        authentication: `${baseUrl}/api/auth`,
        users: `${baseUrl}/api/users`,
        projects: `${baseUrl}/api/projects`,
        media: `${baseUrl}/api/media`,
        safety: `${baseUrl}/api/safety`,
        quality: `${baseUrl}/api/quality`,
        dashboard: `${baseUrl}/api/dashboard`
      },
      security: {
        authentication: 'JWT Bearer tokens with refresh token rotation',
        rateLimiting: [
          'Authentication: 5 attempts per 15 minutes',
          'File uploads: 20 per hour per user',
          'AI reports: 10 per hour per user',
          'General API: 100 requests per 15 minutes'
        ],
        cors: true
      },
      features: [
        'Real-time collaboration with WebSocket support',
        'Secure media management with GPS metadata',
        'Role-based access control (8 user roles)',
        'AI-powered report generation',
        'Safety and quality compliance tracking',
        'Multi-company project management',
        'Automatic thumbnail generation',
        'Batch file upload support',
        'Multi-backend storage (Supabase, S3, local)',
        'Comprehensive input validation',
        'Security headers and HTTPS enforcement'
      ]
    };
  });

  // Health check with API status
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check endpoint',
      description: 'Returns the current health status of the API',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            uptime: { type: 'number', description: 'Uptime in seconds' },
            environment: { type: 'string' },
            database: { 
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                responseTime: { type: 'number', description: 'Response time in ms' }
              }
            },
            storage: {
              type: 'object',
              properties: {
                provider: { type: 'string' },
                available: { type: 'boolean' }
              }
            },
            features: {
              type: 'object',
              properties: {
                websockets: { type: 'boolean' },
                fileUploads: { type: 'boolean' },
                aiReports: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now();
    
    // Test database connection
    let dbStatus = { connected: false, responseTime: 0 };
    try {
      const dbStart = Date.now();
      await fastify.prisma.$queryRaw`SELECT 1`;
      dbStatus = {
        connected: true,
        responseTime: Date.now() - dbStart
      };
    } catch (error) {
      fastify.log.warn('Database health check failed:', error.message);
    }

    // Test storage availability (basic check)
    let storageStatus = { provider: 'unknown', available: false };
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        storageStatus = { provider: 'supabase', available: true };
      } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        storageStatus = { provider: 's3', available: true };
      } else {
        storageStatus = { provider: 'local', available: true };
      }
    } catch (error) {
      fastify.log.warn('Storage health check failed:', error.message);
    }

    const status = dbStatus.connected ? 'healthy' : 'unhealthy';
    
    if (status === 'unhealthy') {
      reply.status(503);
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      storage: storageStatus,
      features: {
        websockets: true,
        fileUploads: true,
        aiReports: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY ? true : false
      }
    };
  });

  // Root endpoint with API overview
  fastify.get('/', {
    schema: {
      tags: ['Information'],
      summary: 'API root endpoint',
      description: 'Returns basic API information and navigation links',
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            version: { type: 'string' },
            documentation: { type: 'string' },
            health: { type: 'string' },
            specification: { type: 'string' },
            endpoints: {
              type: 'object',
              additionalProperties: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers.host;
    const baseUrl = `${protocol}://${host}`;

    return {
      message: 'FSW Iron Task API - Professional Construction Documentation System',
      version: '1.0.0',
      documentation: `${baseUrl}/docs`,
      health: `${baseUrl}/health`,
      specification: `${baseUrl}/api-spec`,
      endpoints: {
        auth: `${baseUrl}/api/auth`,
        users: `${baseUrl}/api/users`,
        projects: `${baseUrl}/api/projects`,
        media: `${baseUrl}/api/media`,
        safety: `${baseUrl}/api/safety`,
        quality: `${baseUrl}/api/quality`,
        dashboard: `${baseUrl}/api/dashboard`,
        websocket: `${baseUrl.replace('http', 'ws')}/socket.io/`
      }
    };
  });
}

module.exports = docsRoutes;