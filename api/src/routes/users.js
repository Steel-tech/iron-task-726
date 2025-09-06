const prisma = require('../lib/prisma')

async function routes(fastify, options) {
  // Get all users (admin only)
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { role } = request.user

      if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
        return reply.code(403).send({ error: 'Unauthorized' })
      }

      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return users
    }
  )

  // Get user by ID
  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params
      const { role, userId } = request.user

      // Users can only view their own profile unless admin
      if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER' && userId !== id) {
        return reply.code(403).send({ error: 'Unauthorized' })
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      })

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }

      return user
    }
  )

  // Update user
  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params
      const { name, role } = request.body
      const { role: userRole, userId } = request.user

      // Only admins can update roles, users can update their own name
      if (userRole !== 'ADMIN' && userId !== id) {
        return reply.code(403).send({ error: 'Unauthorized' })
      }

      if (role && userRole !== 'ADMIN') {
        return reply.code(403).send({ error: 'Only admins can change roles' })
      }

      const updateData = {}
      if (name) updateData.name = name
      if (role && userRole === 'ADMIN') updateData.role = role

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })

      return user
    }
  )

  // Delete user (admin only)
  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params
      const { role, userId } = request.user

      if (role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Unauthorized' })
      }

      if (userId === id) {
        return reply.code(400).send({ error: 'Cannot delete your own account' })
      }

      await prisma.user.delete({
        where: { id },
      })

      return { message: 'User deleted successfully' }
    }
  )
}

module.exports = routes
