require('dotenv').config()

// Validate environment variables first
const env = require('./config/env')
const constants = require('./config/constants')

const fastify = require('fastify')({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          headers: {
            ...req.headers,
            authorization: req.headers.authorization ? '[REDACTED]' : undefined,
          },
          hostname: req.hostname,
          remoteAddress: req.ip,
          remotePort: req.socket?.remotePort,
        }
      },
    },
  },
})

const cors = require('@fastify/cors')
const helmet = require('@fastify/helmet')
const jwt = require('@fastify/jwt')
const multipart = require('@fastify/multipart')
const cookie = require('@fastify/cookie')
const prisma = require('./lib/prisma')
const bcrypt = require('bcrypt')
const { errorHandler } = require('./utils/errors')
const { apiRateLimit } = require('./middleware/rateLimit')
const {
  logger,
  requestCorrelationMiddleware,
  errorLoggingMiddleware,
} = require('./utils/logger')
const {
  httpsEnforcement,
  securityHeaders,
  requestValidation,
  ipFiltering,
  securityLogging,
} = require('./middleware/httpsEnforcement')

// Register plugins
fastify.register(cors, {
  origin: (origin, cb) => {
    // In production, only allow specific origins
    if (env.NODE_ENV === 'production') {
      const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim())
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    } else {
      // Development: use CORS_ORIGIN env variable or allow common development origins
      const developmentOrigins = env.CORS_ORIGIN
        ? env.CORS_ORIGIN.split(',').map(o => o.trim())
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
          ]
      if (!origin || developmentOrigins.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})

fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:
        env.NODE_ENV === 'production'
          ? ["'self'"]
          : ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // Allow eval in dev for hot reload
      styleSrc: ["'self'", "'unsafe-inline'"], // Needed for dynamic styles
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:',
        '*.supabase.co', // Supabase storage
        '*.amazonaws.com', // AWS S3 (legacy support)
      ],
      connectSrc: [
        "'self'",
        'wss:', // WebSocket connections
        'https:', // API calls
        '*.supabase.co', // Supabase API
        ...(env.NODE_ENV === 'development'
          ? ['ws://localhost:*', 'http://localhost:*']
          : []),
      ],
      fontSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'blob:', '*.supabase.co', '*.amazonaws.com'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"], // Prevent clickjacking
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable if causing issues with file uploads
  hsts:
    env.NODE_ENV === 'production'
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
})

fastify.register(jwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: constants.ACCESS_TOKEN_EXPIRES,
  },
})

fastify.register(multipart, {
  limits: {
    fileSize: constants.MAX_FILE_SIZE,
    files: constants.MAX_FILES_PER_REQUEST,
  },
})

fastify.register(cookie, {
  secret: env.COOKIE_SECRET,
  parseOptions: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
})

// Global rate limiting (apply to all routes)
fastify.addHook('preHandler', apiRateLimit)

