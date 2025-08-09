const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function routes(fastify, options) {
  // Get all users (admin only)
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { role } = request.user;
    
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return reply.code(403).send({ error: 'Unauthorized' });
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
    });

    return users;
  });

  // Get user by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { role, userId } = request.user;
    
    // Users can only view their own profile unless admin
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER' && userId !== id) {
      return reply.code(403).send({ error: 'Unauthorized' });
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
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return user;
  });

  // Update user
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, role } = request.body;
    const { role: userRole, userId } = request.user;
    
    // Only admins can update roles, users can update their own name
    if (userRole !== 'ADMIN' && userId !== id) {
      return reply.code(403).send({ error: 'Unauthorized' });
    }

    if (role && userRole !== 'ADMIN') {
      return reply.code(403).send({ error: 'Only admins can change roles' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (role && userRole === 'ADMIN') updateData.role = role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  });

  // Delete user (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { role, userId } = request.user;
    
    if (role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Unauthorized' });
    }

    if (userId === id) {
      return reply.code(400).send({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  });

  // ================================
  // TEAM PRESENCE ENDPOINTS
  // ================================

  // Update user presence
  fastify.post('/presence', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { projectId, status, currentPage, activity, deviceType, userAgent } = request.body;
      const { userId } = request.user;

      const presence = await prisma.userPresence.upsert({
        where: {
          userId_projectId: {
            userId,
            projectId: projectId || null
          }
        },
        update: {
          status: status || 'ONLINE',
          lastSeen: new Date(),
          currentPage,
          activity,
          deviceType,
          userAgent
        },
        create: {
          userId,
          projectId: projectId || null,
          status: status || 'ONLINE',
          lastSeen: new Date(),
          currentPage,
          activity,
          deviceType,
          userAgent
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      return { success: true, presence };
    } catch (error) {
      fastify.log.error('Failed to update presence:', error);
      return reply.code(500).send({ error: 'Failed to update presence' });
    }
  });

  // Get project presence
  fastify.get('/presence/project/:projectId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { projectId } = request.params;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const presences = await prisma.userPresence.findMany({
        where: {
          projectId,
          OR: [
            { status: 'ONLINE' },
            { 
              status: 'AWAY',
              lastSeen: { gte: fiveMinutesAgo }
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          lastSeen: 'desc'
        }
      });

      return { presences };
    } catch (error) {
      fastify.log.error('Failed to get project presence:', error);
      return reply.code(500).send({ error: 'Failed to get project presence' });
    }
  });

  // Get presence statistics
  fastify.get('/presence/project/:projectId/stats', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { projectId } = request.params;
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [online, recent, total] = await Promise.all([
        prisma.userPresence.count({
          where: {
            projectId,
            status: 'ONLINE',
            lastSeen: { gte: fiveMinutesAgo }
          }
        }),
        prisma.userPresence.count({
          where: {
            projectId,
            lastSeen: { gte: oneHourAgo }
          }
        }),
        prisma.projectMember.count({
          where: { projectId }
        })
      ]);

      const stats = {
        online,
        recent,
        total,
        activePercentage: total > 0 ? Math.round((recent / total) * 100) : 0
      };

      return { stats };
    } catch (error) {
      fastify.log.error('Failed to get presence stats:', error);
      return reply.code(500).send({ error: 'Failed to get presence stats' });
    }
  });

  // Set user offline
  fastify.post('/presence/offline', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      
      await prisma.userPresence.updateMany({
        where: { userId },
        data: {
          status: 'OFFLINE',
          lastSeen: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      fastify.log.error('Failed to set offline:', error);
      return reply.code(500).send({ error: 'Failed to set offline' });
    }
  });

  // ================================
  // NOTIFICATIONS ENDPOINTS
  // ================================

  // Get user notifications
  fastify.get('/notifications', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const { limit = 20, unreadOnly = false } = request.query;

      const notifications = await prisma.teamNotification.findMany({
        where: {
          userId,
          ...(unreadOnly === 'true' && { read: false })
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        include: {
          project: {
            select: { name: true, jobNumber: true }
          }
        }
      });

      return { notifications };
    } catch (error) {
      fastify.log.error('Failed to get notifications:', error);
      return reply.code(500).send({ error: 'Failed to get notifications' });
    }
  });

  // Mark notification as read
  fastify.patch('/notifications/:id/read', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { userId } = request.user;

      const notification = await prisma.teamNotification.update({
        where: { 
          id,
          userId // Ensure user owns this notification
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      return { success: true, notification };
    } catch (error) {
      fastify.log.error('Failed to mark notification as read:', error);
      return reply.code(500).send({ error: 'Failed to update notification' });
    }
  });

  // Mark all notifications as read
  fastify.post('/notifications/read-all', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;

      await prisma.teamNotification.updateMany({
        where: { 
          userId,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      fastify.log.error('Failed to mark all notifications as read:', error);
      return reply.code(500).send({ error: 'Failed to update notifications' });
    }
  });

  // Create notification (internal use)
  fastify.post('/notifications/create', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { 
        targetUserId, 
        projectId, 
        type, 
        title, 
        message, 
        data = {}, 
        actionUrl,
        priority = 'NORMAL'
      } = request.body;

      const notification = await prisma.teamNotification.create({
        data: {
          userId: targetUserId,
          projectId,
          type,
          title,
          message,
          data,
          actionUrl,
          priority
        },
        include: {
          project: {
            select: { name: true }
          }
        }
      });

      return { success: true, notification };
    } catch (error) {
      fastify.log.error('Failed to create notification:', error);
      return reply.code(500).send({ error: 'Failed to create notification' });
    }
  });

  // Get notification counts
  fastify.get('/notifications/counts', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;

      const [unreadCount, totalCount] = await Promise.all([
        prisma.teamNotification.count({
          where: { userId, read: false }
        }),
        prisma.teamNotification.count({
          where: { userId }
        })
      ]);

      return { 
        unread: unreadCount,
        total: totalCount
      };
    } catch (error) {
      fastify.log.error('Failed to get notification counts:', error);
      return reply.code(500).send({ error: 'Failed to get notification counts' });
    }
  });

  // ================================
  // LIVE ACTIVITY FEED ENDPOINTS
  // ================================

  // Get activity feed for a project
  fastify.get('/activity/project/:projectId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { limit = 50, offset = 0, type } = request.query;

      // Build where clause for activity filtering
      const where = {
        projectId,
        ...(type && { activityType: type })
      };

      const activities = await prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          user: {
            select: { name: true, role: true }
          },
          media: {
            select: { fileName: true, mediaType: true, thumbnailUrl: true }
          },
          project: {
            select: { name: true }
          }
        }
      });

      // Get real-time stats
      const stats = await this.getActivityStats(projectId);

      return { activities, stats };
    } catch (error) {
      fastify.log.error('Failed to get activity feed:', error);
      return reply.code(500).send({ error: 'Failed to get activity feed' });
    }
  });

  // Get activity statistics
  fastify.get('/activity/project/:projectId/stats', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { projectId } = request.params;
      const stats = await this.getActivityStats(projectId);
      return { stats };
    } catch (error) {
      fastify.log.error('Failed to get activity stats:', error);
      return reply.code(500).send({ error: 'Failed to get activity stats' });
    }
  });

  // Create activity (internal helper)
  fastify.post('/activity/create', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const {
        projectId,
        activityType,
        description,
        mediaId,
        metadata = {}
      } = request.body;
      const { userId } = request.user;

      const activity = await prisma.activity.create({
        data: {
          userId,
          projectId,
          activityType,
          description,
          mediaId,
          metadata
        },
        include: {
          user: {
            select: { name: true, role: true }
          },
          media: {
            select: { fileName: true, mediaType: true, thumbnailUrl: true }
          }
        }
      });

      // Broadcast to project members via WebSocket
      if (global.io) {
        global.io.to(`project:${projectId}`).emit('activity_created', activity);
      }

      return { success: true, activity };
    } catch (error) {
      fastify.log.error('Failed to create activity:', error);
      return reply.code(500).send({ error: 'Failed to create activity' });
    }
  });

  // Get recent activities across all projects for a user
  fastify.get('/activity/recent', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { userId } = request.user;
      const { limit = 20 } = request.query;

      // Get user's projects
      const projectMembers = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true }
      });
      const projectIds = projectMembers.map(pm => pm.projectId);

      const activities = await prisma.activity.findMany({
        where: {
          projectId: { in: projectIds }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        include: {
          user: {
            select: { name: true, role: true }
          },
          project: {
            select: { name: true, jobNumber: true }
          },
          media: {
            select: { fileName: true, mediaType: true, thumbnailUrl: true }
          }
        }
      });

      return { activities };
    } catch (error) {
      fastify.log.error('Failed to get recent activities:', error);
      return reply.code(500).send({ error: 'Failed to get recent activities' });
    }
  });

  // Helper method for activity stats
  fastify.decorate('getActivityStats', async function(projectId) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalActivities, hourly, daily, weekly] = await Promise.all([
      prisma.activity.count({ where: { projectId } }),
      prisma.activity.count({ 
        where: { 
          projectId, 
          createdAt: { gte: oneHourAgo }
        }
      }),
      prisma.activity.count({ 
        where: { 
          projectId, 
          createdAt: { gte: oneDayAgo }
        }
      }),
      prisma.activity.count({ 
        where: { 
          projectId, 
          createdAt: { gte: oneWeekAgo }
        }
      })
    ]);

    // Get activity breakdown by type
    const activityTypes = await prisma.activity.groupBy({
      by: ['activityType'],
      where: { 
        projectId,
        createdAt: { gte: oneDayAgo }
      },
      _count: { activityType: true }
    });

    return {
      total: totalActivities,
      hourly,
      daily,
      weekly,
      breakdown: activityTypes.reduce((acc, item) => {
        acc[item.activityType] = item._count.activityType;
        return acc;
      }, {})
    };
  });
}

module.exports = routes;