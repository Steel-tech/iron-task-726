const {
  authorize,
  authorizeOwnership,
  authorizeProject,
  authRateLimit,
  requireActiveUser,
} = require('../../src/middleware/auth')

describe('Auth Middleware', () => {
  let mockRequest
  let mockReply

  beforeEach(() => {
    mockRequest = {
      user: null,
      params: {},
      body: {},
      ip: '127.0.0.1',
    }

    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }
  })

  describe('authorize', () => {
    it('should allow access for users with correct role', async () => {
      mockRequest.user = { id: '123', role: 'ADMIN' }
      const middleware = authorize('ADMIN', 'PROJECT_MANAGER')

      await middleware(mockRequest, mockReply)

      expect(mockReply.code).not.toHaveBeenCalled()
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it('should deny access for users without correct role', async () => {
      mockRequest.user = { id: '123', role: 'WORKER' }
      const middleware = authorize('ADMIN', 'PROJECT_MANAGER')

      await middleware(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: ['ADMIN', 'PROJECT_MANAGER'],
        current: 'WORKER',
      })
    })

    it('should require authentication', async () => {
      const middleware = authorize('ADMIN')

      await middleware(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(401)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Authentication required',
      })
    })
  })

  describe('authorizeOwnership', () => {
    it('should allow access for resource owner', async () => {
      mockRequest.user = { id: '123', role: 'WORKER' }
      mockRequest.params.userId = '123'
      const middleware = authorizeOwnership('userId')

      await middleware(mockRequest, mockReply)

      expect(mockReply.code).not.toHaveBeenCalled()
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it('should allow access for admin regardless of ownership', async () => {
      mockRequest.user = { id: '456', role: 'ADMIN' }
      mockRequest.params.userId = '123'
      const middleware = authorizeOwnership('userId')

      await middleware(mockRequest, mockReply)

      expect(mockReply.code).not.toHaveBeenCalled()
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it('should deny access for non-owner', async () => {
      mockRequest.user = { id: '456', role: 'WORKER' }
      mockRequest.params.userId = '123'
      const middleware = authorizeOwnership('userId')

      await middleware(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Access denied to this resource',
      })
    })
  })

  describe('authorizeProject', () => {
    let mockPrisma

    beforeEach(() => {
      mockPrisma = {
        projectMember: {
          findUnique: jest.fn(),
        },
      }
    })

    it('should allow access for project member', async () => {
      mockRequest.user = { id: '123', role: 'WORKER' }
      mockRequest.params.projectId = 'project-123'
      mockPrisma.projectMember.findUnique.mockResolvedValue({
        userId: '123',
        projectId: 'project-123',
      })

      const middleware = authorizeProject(mockPrisma)
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).not.toHaveBeenCalled()
      expect(mockReply.send).not.toHaveBeenCalled()
      expect(mockRequest.projectMember).toBeDefined()
    })

    it('should allow access for admin even if not project member', async () => {
      mockRequest.user = { id: '123', role: 'ADMIN' }
      mockRequest.params.projectId = 'project-123'
      mockPrisma.projectMember.findUnique.mockResolvedValue(null)

      const middleware = authorizeProject(mockPrisma)
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).not.toHaveBeenCalled()
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it('should deny access for non-member', async () => {
      mockRequest.user = { id: '123', role: 'WORKER' }
      mockRequest.params.projectId = 'project-123'
      mockPrisma.projectMember.findUnique.mockResolvedValue(null)

      const middleware = authorizeProject(mockPrisma)
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Not a member of this project',
      })
    })
  })

  describe('authRateLimit', () => {
    it('should allow requests under the limit', async () => {
      const middleware = authRateLimit()

      for (let i = 0; i < 4; i++) {
        await middleware(mockRequest, mockReply)
      }

      expect(mockReply.code).not.toHaveBeenCalled()
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it('should block requests over the limit', async () => {
      const middleware = authRateLimit()
      mockRequest.body = { email: 'test@example.com' }

      for (let i = 0; i < 5; i++) {
        await middleware(mockRequest, mockReply)
      }

      jest.clearAllMocks()

      await middleware(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(429)
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many attempts. Please try again later.',
        })
      )
    })
  })

  describe('requireActiveUser', () => {
    let mockPrisma

    beforeEach(() => {
      mockPrisma = {
        user: {
          findUnique: jest.fn(),
        },
      }
    })

    it('should allow active users', async () => {
      mockRequest.user = { id: '123' }
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      })

      const middleware = requireActiveUser(mockPrisma)
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).not.toHaveBeenCalled()
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it('should deny inactive users', async () => {
      mockRequest.user = { id: '123' }
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const middleware = requireActiveUser(mockPrisma)
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'User account not found or inactive',
      })
    })
  })
})
