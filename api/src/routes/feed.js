const { z } = require('zod')
const prisma = require('../lib/prisma')

// Validation schemas
const feedPreferencesSchema = z.object({
  projectOrder: z.array(z.string()).optional(),
  showStarredFirst: z.boolean().optional(),
  hideInactive: z.boolean().optional(),
  hiddenProjects: z.array(z.string()).optional(),
  viewMode: z.enum(['grid', 'list', 'compact']).optional(),
  itemsPerPage: z.number().min(10).max(100).optional(),
  autoRefresh: z.boolean().optional(),
  refreshInterval: z.number().min(10).max(300).optional(),
})

const starProjectSchema = z.object({
  projectId: z.string().uuid(),
})

const starUserSchema = z.object({
  userId: z.string().uuid(),
})

module.exports = async function feedRoutes(fastify, options) {
  // Get project feed with real-time updates
  fastify.get(
    '/feed',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId, companyId } = request.user
      const { page = 1, limit = 20, starred = false, since } = request.query

      try {
        // Get user's feed preferences
        const preferences = await prisma.feedPreferences.findUnique({
          where: { userId },
        })

        // Build the query
        const where = {
          companyId,
          status: { not: 'ARCHIVED' },
        }

        // Apply filters based on preferences
        if (preferences?.hideInactive) {
          where.status = 'ACTIVE'
        }

        if (preferences?.hiddenProjects?.length > 0) {
          where.id = { notIn: preferences.hiddenProjects }
        }

        // Get starred projects if requested
        let starredProjectIds = []
        if (starred || preferences?.showStarredFirst) {
          const starredProjects = await prisma.starredProject.findMany({
            where: { userId },
            select: { projectId: true },
          })
          starredProjectIds = starredProjects.map(sp => sp.projectId)
        }

        // Get projects with recent activity
        const projects = await prisma.project.findMany({
          where: starred ? { ...where, id: { in: starredProjectIds } } : where,
          include: {
            company: {
              select: { name: true },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
            media: {
              where: since
                ? { createdAt: { gte: new Date(since) } }
                : undefined,
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                mediaTags: {
                  include: {
                    tag: true,
                  },
                },
              },
            },
            labels: {
              include: {
                label: true,
              },
            },
            feedEvents: {
              where: since
                ? { createdAt: { gte: new Date(since) } }
                : undefined,
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                media: true,
                activities: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: parseInt(limit),
        })

        // Sort projects based on preferences
        let sortedProjects = projects
        if (preferences?.projectOrder?.length > 0) {
          const orderMap = new Map(
            preferences.projectOrder.map((id, index) => [id, index])
          )
          sortedProjects = projects.sort((a, b) => {
            const orderA = orderMap.get(a.id) ?? Infinity
            const orderB = orderMap.get(b.id) ?? Infinity
            return orderA - orderB
          })
        }

        // Mark starred projects
        const projectsWithStarred = sortedProjects.map(project => ({
          ...project,
          isStarred: starredProjectIds.includes(project.id),
        }))

        // Get total count
        const totalCount = await prisma.project.count({ where })

        reply.send({
          projects: projectsWithStarred,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
          },
          preferences,
        })
      } catch (error) {
        reply.code(500).send({ error: 'Failed to fetch project feed' })
      }
    }
  )

  // Get feed events for real-time updates
  fastify.get(
    '/feed/events',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId, companyId } = request.user
      const { projectId, since, limit = 50 } = request.query

      try {
        const where = {
          project: { companyId },
        }

        if (projectId) {
          where.projectId = projectId
        }

        if (since) {
          where.createdAt = { gte: new Date(since) }
        }

        const events = await prisma.feedEvent.findMany({
          where,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                jobNumber: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit),
        })

        reply.send({ events })
      } catch (error) {
        reply.code(500).send({ error: 'Failed to fetch feed events' })
      }
    }
  )

  // Star/unstar a project
  fastify.post(
    '/projects/:projectId/star',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId } = request.user
      const { projectId } = request.params

      try {
        // Check if already starred
        const existing = await prisma.starredProject.findUnique({
          where: {
            userId_projectId: {
              userId,
              projectId,
            },
          },
        })

        if (existing) {
          // Unstar
          await prisma.starredProject.delete({
            where: { id: existing.id },
          })
          reply.send({ starred: false })
        } else {
          // Star
          await prisma.starredProject.create({
            data: {
              userId,
              projectId,
            },
          })
          reply.send({ starred: true })
        }

        // Create feed event
        await prisma.feedEvent.create({
          data: {
            projectId,
            userId,
            eventType: existing ? 'project_unstarred' : 'project_starred',
            entityType: 'project',
            entityId: projectId,
          },
        })
      } catch (error) {
        reply.code(500).send({ error: 'Failed to star/unstar project' })
      }
    }
  )

  // Star/unstar a user
  fastify.post(
    '/users/:userId/star',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId } = request.user
      const { userId: starredId } = request.params

      if (userId === starredId) {
        return reply.code(400).send({ error: 'Cannot star yourself' })
      }

      try {
        // Check if already starred
        const existing = await prisma.starredUser.findUnique({
          where: {
            userId_starredId: {
              userId,
              starredId,
            },
          },
        })

        if (existing) {
          // Unstar
          await prisma.starredUser.delete({
            where: { id: existing.id },
          })
          reply.send({ starred: false })
        } else {
          // Star
          await prisma.starredUser.create({
            data: {
              userId,
              starredId,
            },
          })
          reply.send({ starred: true })
        }
      } catch (error) {
        reply.code(500).send({ error: 'Failed to star/unstar user' })
      }
    }
  )

  // Get starred projects
  fastify.get(
    '/starred/projects',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId } = request.user

      try {
        const starredProjects = await prisma.starredProject.findMany({
          where: { userId },
          include: {
            project: {
              include: {
                company: {
                  select: { name: true },
                },
                _count: {
                  select: {
                    media: true,
                    activities: true,
                  },
                },
              },
            },
          },
          orderBy: { starredAt: 'desc' },
        })

        reply.send({
          projects: starredProjects.map(sp => ({
            ...sp.project,
            starredAt: sp.starredAt,
          })),
        })
      } catch (error) {
        reply.code(500).send({ error: 'Failed to fetch starred projects' })
      }
    }
  )

  // Get starred users
  fastify.get(
    '/starred/users',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId } = request.user

      try {
        const starredUsers = await prisma.starredUser.findMany({
          where: { userId },
          include: {
            starredUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: { starredAt: 'desc' },
        })

        reply.send({
          users: starredUsers.map(su => ({
            ...su.starredUser,
            starredAt: su.starredAt,
          })),
        })
      } catch (error) {
        reply.code(500).send({ error: 'Failed to fetch starred users' })
      }
    }
  )

  // Update feed preferences
  fastify.put(
    '/feed/preferences',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId } = request.user
      const data = feedPreferencesSchema.parse(request.body)

      try {
        const preferences = await prisma.feedPreferences.upsert({
          where: { userId },
          update: data,
          create: {
            userId,
            ...data,
          },
        })

        reply.send({ preferences })
      } catch (error) {
        reply.code(500).send({ error: 'Failed to update feed preferences' })
      }
    }
  )

  // Reorder projects in feed
  fastify.put(
    '/feed/reorder',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId } = request.user
      const { projectOrder } = request.body

      if (!Array.isArray(projectOrder)) {
        return reply.code(400).send({ error: 'Project order must be an array' })
      }

      try {
        const preferences = await prisma.feedPreferences.upsert({
          where: { userId },
          update: { projectOrder },
          create: {
            userId,
            projectOrder,
          },
        })

        reply.send({ preferences })
      } catch (error) {
        reply.code(500).send({ error: 'Failed to update project order' })
      }
    }
  )

  // Log feed event (for tracking various activities)
  fastify.post(
    '/feed/events',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId } = request.user
      const { projectId, eventType, entityType, entityId, metadata } =
        request.body

      try {
        const event = await prisma.feedEvent.create({
          data: {
            projectId,
            userId,
            eventType,
            entityType,
            entityId,
            metadata,
          },
        })

        // Emit WebSocket event for real-time updates
        if (fastify.io) {
          fastify.io.to(`project:${projectId}`).emit('feed:event', event)
        }

        reply.send({ event })
      } catch (error) {
        reply.code(500).send({ error: 'Failed to create feed event' })
      }
    }
  )
}