// Enhanced security middleware pipeline
fastify.addHook('onRequest', async (request, reply) => {
  // Extract real IP from proxy headers
  if (request.headers['x-forwarded-for']) {
    request.realIp = request.headers['x-forwarded-for'].split(',')[0].trim()
  } else if (request.headers['x-real-ip']) {
    request.realIp = request.headers['x-real-ip']
  }

  // Generate unique request ID for tracing
  request.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Log incoming request with enhanced details
  logger.debug('Incoming request', {
    requestId: request.id,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.realIp || request.ip,
    headers: Object.keys(request.headers).reduce((acc, key) => {
      // Filter sensitive headers
      if (
        !['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())
      ) {
        acc[key] = request.headers[key]
      }
      return acc
    }, {}),
    query: request.query,
    startTime: Date.now(),
  })

  // Store start time for response duration calculation
  request.startTime = Date.now()

  // Attach logger to request
  await requestCorrelationMiddleware(request, reply)

  // Security middleware pipeline
  await httpsEnforcement()(request, reply)
  await ipFiltering()(request, reply)
  await requestValidation()(request, reply)
  await securityLogging()(request, reply)
})

// Response logging and security headers middleware
fastify.addHook('onSend', async (request, reply, payload) => {
  // Log response details
  const duration = Date.now() - (request.startTime || Date.now())
  logger.debug('Outgoing response', {
    requestId: request.id,
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${duration}ms`,
    responseSize: payload ? Buffer.byteLength(payload.toString()) : 0,
    ip: request.realIp || request.ip,
  })

  await securityHeaders()(request, reply)
})

// Set error handler with logging
fastify.setErrorHandler((error, request, reply) => {
  // Log error with context
  errorLoggingMiddleware()(error, request, reply)

  // Handle error response
  return errorHandler(error, request, reply)
})

// Decorate fastify with prisma and bcrypt
fastify.decorate('prisma', prisma)
fastify.decorate('bcrypt', bcrypt)

// Auth middleware
fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify()

    // Optionally verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, role: true, companyId: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    request.user = user
  } catch (err) {
    return reply.code(401).send({ error: 'Authentication required' })
  }
})

// Routes
fastify.register(require('./routes/auth'), { prefix: '/api/auth' })
fastify.register(require('./routes/two-factor'), { prefix: '/api/auth/2fa' })
fastify.register(require('./routes/media'), { prefix: '/api/media' })
fastify.register(require('./routes/projects'), { prefix: '/api/projects' })
fastify.register(require('./routes/users'), { prefix: '/api/users' })
fastify.register(require('./routes/dashboard'), { prefix: '/api/dashboard' })
fastify.register(require('./routes/galleries'), { prefix: '/api' })
fastify.register(require('./routes/timelines'), { prefix: '/api' })
fastify.register(require('./routes/tags'), { prefix: '/api/tags' })
fastify.register(require('./routes/labels'), { prefix: '/api/labels' })
fastify.register(require('./routes/filters'), { prefix: '/api/filters' })
fastify.register(require('./routes/feed'), { prefix: '/api' })
fastify.register(require('./routes/reports'), { prefix: '/api' })
fastify.register(require('./routes/forms'), { prefix: '/api' })

// Debug routes (development only)
if (process.env.NODE_ENV !== 'production') {
  fastify.register(require('./routes/debug'), { prefix: '/api/debug' })
}

// Shared catalog route (no auth required)
fastify.register(require('./routes/filters').sharedCatalogRoute, {
  prefix: '/api',
})
// Push notifications
fastify.register(require('./routes/push-subscriptions'), {
  prefix: '/api/push',
})
// User preferences
fastify.register(require('./routes/user-preferences'), { prefix: '/api/users' })
// Notifications
fastify.register(require('./routes/notifications'), { prefix: '/api' })

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    name: 'FSW Iron Task API',
    version: '1.0.0',
    description: 'Construction Documentation & Safety Management System',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: [
      'Real-time team collaboration',
      'Safety incident tracking',
      'Compliance reporting',
      'Media management',
      'Project analytics',
    ],
    endpoints: {
      health: '/health',
      api_info: '/api',
      authentication: '/api/auth',
      media: '/api/media',
      projects: '/api/projects',
      users: '/api/users',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      forms: '/api/forms',
    },
    documentation: 'https://github.com/your-org/iron-task/blob/main/README.md',
  }
})

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// API info endpoint
fastify.get('/api', async (request, reply) => {
  return {
    name: 'Iron Task API',
    version: '1.0.0',
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth',
      '/api/media',
      '/api/projects',
      '/api/users',
      '/api/dashboard',
    ],
  }
})

// Start server
const start = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    logger.info('Database connected')

    // Start server
    await fastify.listen({ port: env.PORT, host: env.HOST })
    logger.info('Server started', {
      host: env.HOST,
      port: env.PORT,
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      pid: process.pid,
    })
  } catch (err) {
    logger.error('Failed to start server', {
      error: err.message,
      stack: err.stack,
    })
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Graceful shutdown initiated', { signal: 'SIGTERM' })

  try {
    await fastify.close()
    logger.info('HTTP server closed')

    await prisma.$disconnect()
    logger.info('Database disconnected')

    logger.info('Graceful shutdown completed')
    process.exit(0)
  } catch (err) {
    logger.error('Error during shutdown', {
      error: err.message,
      stack: err.stack,
    })
    process.exit(1)
  }
})

process.on('SIGINT', async () => {
  logger.info('Graceful shutdown initiated', { signal: 'SIGINT' })

  try {
    await fastify.close()
    await prisma.$disconnect()
    logger.info('Graceful shutdown completed')
    process.exit(0)
  } catch (err) {
    logger.error('Error during shutdown', {
      error: err.message,
      stack: err.stack,
    })
    process.exit(1)
  }
})

start()
