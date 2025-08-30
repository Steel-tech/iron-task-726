async function forms(fastify, opts) {
  const { prisma } = fastify

  // Save all forms data for a project
  fastify.post(
    '/projects/:projectId/forms',
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params
        const {
          timesheet,
          weather,
          jha,
          vehicleInspection,
          welderInspections,
          forkliftInspection,
          safetyMeeting,
        } = request.body

        // Verify user has access to the project
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { companyId: request.user.companyId },
              { members: { some: { userId: request.user.id } } },
            ],
          },
        })

        if (!project) {
          return reply.code(404).send({
            success: false,
            message: 'Project not found or access denied',
          })
        }

        // Save form data
        const formsData = await prisma.formsData.create({
          data: {
            projectId,
            userId: request.user.id,
            formType: 'FSW_IRON_TASK',
            data: JSON.stringify({
              timesheet,
              weather,
              jha,
              vehicleInspection,
              welderInspections,
              forkliftInspection,
              safetyMeeting,
            }),
            submittedAt: new Date(),
          },
        })

        return {
          success: true,
          message: 'Forms saved successfully',
          id: formsData.id,
        }
      } catch (error) {
        console.error('Error saving forms:', error)
        reply.code(500).send({
          success: false,
          message: 'Failed to save forms',
        })
      }
    }
  )

  // Get forms data by ID
  fastify.get(
    '/forms/:id',
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      try {
        const formsData = await prisma.formsData.findFirst({
          where: {
            id: request.params.id,
            OR: [
              { userId: request.user.id },
              { project: { companyId: request.user.companyId } },
              { project: { members: { some: { userId: request.user.id } } } },
            ],
          },
          include: {
            project: true,
            user: true,
          },
        })

        if (!formsData) {
          return reply.code(404).send({
            success: false,
            message: 'Forms not found',
          })
        }

        return {
          success: true,
          data: JSON.parse(formsData.data),
        }
      } catch (error) {
        console.error('Error fetching forms:', error)
        reply.code(500).send({
          success: false,
          message: 'Failed to fetch forms',
        })
      }
    }
  )

  // List all forms for a project
  fastify.get(
    '/projects/:projectId/forms',
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params

        // Verify user has access to the project
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { companyId: request.user.companyId },
              { members: { some: { userId: request.user.id } } },
            ],
          },
        })

        if (!project) {
          return reply.code(404).send({
            success: false,
            message: 'Project not found or access denied',
          })
        }

        const forms = await prisma.formsData.findMany({
          where: {
            projectId,
          },
          orderBy: {
            submittedAt: 'desc',
          },
          select: {
            id: true,
            formType: true,
            submittedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return {
          success: true,
          forms,
        }
      } catch (error) {
        console.error('Error listing forms:', error)
        reply.code(500).send({
          success: false,
          message: 'Failed to list forms',
        })
      }
    }
  )
}

module.exports = forms
