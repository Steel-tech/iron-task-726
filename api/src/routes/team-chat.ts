import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../lib/auth'
import { translateText, getUserLanguage } from '../lib/translations'
import { sendNotification } from '../lib/notifications'
import { emitToProject } from '../lib/websocket'

const sendMessageSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1),
  mentions: z.array(z.string().uuid()).optional(),
})

export async function teamChatRoutes(fastify: FastifyInstance) {
  // Get team chat messages for a project
  fastify.get('/projects/:projectId/chat', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const { limit = 50, before } = request.query as {
        limit?: number
        before?: string
      }
      const userId = request.user!.id

      // Check if user is a member of the project
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId },
        },
      })

      if (!member) {
        return reply.code(403).send({ error: 'Not a project member' })
      }

      const userLang = getUserLanguage(request.headers['accept-language'])

      const messages = await prisma.teamChat.findMany({
        where: {
          projectId,
          ...(before && { createdAt: { lt: new Date(before) } }),
        },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      // Translate messages to user's language
      const translatedMessages = messages.map(msg => ({
        ...msg,
        message: getTranslatedMessage(msg, userLang),
      }))

      return reply.send(translatedMessages.reverse())
    },
  })

  // Send a team chat message
  fastify.post('/team-chat', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const data = sendMessageSchema.parse(request.body)
      const userId = request.user!.id

      // Check if user is a member of the project
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: data.projectId, userId },
        },
      })

      if (!member) {
        return reply.code(403).send({ error: 'Not a project member' })
      }

      const userLang = getUserLanguage(request.headers['accept-language'])

      // Create translations
      const translations = await createTranslations(data.message, userLang)

      // Create the message
      const message = await prisma.teamChat.create({
        data: {
          projectId: data.projectId,
          userId,
          message: data.message,
          originalLang: userLang,
          translations,
          mentions: data.mentions || [],
        },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      })

      // Send notifications to mentioned users
      if (data.mentions && data.mentions.length > 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        })

        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
          select: { name: true },
        })

        for (const mentionedUserId of data.mentions) {
          await sendNotification({
            userId: mentionedUserId,
            type: 'mention',
            title: 'You were mentioned in team chat',
            message: `${user?.name} mentioned you in ${project?.name}`,
            data: {
              projectId: data.projectId,
              messageId: message.id,
            },
          })
        }
      }

      // Emit real-time update
      emitToProject(data.projectId, 'teamchat:message', message)

      return reply.code(201).send(message)
    },
  })

  // Get online team members
  fastify.get('/projects/:projectId/online-members', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const userId = request.user!.id

      // Check if user is a member of the project
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId },
        },
      })

      if (!member) {
        return reply.code(403).send({ error: 'Not a project member' })
      }

      // This would integrate with the WebSocket service
      // For now, return all project members
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      })

      return reply.send(
        members.map(m => ({
          ...m.user,
          online: false, // Would check WebSocket connections
        }))
      )
    },
  })
}

function getTranslatedMessage(message: any, targetLang: string): string {
  if (message.originalLang === targetLang) {
    return message.message
  }

  const translations = message.translations as any
  if (translations && translations[targetLang]) {
    return translations[targetLang]
  }

  return message.message // Fallback to original
}

async function createTranslations(
  content: string,
  sourceLang: string
): Promise<any> {
  const targetLanguages = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko']
  const translations: any = {}

  for (const lang of targetLanguages) {
    if (lang !== sourceLang) {
      try {
        translations[lang] = await translateText(content, sourceLang, lang)
      } catch (error) {
        console.error(`Failed to translate to ${lang}:`, error)
        translations[lang] = content
      }
    }
  }

  return translations
}
