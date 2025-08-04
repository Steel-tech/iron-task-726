require('dotenv').config();
const env = require('./src/config/env');

const fastify = require('fastify')({ logger: true });

// Add minimal CORS
fastify.register(require('@fastify/cors'), {
  origin: true
});

// Add a test route
fastify.get('/api/test', async (request, reply) => {
  return { message: 'API server is working!', timestamp: new Date().toISOString() };
});

// Add health check route
fastify.get('/api/health', async (request, reply) => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Add login route (POST)
fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  // For development only - use environment variables for test credentials
  const testEmail = process.env.DEBUG_TEST_EMAIL || 'dev@localhost.local';
  const testPassword = process.env.DEBUG_TEST_PASSWORD || 'DevPassword123!';
  
  if (email === testEmail && password === testPassword) {
    return {
      user: { id: '1', email, name: 'Development User', role: 'ADMIN' },
      accessToken: 'dev-token-' + Date.now()
    };
  }
  
  return reply.code(401).send({ error: 'Invalid credentials' });
});

// Add auth/me route for getting current user
fastify.get('/api/auth/me', async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'No token provided' });
  }
  
  return {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN'
  };
});

// Add logout route
fastify.post('/api/auth/logout', async (request, reply) => {
  return { message: 'Logged out successfully' };
});

// Add a wildcard route to handle any missing API endpoints
fastify.all('/api/*', async (request, reply) => {
  return reply.code(404).send({ 
    error: 'Endpoint not found', 
    message: `${request.method} ${request.url} is not implemented in debug server`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/test', 
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/auth/logout'
    ]
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: env.PORT, host: '127.0.0.1' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();