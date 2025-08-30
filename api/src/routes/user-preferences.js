const { validate } = require('../middleware/validation')
const { z } = require('zod')
const prisma = require('../lib/prisma')

// Validation schemas
const preferencesSchema = {
  body: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    notificationTypes: z
      .object({
        mentions: z.boolean().optional(),
        comments: z.boolean().optional(),
        replies: z.boolean().optional(),
        reactions: z.boolean().optional(),
        projectUpdates: z.boolean().optional(),
        dailyDigest: z.boolean().optional(),
      })
      .optional(),
    feedSettings: z
      .object({
        showStarredOnly: z.boolean().optional(),
        autoRefresh: z.boolean().optional(),
        compactView: z.boolean().optional(),
      })
      .optional(),
  }),
}

async function routes(fastify, options) {
  // Get user preferences
  fastify.get(
    '/preferences',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        let preferences = await prisma.feedPreferences.findUnique({
          where: { userId: request.user.id },
        })

        // Create default preferences if none exist
        if (!preferences) {
          preferences = await prisma.feedPreferences.create({
            data: {
              userId: request.user.id,
              emailNotifications: true,
              pushNotifications: true,
              notificationTypes: {
                mentions: true,
                comments: true,
                replies: true,
                reactions: true,
                projectUpdates: true,
                dailyDigest: false,
              },
              feedSettings: {
                showStarredOnly: false,
                autoRefresh: true,
                compactView: false,
              },
            },
          })
        }

        return preferences
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: 'Failed to fetch preferences',
        })
      }
    }
  )

  // Update user preferences
  fastify.put(
    '/preferences',
    {
      preHandler: [fastify.authenticate, validate(preferencesSchema)],
    },
    async (request, reply) => {
      try {
        const {
          emailNotifications,
          pushNotifications,
          notificationTypes,
          feedSettings,
        } = request.body

        // Check if preferences exist
        const existing = await prisma.feedPreferences.findUnique({
          where: { userId: request.user.id },
        })

        const data = {}

        // Only update provided fields
        if (emailNotifications !== undefined)
          data.emailNotifications = emailNotifications
        if (pushNotifications !== undefined)
          data.pushNotifications = pushNotifications

        if (notificationTypes) {
          data.notificationTypes = existing
            ? { ...existing.notificationTypes, ...notificationTypes }
            : notificationTypes
        }

        if (feedSettings) {
          data.feedSettings = existing
            ? { ...existing.feedSettings, ...feedSettings }
            : feedSettings
        }

        let preferences
        if (existing) {
          preferences = await prisma.feedPreferences.update({
            where: { userId: request.user.id },
            data,
          })
        } else {
          preferences = await prisma.feedPreferences.create({
            data: {
              userId: request.user.id,
              ...data,
            },
          })
        }

        return preferences
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: 'Failed to update preferences',
        })
      }
    }
  )

  // Get notification settings specifically
  fastify.get(
    '/notification-settings',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const preferences = await prisma.feedPreferences.findUnique({
          where: { userId: request.user.id },
          select: {
            emailNotifications: true,
            pushNotifications: true,
            notificationTypes: true,
          },
        })

        // Get push subscription count
        const pushSubscriptionCount = await prisma.pushSubscription.count({
          where: { userId: request.user.id },
        })

        return {
          emailEnabled: preferences?.emailNotifications !== false,
          pushEnabled: preferences?.pushNotifications !== false,
          pushSubscriptionCount,
          notificationTypes: preferences?.notificationTypes || {
            mentions: true,
            comments: true,
            replies: true,
            reactions: true,
            projectUpdates: true,
            dailyDigest: false,
          },
        }
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: 'Failed to fetch notification settings',
        })
      }
    }
  )
}

module.exports = routes
