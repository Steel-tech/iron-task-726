import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../lib/auth'
import { translateText } from '../lib/translations'
import { sendNotification } from '../lib/notifications'
import { emitToProject } from '../lib/websocket'

const createCommentSchema = z.object({
  content: z.string().min(1),
  mediaId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  mentions: z.array(z.string().uuid()).optional(),
})

const updateCommentSchema = z.object({
  content: z.string().min(1),
})

const addReactionSchema = z.object({
  type: z.enum(['like', 'thumbsup', 'thumbsdown', 'question', 'check']),
})

export async function commentRoutes(fastify: FastifyInstance) {
  // Get comments for a media item
  fastify.get('/media/:mediaId/comments', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { mediaId } = request.params as { mediaId: string }
      const { lang = 'en' } = request.query as { lang?: string }

      const comments = await prisma.comment.findMany({
        where: { mediaId, parentId: null },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
          reactions: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true, role: true },
              },
              reactions: {
                include: {
                  user: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Return translated comments based on user's language preference
      const translatedComments = comments.map(comment => ({
        ...comment,
        content: getTranslatedContent(comment, lang),
        replies: comment.replies.map(reply => ({
          ...reply,
          content: getTranslatedContent(reply, lang),
        })),
      }))

      return reply.send(translatedComments)
    },
  })

  // Create a new comment
  fastify.post('/comments', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const data = createCommentSchema.parse(request.body)
      const userId = request.user!.id

      // Get user's browser language for original language detection
      const userLang = (request.headers['accept-language'] || 'en')
        .split(',')[0]
        .split('-')[0]

      // Get the media item to find project
      const media = await prisma.media.findUnique({
        where: { id: data.mediaId },
        include: { project: true },
      })

      if (!media) {
        return reply.code(404).send({ error: 'Media not found' })
      }

      // Create translations for common languages
      const translations = await createTranslations(data.content, userLang)

      // Create the comment
      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          originalLang: userLang,
          translations,
          mediaId: data.mediaId,
          userId,
          parentId: data.parentId,
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

        for (const mentionedUserId of data.mentions) {
          await sendNotification({
            userId: mentionedUserId,
            type: 'mention',
            title: 'You were mentioned',
            message: `${user?.name} mentioned you in a comment`,
            data: {
              mediaId: data.mediaId,
              commentId: comment.id,
              projectId: media.projectId,
            },
          })
        }
      }

      // Send notification to parent comment author if this is a reply
      if (data.parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: data.parentId },
          select: { userId: true },
        })

        if (parentComment && parentComment.userId !== userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          })

          await sendNotification({
            userId: parentComment.userId,
            type: 'reply',
            title: 'New reply to your comment',
            message: `${user?.name} replied to your comment`,
            data: {
              mediaId: data.mediaId,
              commentId: comment.id,
              projectId: media.projectId,
            },
          })
        }
      }

      // Emit real-time update
      emitToProject(media.projectId, 'comment:created', {
        comment,
        mediaId: data.mediaId,
      })

      return reply.code(201).send(comment)
    },
  })

  // Update a comment
  fastify.patch('/comments/:id', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const data = updateCommentSchema.parse(request.body)
      const userId = request.user!.id

      // Check if user owns the comment
      const existingComment = await prisma.comment.findUnique({
        where: { id },
        include: { media: true },
      })

      if (!existingComment) {
        return reply.code(404).send({ error: 'Comment not found' })
      }

      if (existingComment.userId !== userId) {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      // Update translations
      const translations = await createTranslations(
        data.content,
        existingComment.originalLang
      )

      const comment = await prisma.comment.update({
        where: { id },
        data: {
          content: data.content,
          translations,
        },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      })

      // Emit real-time update
      emitToProject(existingComment.media.projectId, 'comment:updated', {
        comment,
        mediaId: existingComment.mediaId,
      })

      return reply.send(comment)
    },
  })

  // Delete a comment
  fastify.delete('/comments/:id', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = request.user!.id

      // Check if user owns the comment or is an admin
      const comment = await prisma.comment.findUnique({
        where: { id },
        include: { media: true },
      })

      if (!comment) {
        return reply.code(404).send({ error: 'Comment not found' })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (comment.userId !== userId && user?.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      await prisma.comment.delete({ where: { id } })

      // Emit real-time update
      emitToProject(comment.media.projectId, 'comment:deleted', {
        commentId: id,
        mediaId: comment.mediaId,
      })

      return reply.code(204).send()
    },
  })

  // Add reaction to a comment
  fastify.post('/comments/:id/reactions', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const { type } = addReactionSchema.parse(request.body)
      const userId = request.user!.id

      const comment = await prisma.comment.findUnique({
        where: { id },
        include: { media: true },
      })

      if (!comment) {
        return reply.code(404).send({ error: 'Comment not found' })
      }

      try {
        const reaction = await prisma.reaction.create({
          data: {
            type,
            commentId: id,
            userId,
          },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        })

        // Send notification to comment author
        if (comment.userId !== userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          })

          await sendNotification({
            userId: comment.userId,
            type: 'reaction',
            title: 'New reaction to your comment',
            message: `${user?.name} reacted with ${type}`,
            data: {
              mediaId: comment.mediaId,
              commentId: comment.id,
              projectId: comment.media.projectId,
            },
          })
        }

        // Emit real-time update
        emitToProject(comment.media.projectId, 'reaction:added', {
          reaction,
          commentId: id,
          mediaId: comment.mediaId,
        })

        return reply.code(201).send(reaction)
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(409).send({ error: 'Reaction already exists' })
        }
        throw error
      }
    },
  })

  // Remove reaction from a comment
  fastify.delete('/comments/:id/reactions/:type', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const { id, type } = request.params as { id: string; type: string }
      const userId = request.user!.id

      const comment = await prisma.comment.findUnique({
        where: { id },
        include: { media: true },
      })

      if (!comment) {
        return reply.code(404).send({ error: 'Comment not found' })
      }

      await prisma.reaction.delete({
        where: {
          commentId_userId_type: {
            commentId: id,
            userId,
            type,
          },
        },
      })

      // Emit real-time update
      emitToProject(comment.media.projectId, 'reaction:removed', {
        commentId: id,
        type,
        userId,
        mediaId: comment.mediaId,
      })

      return reply.code(204).send()
    },
  })
}

// Helper functions
function getTranslatedContent(comment: any, targetLang: string): string {
  if (comment.originalLang === targetLang) {
    return comment.content
  }

  const translations = comment.translations as any
  if (translations && translations[targetLang]) {
    return translations[targetLang]
  }

  return comment.content // Fallback to original
}

async function createTranslations(
  content: string,
  sourceLang: string
): Promise<any> {
  // Translate to common languages used in construction
  const targetLanguages = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko']
  const translations: any = {}

  for (const lang of targetLanguages) {
    if (lang !== sourceLang) {
      try {
        translations[lang] = await translateText(content, sourceLang, lang)
      } catch (error) {
        console.error(`Failed to translate to ${lang}:`, error)
        translations[lang] = content // Fallback to original
      }
    }
  }

  return translations
}
