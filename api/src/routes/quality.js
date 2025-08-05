const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function routes(fastify, options) {
  // Get quality inspections for a project
  fastify.get('/projects/:projectId/inspections', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { status, inspectionType } = request.query;
      
      const where = { projectId };
      if (status) where.status = status;
      if (inspectionType) where.inspectionType = inspectionType;

      const inspections = await prisma.qualityInspection.findMany({
        where,
        include: {
          inspector: {
            select: { id: true, name: true, email: true }
          },
          assignedBy: {
            select: { id: true, name: true, email: true }
          },
          defects: {
            select: { id: true, defectType: true, severity: true, status: true }
          }
        },
        orderBy: { scheduledDate: 'desc' },
        take: 50
      });

      return inspections;
    } catch (error) {
      request.logger.error('Failed to fetch quality inspections', {
        error: error.message,
        projectId: request.params.projectId
      });
      return reply.code(500).send({ 
        error: 'Failed to fetch quality inspections',
        message: error.message 
      });
    }
  });

  // Get single quality inspection
  fastify.get('/inspections/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const inspection = await prisma.qualityInspection.findUnique({
        where: { id },
        include: {
          project: {
            select: { id: true, name: true, jobNumber: true }
          },
          inspector: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignedBy: {
            select: { id: true, name: true, email: true }
          },
          approvedBy: {
            select: { id: true, name: true, email: true }
          },
          defects: {
            include: {
              discoveredBy: {
                select: { id: true, name: true, email: true }
              },
              assignedTo: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!inspection) {
        return reply.code(404).send({ error: 'Quality inspection not found' });
      }

      return inspection;
    } catch (error) {
      request.logger.error('Failed to fetch quality inspection', {
        error: error.message,
        inspectionId: request.params.id
      });
      return reply.code(500).send({ 
        error: 'Failed to fetch quality inspection',
        message: error.message 
      });
    }
  });

  // Create quality inspection
  fastify.post('/inspections', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const inspectionData = request.body;

      const inspection = await prisma.qualityInspection.create({
        data: {
          projectId: inspectionData.projectId,
          inspectorId: inspectionData.inspectorId || userId,
          assignedById: userId,
          inspectionType: inspectionData.inspectionType,
          workScope: inspectionData.workScope,
          location: inspectionData.location,
          scheduledDate: new Date(inspectionData.scheduledDate),
          checklistItems: inspectionData.checklistItems || {},
          mediaIds: inspectionData.mediaIds || [],
          notes: inspectionData.notes
        },
        include: {
          inspector: {
            select: { id: true, name: true, email: true }
          },
          project: {
            select: { id: true, name: true, jobNumber: true }
          }
        }
      });

      return inspection;
    } catch (error) {
      request.logger.error('Failed to create quality inspection', {
        error: error.message,
        userId: request.user.id
      });
      return reply.code(500).send({ 
        error: 'Failed to create quality inspection',
        message: error.message 
      });
    }
  });

  // Update quality inspection
  fastify.patch('/inspections/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      if (updateData.scheduledDate) updateData.scheduledDate = new Date(updateData.scheduledDate);
      if (updateData.startedAt) updateData.startedAt = new Date(updateData.startedAt);
      if (updateData.completedAt) updateData.completedAt = new Date(updateData.completedAt);
      if (updateData.approvedAt) updateData.approvedAt = new Date(updateData.approvedAt);

      if (updateData.status === 'IN_PROGRESS' && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }
      if (updateData.status === 'COMPLETED' && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }

      const inspection = await prisma.qualityInspection.update({
        where: { id },
        data: updateData,
        include: {
          inspector: {
            select: { id: true, name: true, email: true }
          },
          assignedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return inspection;
    } catch (error) {
      request.logger.error('Failed to update quality inspection', {
        error: error.message,
        inspectionId: request.params.id
      });
      return reply.code(500).send({ 
        error: 'Failed to update quality inspection',
        message: error.message 
      });
    }
  });

  // Get quality defects
  fastify.get('/projects/:projectId/defects', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { status, severity, defectType } = request.query;

      const inspections = await prisma.qualityInspection.findMany({
        where: { projectId },
        select: { id: true }
      });

      const inspectionIds = inspections.map(i => i.id);

      const where = { inspectionId: { in: inspectionIds } };
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (defectType) where.defectType = defectType;

      const defects = await prisma.qualityDefect.findMany({
        where,
        include: {
          inspection: {
            select: { id: true, inspectionType: true, workScope: true }
          },
          discoveredBy: {
            select: { id: true, name: true, email: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return defects;
    } catch (error) {
      request.logger.error('Failed to fetch quality defects', {
        error: error.message,
        projectId: request.params.projectId
      });
      return reply.code(500).send({ 
        error: 'Failed to fetch quality defects',
        message: error.message 
      });
    }
  });

  // Create quality defect
  fastify.post('/defects', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const defectData = request.body;

      const defect = await prisma.qualityDefect.create({
        data: {
          inspectionId: defectData.inspectionId,
          discoveredById: userId,
          defectType: defectData.defectType,
          severity: defectData.severity,
          category: defectData.category,
          description: defectData.description,
          location: defectData.location,
          coordinates: defectData.coordinates,
          mediaIds: defectData.mediaIds || [],
          measurementData: defectData.measurementData,
          assignedToId: defectData.assignedToId,
          dueDate: defectData.dueDate ? new Date(defectData.dueDate) : null
        },
        include: {
          inspection: {
            select: { id: true, inspectionType: true, workScope: true }
          },
          discoveredBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Update inspection defect count
      await prisma.qualityInspection.update({
        where: { id: defectData.inspectionId },
        data: {
          defectsFound: { increment: 1 },
          criticalIssues: defectData.severity === 'CRITICAL' ? { increment: 1 } : undefined
        }
      });

      return defect;
    } catch (error) {
      request.logger.error('Failed to create quality defect', {
        error: error.message,
        userId: request.user.id
      });
      return reply.code(500).send({ 
        error: 'Failed to create quality defect',
        message: error.message 
      });
    }
  });

  // Get punch list items
  fastify.get('/projects/:projectId/punch-list', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { status, priority, trade } = request.query;

      const where = { projectId };
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (trade) where.trade = trade;

      const punchItems = await prisma.punchListItem.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
          verifiedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 100
      });

      return punchItems;
    } catch (error) {
      request.logger.error('Failed to fetch punch list items', {
        error: error.message,
        projectId: request.params.projectId
      });
      return reply.code(500).send({ 
        error: 'Failed to fetch punch list items',
        message: error.message 
      });
    }
  });

  // Create punch list item
  fastify.post('/punch-list', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const punchData = request.body;

      const punchItem = await prisma.punchListItem.create({
        data: {
          projectId: punchData.projectId,
          createdById: userId,
          assignedToId: punchData.assignedToId,
          title: punchData.title,
          description: punchData.description,
          location: punchData.location,
          trade: punchData.trade,
          priority: punchData.priority || 'MEDIUM',
          mediaIds: punchData.mediaIds || [],
          dueDate: punchData.dueDate ? new Date(punchData.dueDate) : null
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return punchItem;
    } catch (error) {
      request.logger.error('Failed to create punch list item', {
        error: error.message,
        userId: request.user.id
      });
      return reply.code(500).send({ 
        error: 'Failed to create punch list item',
        message: error.message 
      });
    }
  });

  // Get quality statistics
  fastify.get('/projects/:projectId/quality-stats', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { timeframe = '30d' } = request.query;

      const now = new Date();
      let startDate;
      switch (timeframe) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const [
        totalInspections,
        completedInspections,
        totalDefects,
        openDefects,
        criticalDefects,
        totalPunchItems,
        openPunchItems
      ] = await Promise.all([
        prisma.qualityInspection.count({
          where: { projectId, scheduledDate: { gte: startDate } }
        }),
        prisma.qualityInspection.count({
          where: { projectId, status: 'COMPLETED', scheduledDate: { gte: startDate } }
        }),
        prisma.qualityDefect.count({
          where: { 
            inspection: { projectId },
            createdAt: { gte: startDate }
          }
        }),
        prisma.qualityDefect.count({
          where: { 
            inspection: { projectId },
            status: { in: ['OPEN', 'ASSIGNED', 'IN_REPAIR'] },
            createdAt: { gte: startDate }
          }
        }),
        prisma.qualityDefect.count({
          where: { 
            inspection: { projectId },
            severity: 'CRITICAL',
            createdAt: { gte: startDate }
          }
        }),
        prisma.punchListItem.count({
          where: { projectId, createdAt: { gte: startDate } }
        }),
        prisma.punchListItem.count({
          where: { 
            projectId, 
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            createdAt: { gte: startDate }
          }
        })
      ]);

      return {
        stats: {
          totalInspections,
          completedInspections,
          totalDefects,
          openDefects,
          criticalDefects,
          totalPunchItems,
          openPunchItems,
          inspectionCompletionRate: totalInspections > 0 ? (completedInspections / totalInspections * 100) : 0,
          defectResolutionRate: totalDefects > 0 ? ((totalDefects - openDefects) / totalDefects * 100) : 0
        },
        timeframe
      };
    } catch (error) {
      request.logger.error('Failed to fetch quality statistics', {
        error: error.message,
        projectId: request.params.projectId
      });
      return reply.code(500).send({ 
        error: 'Failed to fetch quality statistics',
        message: error.message 
      });
    }
  });
}

module.exports = routes;