const { z } = require('zod');
const { validate } = require('../middleware/validation');

// Validation schemas
const getNotificationsSchema = {
  querystring: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10)
  })
};

async function routes(fastify, options) {
  // GET /notifications - Get user notifications
  fastify.get('/notifications', {
    preHandler: [
      fastify.authenticate,
      validate(getNotificationsSchema)
    ]
  }, async (request, reply) => {
    try {
      const { limit } = request.query;
      const userId = request.user.id;

      // Log the request for debugging
      fastify.log.info('Getting notifications', {
        userId,
        limit
      });

      // Mock response for now - replace with actual database queries later
      const mockResponse = {
        notifications: [
          // Example notification structure (commented out for empty mock)
          // {
          //   id: 'notif_1',
          //   userId: userId,
          //   type: 'project_update',
          //   title: 'New project update',
          //   message: 'Your project has been updated',
          //   isRead: false,
          //   createdAt: new Date().toISOString(),
          //   data: { projectId: 'project_1' }
          // }
        ],
        unreadCount: 0,
        total: 0,
        limit,
        hasMore: false
      };

      return reply.send(mockResponse);
    } catch (error) {
      fastify.log.error('Error getting notifications', {
        error: error.message,
        userId: request.user.id,
        stack: error.stack
      });
      return reply.code(500).send({ 
        error: 'Failed to get notifications' 
      });
    }
  });

  // GET /notifications/unread-count - Get unread notification count
  fastify.get('/notifications/unread-count', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      fastify.log.info('Getting unread notification count', { userId });

      // Mock response - always return 0 for now
      return reply.send({ 
        unreadCount: 0 
      });
    } catch (error) {
      fastify.log.error('Error getting unread notification count', {
        error: error.message,
        userId: request.user.id,
        stack: error.stack
      });
      return reply.code(500).send({ 
        error: 'Failed to get unread notification count' 
      });
    }
  });

  // POST /notifications/mark-read - Mark notifications as read
  fastify.post('/notifications/mark-read', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { notificationIds } = request.body || {};

      fastify.log.info('Marking notifications as read', {
        userId,
        notificationIds
      });

      // Mock success response
      return reply.send({ 
        success: true,
        message: 'Notifications marked as read'
      });
    } catch (error) {
      fastify.log.error('Error marking notifications as read', {
        error: error.message,
        userId: request.user.id,
        stack: error.stack
      });
      return reply.code(500).send({ 
        error: 'Failed to mark notifications as read' 
      });
    }
  });
}

module.exports = routes;