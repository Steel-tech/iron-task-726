const pushNotificationService = require('../services/pushNotificationService')
const { validate } = require('../middleware/validation')
const { z } = require('zod')

// Validation schemas
const subscriptionSchema = {
  body: z.object({
    subscription: z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
      expirationTime: z.number().nullable().optional(),
    }),
    deviceName: z.string().optional(),
  }),
}

async function routes(fastify, options) {
  // Get VAPID public key for client
  fastify.get('/vapid-public-key', async (request, reply) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY

    if (!publicKey) {
      return reply.code(503).send({
        error: 'Push notifications not configured',
      })
    }

    return { publicKey }
  })

  // Subscribe to push notifications
  fastify.post(
    '/subscribe',
    {
      preHandler: [fastify.authenticate, validate(subscriptionSchema)],
    },
    async (request, reply) => {
      const { subscription, deviceName } = request.body

      try {
        const result = await pushNotificationService.subscribeUser(
          request.user.id,
          subscription,
          deviceName || request.headers['user-agent']
        )

        return {
          success: true,
          subscription: {
            id: result.id,
            deviceName: result.deviceName,
          },
        }
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: 'Failed to subscribe to push notifications',
        })
      }
    }
  )

  // Unsubscribe from push notifications
  fastify.delete(
    '/unsubscribe',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { endpoint } = request.body

      if (!endpoint) {
        return reply.code(400).send({
          error: 'Endpoint is required',
        })
      }

      try {
        await pushNotificationService.unsubscribeUser(request.user.id, endpoint)

        return { success: true }
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: 'Failed to unsubscribe from push notifications',
        })
      }
    }
  )

  // Get user's push subscriptions
  fastify.get(
    '/subscriptions',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const subscriptions =
          await pushNotificationService.getUserSubscriptions(request.user.id)

        return { subscriptions }
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: 'Failed to fetch push subscriptions',
        })
      }
    }
  )

  // Test push notification (development only)
  if (process.env.NODE_ENV !== 'production') {
    fastify.post(
      '/test',
      {
        preHandler: [fastify.authenticate],
      },
      async (request, reply) => {
        try {
          const testNotification = {
            id: 'test-' + Date.now(),
            title: 'Test Notification',
            message: 'This is a test push notification from Iron Task',
            type: 'test',
            url: '/notifications',
          }

          const results = await pushNotificationService.sendToUser(
            request.user.id,
            testNotification
          )

          return {
            success: true,
            results,
          }
        } catch (error) {
          fastify.log.error(error)
          return reply.code(500).send({
            error: 'Failed to send test notification',
          })
        }
      }
    )
  }
}

module.exports = routes
