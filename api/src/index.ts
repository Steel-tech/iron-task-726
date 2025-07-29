import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import cookie from '@fastify/cookie'
import { prisma } from './lib/prisma'
import { initializeWebSocket } from './lib/websocket'

// Import routes
import authRoutes from './routes/auth'
import mediaRoutes from './routes/media'
import projectsRoutes from './routes/projects'
import usersRoutes from './routes/users'
import dashboardRoutes from './routes/dashboard'
import galleriesRoutes from './routes/galleries'
import timelinesRoutes from './routes/timelines'
import { commentRoutes } from './routes/comments'
import { teamChatRoutes } from './routes/team-chat'
import { notificationRoutes } from './routes/notifications'

const fastify = Fastify({ 
  logger: true,
  // Enable trust proxy for WebSocket
  trustProxy: true
})

// Register plugins
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
})

fastify.register(helmet, {
  contentSecurityPolicy: false
})

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
})

fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10 // Max 10 files per request
  }
})

fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'your-cookie-secret',
  parseOptions: {}
})

// Auth middleware
fastify.decorate("authenticate", async function(request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

// Routes
fastify.register(authRoutes, { prefix: '/api/auth' })
fastify.register(mediaRoutes, { prefix: '/api/media' })
fastify.register(projectsRoutes, { prefix: '/api/projects' })
fastify.register(usersRoutes, { prefix: '/api/users' })
fastify.register(dashboardRoutes, { prefix: '/api/dashboard' })
fastify.register(galleriesRoutes, { prefix: '/api' })
fastify.register(timelinesRoutes, { prefix: '/api' })
fastify.register(commentRoutes, { prefix: '/api' })
fastify.register(teamChatRoutes, { prefix: '/api' })
fastify.register(notificationRoutes, { prefix: '/api' })

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Start server
const start = async () => {
  try {
    await prisma.$connect()
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
    
    // Initialize WebSocket server
    initializeWebSocket(fastify)
    
    console.log('Server running on port 3001 with WebSocket support')
  } catch (err) {
    fastify.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await fastify.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await fastify.close()
  await prisma.$disconnect()
  process.exit(0)
})

start()