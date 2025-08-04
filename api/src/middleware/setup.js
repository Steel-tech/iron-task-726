const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const jwt = require('@fastify/jwt');
const multipart = require('@fastify/multipart');
const cookie = require('@fastify/cookie');

async function setupBasicMiddleware(fastify) {
  // Basic CORS setup
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  // Basic security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false
  });

  // JWT setup
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-key'
  });

  // File upload support
  await fastify.register(multipart);

  // Cookie support
  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'fallback-cookie-secret'
  });

  // Health check route
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API info route
  fastify.get('/api', async (request, reply) => {
    return { 
      name: 'Iron Task API',
      version: '1.0.0',
      status: 'ok' 
    };
  });

  // Auth middleware decorator
  fastify.decorate("authenticate", async function(request, reply) {
    try {
      await request.jwtVerify();
      // For now, just set basic user info from JWT
      // In production, you might want to verify user still exists in database
      request.user = request.user || { id: 'mock-user-id' };
    } catch (err) {
      reply.code(401).send({ error: 'Authentication required' });
    }
  });
}

module.exports = { setupBasicMiddleware };