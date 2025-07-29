import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../lib/auth'
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount 
} from '../lib/notifications'

const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional()
})

export async function notificationRoutes(fastify: FastifyInstance) {
  // Get user notifications
  fastify.get('/notifications', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const userId = request.user!.id
      const { limit = 20, offset = 0 } = request.query as { limit?: number; offset?: number }
      
      const result = await getUserNotifications(userId, limit, offset)
      return reply.send(result)
    }
  })
  
  // Get unread notification count
  fastify.get('/notifications/unread-count', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const userId = request.user!.id
      const count = await getUnreadNotificationCount(userId)
      return reply.send({ count })
    }
  })
  
  // Mark notifications as read
  fastify.post('/notifications/mark-read', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const userId = request.user!.id
      const { notificationIds } = markReadSchema.parse(request.body)
      
      if (notificationIds && notificationIds.length > 0) {
        // Mark specific notifications as read
        await Promise.all(
          notificationIds.map(id => markNotificationAsRead(id, userId))
        )
      } else {
        // Mark all as read
        await markAllNotificationsAsRead(userId)
      }
      
      return reply.send({ success: true })
    }
  })
  
  // Mark a single notification as read
  fastify.patch('/notifications/:id/read', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = request.user!.id
      
      try {
        const notification = await markNotificationAsRead(id, userId)
        return reply.send(notification)
      } catch (error: any) {
        return reply.code(404).send({ error: error.message })
      }
    }
  })
}