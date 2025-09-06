const prisma = require('../lib/prisma')

async function routes(fastify, options) {
  // Get safety incidents for a project
  fastify.get(
    '/projects/:projectId/incidents',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params

        const incidents = await prisma.safetyIncident.findMany({
          where: { projectId },
          include: {
            reportedBy: {
              select: { id: true, name: true, email: true },
            },
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { occurredAt: 'desc' },
          take: 50,
        })

        return incidents
      } catch (error) {
        request.logger.error('Failed to fetch safety incidents', {
          error: error.message,
          projectId: request.params.projectId,
        })
        return reply.code(500).send({
          error: 'Failed to fetch safety incidents',
          message: error.message,
        })
      }
    }
  )

  // Create safety incident
  fastify.post(
    '/incidents',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id
        const incidentData = request.body

        const incident = await prisma.safetyIncident.create({
          data: {
            projectId: incidentData.projectId,
            incidentType: incidentData.incidentType,
            severity: incidentData.severity,
            title: incidentData.title,
            description: incidentData.description,
            location: incidentData.location,
            mediaIds: incidentData.mediaIds || [],
            witnessIds: incidentData.witnessIds || [],
            oshaReportable: incidentData.oshaReportable || false,
            coordinates: incidentData.coordinates,
            reportedById: userId,
            occurredAt: new Date(incidentData.occurredAt),
            dueDate: incidentData.oshaReportable
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          include: {
            reportedBy: {
              select: { id: true, name: true, email: true },
            },
            project: {
              select: { id: true, name: true, jobNumber: true },
            },
          },
        })

        return incident
      } catch (error) {
        request.logger.error('Failed to create safety incident', {
          error: error.message,
          userId: request.user.id,
        })
        return reply.code(500).send({
          error: 'Failed to create safety incident',
          message: error.message,
        })
      }
    }
  )

  // Get safety statistics
  fastify.get(
    '/projects/:projectId/stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params
        const { timeframe = '30d' } = request.query

        const now = new Date()
        let startDate
        switch (timeframe) {
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        const totalIncidents = await prisma.safetyIncident.count({
          where: { projectId, occurredAt: { gte: startDate } },
        })

        const openIncidents = await prisma.safetyIncident.count({
          where: {
            projectId,
            status: { in: ['OPEN', 'INVESTIGATING'] },
            occurredAt: { gte: startDate },
          },
        })

        return {
          stats: {
            totalIncidents,
            openIncidents,
          },
          timeframe,
        }
      } catch (error) {
        request.logger.error('Failed to fetch safety statistics', {
          error: error.message,
          projectId: request.params.projectId,
        })
        return reply.code(500).send({
          error: 'Failed to fetch safety statistics',
          message: error.message,
        })
      }
    }
  )
}

module.exports = routes
