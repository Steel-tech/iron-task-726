require('dotenv').config()

const fastify = require('fastify')({
  logger: process.env.NODE_ENV === 'production' ? true : { level: 'info' },
})

// Register essential plugins
fastify.register(require('@fastify/cors'), {
  origin:
    process.env.NODE_ENV === 'production'
      ? [
          'https://*.vercel.app',
          'https://*.railway.app',
          'https://your-domain.com',
        ]
      : true,
})

// Health check
fastify.get('/api/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }
})

// Root route
fastify.get('/', async (request, reply) => {
  return {
    message: 'FSW Iron Task API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/me',
      '/api/auth/logout',
    ],
  }
})

// Demo user data - use environment variables for security
const DEMO_USER = {
  id: '1',
  email: process.env.DEMO_USER_EMAIL || 'demo@fsw.local',
  name: process.env.DEMO_USER_NAME || 'Demo User',
  role: 'ADMIN',
  company: { id: 'fsw-denver', name: 'FSW Denver' },
}

const DEMO_PROJECTS = [
  {
    id: 'project-1',
    name: 'Downtown Office Tower',
    location: 'Denver, CO',
    status: 'ACTIVE',
    progress: 78,
  },
  {
    id: 'project-2',
    name: 'Steel Bridge Renovation',
    location: 'Boulder, CO',
    status: 'ACTIVE',
    progress: 45,
  },
]

// Authentication routes
fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body

  const demoPassword = process.env.DEMO_USER_PASSWORD || 'DemoPassword123!'

  if (email === DEMO_USER.email && password === demoPassword) {
    const token = Buffer.from(
      JSON.stringify({
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        exp: Date.now() + 15 * 60 * 1000,
      })
    ).toString('base64')

    return {
      user: DEMO_USER,
      accessToken: token,
    }
  }

  return reply.code(401).send({ error: 'Invalid credentials' })
})

fastify.get('/api/auth/me', async (request, reply) => {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'No token provided' })
  }

  return DEMO_USER
})

fastify.post('/api/auth/logout', async (request, reply) => {
  return { message: 'Logged out successfully' }
})

fastify.post('/api/auth/refresh', async (request, reply) => {
  const token = Buffer.from(
    JSON.stringify({
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      exp: Date.now() + 15 * 60 * 1000,
    })
  ).toString('base64')

  return { accessToken: token }
})

// Projects routes
fastify.get('/api/projects', async (request, reply) => {
  return DEMO_PROJECTS
})

// Catch-all for unimplemented endpoints
fastify.all('/api/*', async (request, reply) => {
  return reply.code(404).send({
    error: 'Endpoint not implemented',
    message: `${request.method} ${request.url}`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/auth/logout',
      'POST /api/auth/refresh',
      'GET /api/projects',
    ],
  })
})

const start = async () => {
  try {
    const port = process.env.PORT || 3001
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'

    await fastify.listen({ port, host })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
