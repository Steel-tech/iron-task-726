// Mock modules before requiring them
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  activity: {
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
}

jest.mock('../../src/lib/prisma', () => mockPrisma)

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
}))

jest.mock('../../src/services/tokenService', () => ({
  createRefreshToken: jest.fn(() => ({
    token: 'mock-refresh-token',
    id: 'session-123',
  })),
  validateRefreshToken: jest.fn(() => ({ userId: '123', valid: true })),
  revokeRefreshToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
  revokeUserTokens: jest.fn(),
}))

// Mock rate limiting middleware
jest.mock('../../src/middleware/rateLimit', () => ({
  authRateLimit: jest.fn((request, reply, done) => done && done()),
}))

// Define mockSchema first
const mockSchema = {
  parseAsync: jest.fn(async data => data),
  parse: jest.fn(data => data),
  optional: () => mockSchema,
  default: () => mockSchema,
  refine: () => mockSchema,
}

// Mock Zod
jest.mock('zod', () => ({
  z: {
    string: () => ({
      email: () => ({ toLowerCase: () => mockSchema }),
      min: () => ({
        max: () => mockSchema,
        regex: () => mockSchema,
        optional: () => mockSchema,
      }),
      uuid: () => ({ optional: () => mockSchema }),
      regex: () => ({
        min: () => ({ max: () => mockSchema, optional: () => mockSchema }),
      }),
      optional: () => mockSchema,
    }),
    object: () => mockSchema,
    enum: () => ({ default: () => mockSchema }),
    boolean: () => ({ default: () => mockSchema, optional: () => mockSchema }),
    coerce: {
      number: () => ({
        int: () => ({
          positive: () => ({
            default: () => mockSchema,
            max: () => ({ default: () => mockSchema }),
          }),
        }),
      }),
    },
    any: () => mockSchema,
    datetime: () => ({ optional: () => mockSchema }),
  },
  ZodError: class ZodError extends Error {
    constructor() {
      super()
      this.errors = []
    }
  },
}))

// Mock validation middleware
jest.mock('../../src/middleware/validation', () => ({
  validate: jest.fn(schema => async (request, reply) => {
    // For test data that should fail validation, simulate validation errors
    if (request.body?.email === 'invalid-email') {
      return reply.code(400).send({
        error: 'Validation error',
        details: [{ path: 'email', message: 'Invalid email' }],
      })
    }
    if (request.body?.password === 'weak') {
      return reply.code(400).send({
        error: 'Validation error',
        details: [{ path: 'password', message: 'Password too weak' }],
      })
    }
    // Otherwise pass validation
  }),
  schemas: {
    email: mockSchema,
    password: mockSchema,
  },
}))

jest.mock('@fastify/jwt', () => ({
  default: jest.fn((fastify, opts, done) => {
    fastify.decorate('jwt', {
      sign: jest.fn(() => 'mock-token'),
      verify: jest.fn(() => ({ id: '123', type: 'refresh' })),
    })
    done()
  }),
}))

jest.mock('@fastify/cookie', () => ({
  default: jest.fn((fastify, opts, done) => {
    fastify.decorateReply('setCookie', jest.fn())
    fastify.decorateReply('clearCookie', jest.fn())
    fastify.decorateRequest('cookies', {
      getter() {
        return {}
      },
    })
    done()
  }),
}))

const fastify = require('fastify')
const authRoutes = require('../../src/routes/auth')

describe('Auth Routes', () => {
  let app

  beforeEach(async () => {
    app = fastify()

    // Mock JWT plugin
    app.decorate('jwt', {
      sign: jest.fn((payload, options) => 'mock-token'),
      verify: jest.fn(() => ({ id: '123', type: 'refresh' })),
    })

    // Mock cookie plugin
    app.decorateReply('setCookie', jest.fn())
    app.decorateReply('clearCookie', jest.fn())
    app.decorateRequest('cookies', {
      getter() {
        return {}
      },
    })

    // Mock logger
    app.decorateRequest('logger', {
      getter() {
        return {
          auth: jest.fn(),
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
        }
      },
    })

    // Mock fastify.log
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }

    app.decorate('authenticate', async (request, reply) => {
      try {
        await request.jwtVerify()
        request.user = request.user || { id: '123', email: 'test@example.com' }
      } catch (err) {
        reply.send(err)
      }
    })

    app.decorateRequest('jwtVerify', function () {
      this.user = { id: '123', email: 'test@example.com' }
      return Promise.resolve()
    })

    // Mock request.ip
    app.addHook('onRequest', async (request, reply) => {
      request.ip = '127.0.0.1'
    })

    app.register(authRoutes, { prefix: '/auth' })

    await app.ready()
  })

  afterEach(async () => {
    await app.close()
    jest.clearAllMocks()
  })

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        id: '123',
        email: newUser.email,
        name: newUser.name,
        role: 'WORKER',
        companyId: 'fsw-default-company',
        unionMember: false,
        createdAt: new Date(),
      })

      const bcrypt = require('bcrypt')
      bcrypt.hash.mockResolvedValue('hashedPassword')

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: newUser,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.user.email).toBe(newUser.email)
      expect(body.accessToken).toBeDefined()
    })

    it('should reject registration with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Validation error')
      expect(body.details).toBeDefined()
      expect(body.details[0].path).toBe('email')
    })

    it('should reject registration with weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Validation error')
      expect(body.details).toBeDefined()
      expect(body.details[0].path).toBe('password')
    })

    it('should reject registration if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '123' })

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Test User',
        },
      })

      expect(response.statusCode).toBe(409)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('User already exists')
    })
  })

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      const mockUser = {
        id: '123',
        email: loginData.email,
        password: 'hashedPassword',
        role: 'WORKER',
        companyId: 'company-123',
        company: {
          id: 'company-123',
          name: 'Test Company',
        },
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.activity.create.mockResolvedValue({})
      const bcrypt = require('bcrypt')
      bcrypt.compare.mockResolvedValue(true)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: loginData,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.user.email).toBe(loginData.email)
      expect(body.user.password).toBeUndefined()
      expect(body.accessToken).toBeDefined()
    })

    it('should reject login with invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'Password123!',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Invalid credentials')
    })

    it('should reject login with wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
      })
      const bcrypt = require('bcrypt')
      bcrypt.compare.mockResolvedValue(false)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'WrongPassword123!',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Invalid credentials')
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      // Mock the JWT verification to simulate authenticated user
      app.jwt.verify.mockImplementation(() => ({
        id: '123',
        email: 'test@example.com',
      }))

      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: 'Bearer mock-token',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })
  })
})
