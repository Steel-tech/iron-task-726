// Role-based authorization middleware
function authorize(...allowedRoles) {
  return async function (request, reply) {
    // Check if user is authenticated first
    if (!request.user) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    // Check if user has required role
    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: request.user.role,
      })
    }
  }
}

// Check if user owns the resource or has admin rights
function authorizeOwnership(resourceField = 'userId') {
  return async function (request, reply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    // Admins can access everything
    if (request.user.role === 'ADMIN') {
      return
    }

    // Check ownership
    const resourceUserId =
      request.params[resourceField] || request.body[resourceField]
    if (resourceUserId !== request.user.id) {
      return reply.code(403).send({ error: 'Access denied to this resource' })
    }
  }
}

// Project-based authorization
function authorizeProject(prisma) {
  return async function (request, reply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    const projectId = request.params.projectId || request.body.projectId
    if (!projectId) {
      return reply.code(400).send({ error: 'Project ID required' })
    }

    try {
      // Check if user is a member of the project
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: request.user.id,
          },
        },
      })

      // Allow access if user is project member or has elevated role
      const elevatedRoles = ['ADMIN', 'PROJECT_MANAGER']
      if (!projectMember && !elevatedRoles.includes(request.user.role)) {
        return reply.code(403).send({ error: 'Not a member of this project' })
      }

      // Attach project membership info to request
      request.projectMember = projectMember
    } catch (error) {
      return reply.code(500).send({ error: 'Authorization check failed' })
    }
  }
}

// Rate limiting for auth endpoints
function authRateLimit(fastify) {
  const attempts = new Map()

  return async function (request, reply) {
    const key = `${request.ip}:${request.body?.email || 'unknown'}`
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minutes
    const maxAttempts = 5

    // Get attempts for this key
    const userAttempts = attempts.get(key) || []

    // Filter out old attempts
    const recentAttempts = userAttempts.filter(
      timestamp => now - timestamp < windowMs
    )

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts)
      const retryAfter = Math.ceil((oldestAttempt + windowMs - now) / 1000)

      return reply.code(429).send({
        error: 'Too many attempts. Please try again later.',
        retryAfter,
      })
    }

    // Add this attempt
    recentAttempts.push(now)
    attempts.set(key, recentAttempts)

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance
      for (const [k, v] of attempts.entries()) {
        const filtered = v.filter(t => now - t < windowMs)
        if (filtered.length === 0) {
          attempts.delete(k)
        } else {
          attempts.set(k, filtered)
        }
      }
    }
  }
}

// Middleware to check if user is active
function requireActiveUser(prisma) {
  return async function (request, reply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: { id: true, email: true },
      })

      if (!user) {
        return reply
          .code(403)
          .send({ error: 'User account not found or inactive' })
      }
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to verify user status' })
    }
  }
}

module.exports = {
  authorize,
  authorizeOwnership,
  authorizeProject,
  authRateLimit,
  requireActiveUser,
}
