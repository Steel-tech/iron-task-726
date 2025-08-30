const MediaUploadService = require('../services/mediaUpload')
const LocalStorageService = require('../services/localStorageService')
const SupabaseStorageService = require('../services/supabaseStorageService')
const { uploadRateLimit } = require('../middleware/rateLimit')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function routes(fastify, options) {
  // Determine which storage service to use
  const useSupabase =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  const useS3 =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_BUCKET_NAME

  let mediaService
  if (useSupabase) {
    mediaService = new SupabaseStorageService(prisma)
    console.log('Using Supabase Storage for media uploads')
  } else if (useS3) {
    mediaService = new MediaUploadService(prisma)
    console.log('Using AWS S3 for media uploads')
  } else {
    mediaService = new LocalStorageService(prisma)
    console.log('Using local file storage for media uploads')
  }

  // Get all media with pagination and filters
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const {
        page = 1,
        limit = 24,
        mediaType,
        activityType,
        startDate,
        endDate,
        userId,
      } = request.query

      try {
        const where = {
          // Only show media from user's company
          project: {
            companyId: request.user.companyId,
          },
        }

        if (mediaType) where.mediaType = mediaType
        if (activityType) where.activityType = activityType
        if (userId) where.userId = userId
        if (startDate || endDate) {
          where.timestamp = {}
          if (startDate) where.timestamp.gte = new Date(startDate)
          if (endDate) where.timestamp.lte = new Date(endDate)
        }

        const [media, total] = await Promise.all([
          prisma.media.findMany({
            where,
            include: {
              project: {
                select: { id: true, name: true },
              },
              user: {
                select: { id: true, name: true },
              },
              mediaTags: {
                include: {
                  tag: true,
                },
              },
              _count: {
                select: { views: true },
              },
            },
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * limit,
            take: parseInt(limit),
          }),
          prisma.media.count({ where }),
        ])

        // Generate signed URLs
        for (const mediaItem of media) {
          mediaItem.fileUrl = await mediaService.getSignedUrl(mediaItem.fileUrl)
          mediaItem.thumbnailUrl = await mediaService.getSignedUrl(mediaItem.thumbnailUrl)
        }

        return reply.send({
          media,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        request.logger.error('Failed to fetch media', {
          error: error.message,
          stack: error.stack,
          filters: { mediaType, activityType, startDate, endDate, userId },
          pagination: { page, limit },
        })
        return reply.code(500).send({
          error: 'Failed to fetch media',
          message: error.message,
        })
      }
    }
  )

  // Upload single media (photo or video)
  fastify.post(
    '/upload',
    {
      preHandler: [fastify.authenticate, uploadRateLimit],
    },
    async (request, reply) => {
      const uploadedFile = await request.file()

      if (!uploadedFile) {
        return reply.code(400).send({ error: 'No file uploaded' })
      }

      // Extract fields from multipart form
      const fields = {}
      for (const [key, value] of Object.entries(uploadedFile.fields)) {
        fields[key] = value.value
      }

      try {
        request.logger.info('Media upload started', {
          projectId: fields.projectId,
          mediaType: fields.mediaType,
          activityType: fields.activityType,
          filename: uploadedFile.filename,
          mimetype: uploadedFile.mimetype,
        })

        const media = await mediaService.uploadMedia(uploadedFile, {
          projectId: fields.projectId,
          userId: request.user.id || request.user.userId, // Handle both id and userId
          activityType: fields.activityType,
          tags: fields.tags ? fields.tags.split(',').map(t => t.trim()) : [],
          location: fields.location,
          notes: fields.notes,
          latitude: fields.latitude,
          longitude: fields.longitude,
          altitude: fields.altitude,
          accuracy: fields.accuracy,
          timestamp: fields.timestamp || new Date().toISOString(),
          address: fields.address,
          mediaType: fields.mediaType,
          isPictureInPicture: fields.isPictureInPicture === 'true',
        })

        // Get signed URLs for immediate display
        const fileUrl = await mediaService.getSignedUrl(media.fileUrl)
        const thumbnailUrl = await mediaService.getSignedUrl(media.thumbnailUrl)

        request.logger.business('Media uploaded successfully', {
          mediaId: media.id,
          projectId: fields.projectId,
          mediaType: fields.mediaType,
          fileSize: uploadedFile.file?._readableState?.length,
        })

        return reply.send({
          ...media,
          fileUrl,
          thumbnailUrl,
        })
      } catch (error) {
        request.logger.error('Media upload failed', {
          error: error.message,
          stack: error.stack,
          projectId: fields.projectId,
          filename: uploadedFile.filename,
          mimetype: uploadedFile.mimetype,
        })
        return reply.code(500).send({
          error: 'Failed to upload media',
          message: error.message,
        })
      }
    }
  )

  // Upload dual camera video (picture-in-picture)
  fastify.post(
    '/upload/dual',
    {
      preHandler: [fastify.authenticate, uploadRateLimit],
    },
    async (request, reply) => {
      const parts = request.parts()
      let frontFile, backFile
      const fields = {}

      for await (const part of parts) {
        if (part.file) {
          if (part.fieldname === 'frontCamera') {
            frontFile = part
          } else if (part.fieldname === 'backCamera') {
            backFile = part
          }
        } else {
          fields[part.fieldname] = part.value
        }
      }

      if (!frontFile || !backFile) {
        return reply.code(400).send({
          error: 'Both front and back camera videos are required',
        })
      }

      try {
        const media = await mediaService.uploadDualCameraVideo(
          frontFile,
          backFile,
          {
            projectId: fields.projectId,
            userId: request.user.id || request.user.userId, // Handle both id and userId
            activityType: fields.activityType,
            tags: fields.tags ? fields.tags.split(',').map(t => t.trim()) : [],
            location: fields.location,
            notes: fields.notes,
            latitude: fields.latitude,
            longitude: fields.longitude,
            altitude: fields.altitude,
            accuracy: fields.accuracy,
            timestamp: fields.timestamp || new Date().toISOString(),
            address: fields.address,
          }
        )

        return reply.send(media)
      } catch (error) {
        request.logger.error('Dual camera upload failed', {
          error: error.message,
          stack: error.stack,
          projectId: fields.projectId,
          hasFrontFile: !!frontFile,
          hasBackFile: !!backFile,
        })
        return reply.code(500).send({
          error: 'Failed to upload dual camera video',
          message: error.message,
        })
      }
    }
  )

  // Batch upload
  fastify.post(
    '/upload/batch',
    {
      preHandler: [fastify.authenticate, uploadRateLimit],
    },
    async (request, reply) => {
      const parts = request.parts()
      const files = []
      const commonFields = {}

      for await (const part of parts) {
        if (part.file) {
          files.push(part)
        } else {
          commonFields[part.fieldname] = part.value
        }
      }

      if (files.length === 0) {
        return reply.code(400).send({ error: 'No files uploaded' })
      }

      if (files.length > 10) {
        return reply
          .code(400)
          .send({ error: 'Maximum 10 files allowed per batch' })
      }

      const results = []
      const errors = []

      for (const file of files) {
        try {
          const media = await mediaService.uploadMedia(file, {
            projectId: commonFields.projectId,
            userId: request.user.id || request.user.userId, // Handle both id and userId
            activityType: commonFields.activityType,
            tags: commonFields.tags
              ? commonFields.tags.split(',').map(t => t.trim())
              : [],
            location: commonFields.location,
            notes: commonFields.notes,
            latitude: commonFields.latitude,
            longitude: commonFields.longitude,
            altitude: commonFields.altitude,
            accuracy: commonFields.accuracy,
            timestamp: commonFields.timestamp,
            address: commonFields.address,
          })

          // Get signed URLs
          media.fileUrl = await mediaService.getSignedUrl(media.fileUrl)
          media.thumbnailUrl = await mediaService.getSignedUrl(
            media.thumbnailUrl
          )

          results.push(media)
        } catch (error) {
          errors.push({
            filename: file.filename,
            error: error.message,
          })
        }
      }

      return reply.send({
        success: results,
        errors: errors,
        total: files.length,
        uploaded: results.length,
        failed: errors.length,
      })
    }
  )

  // Get media for a project
  fastify.get(
    '/project/:projectId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { projectId } = request.params
      const {
        page = 1,
        limit = 24,
        mediaType,
        startDate,
        endDate,
        tags,
        userId,
      } = request.query

      try {
        // Verify user has access to project
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { companyId: request.user.companyId },
              { members: { some: { userId: request.user.userId } } },
            ],
          },
        })

        if (!project) {
          return reply.code(403).send({ error: 'Access denied to project' })
        }

        const where = { projectId }

        if (mediaType) where.mediaType = mediaType
        if (userId) where.userId = userId
        if (tags) where.tags = { hasSome: tags.split(',') }
        if (startDate || endDate) {
          where.timestamp = {}
          if (startDate) where.timestamp.gte = new Date(startDate)
          if (endDate) where.timestamp.lte = new Date(endDate)
        }

        const [media, total] = await Promise.all([
          prisma.media.findMany({
            where,
            include: {
              project: {
                select: { id: true, name: true },
              },
              user: {
                select: { id: true, name: true },
              },
              mediaTags: {
                include: {
                  tag: true,
                },
              },
              _count: {
                select: { views: true },
              },
            },
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * limit,
            take: parseInt(limit),
          }),
          prisma.media.count({ where }),
        ])

        // Generate signed URLs
        for (const mediaItem of media) {
          mediaItem.fileUrl = await mediaService.getSignedUrl(mediaItem.fileUrl)
          mediaItem.thumbnailUrl = await mediaService.getSignedUrl(mediaItem.thumbnailUrl)
        }

        return reply.send({
          media,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        request.logger.error('Failed to fetch project media', {
          error: error.message,
          stack: error.stack,
          projectId,
          filters: { mediaType, startDate, endDate, tags, userId },
        })
        return reply.code(500).send({
          error: 'Failed to fetch media',
          message: error.message,
        })
      }
    }
  )

  // Get single media item
  fastify.get(
    '/:mediaId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { mediaId } = request.params
      const { userId } = request.user

      try {
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
          include: {
            project: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            annotations: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: { views: true },
            },
          },
        })

        if (!media) {
          return reply.code(404).send({ error: 'Media not found' })
        }

        // Record view
        await mediaService.recordView(mediaId, userId)

        // Generate signed URLs
        media.fileUrl = await mediaService.getSignedUrl(media.fileUrl)
        media.thumbnailUrl = await mediaService.getSignedUrl(media.thumbnailUrl)
        if (media.frontCameraUrl) {
          media.frontCameraUrl = await mediaService.getSignedUrl(
            media.frontCameraUrl
          )
        }
        if (media.backCameraUrl) {
          media.backCameraUrl = await mediaService.getSignedUrl(
            media.backCameraUrl
          )
        }

        return reply.send(media)
      } catch (error) {
        request.logger.error('Failed to fetch single media', {
          error: error.message,
          stack: error.stack,
          mediaId,
        })
        return reply.code(500).send({
          error: 'Failed to fetch media',
          message: error.message,
        })
      }
    }
  )

  // Update media metadata
  fastify.patch(
    '/:mediaId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { mediaId } = request.params
      const { tags, location, notes, activityType } = request.body
      const { userId, role } = request.user

      try {
        // Check if user can edit
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
        })

        if (!media) {
          return reply.code(404).send({ error: 'Media not found' })
        }

        if (
          media.userId !== userId &&
          role !== 'ADMIN' &&
          role !== 'PROJECT_MANAGER'
        ) {
          return reply.code(403).send({ error: 'Unauthorized' })
        }

        const updated = await prisma.media.update({
          where: { id: mediaId },
          data: {
            tags,
            location,
            notes,
            activityType,
          },
        })

        return reply.send(updated)
      } catch (error) {
        request.logger.error('Failed to update media', {
          error: error.message,
          stack: error.stack,
          mediaId,
          updateData: { tags, location, notes, activityType },
        })
        return reply.code(500).send({
          error: 'Failed to update media',
          message: error.message,
        })
      }
    }
  )

  // Delete media
  fastify.delete(
    '/:mediaId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { mediaId } = request.params
      const { userId, role } = request.user

      try {
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
        })

        if (!media) {
          return reply.code(404).send({ error: 'Media not found' })
        }

        if (
          media.userId !== userId &&
          role !== 'ADMIN' &&
          role !== 'PROJECT_MANAGER'
        ) {
          return reply.code(403).send({ error: 'Unauthorized' })
        }

        await mediaService.deleteMedia(mediaId, userId)

        return reply.send({ message: 'Media deleted successfully' })
      } catch (error) {
        request.logger.error('Failed to delete media', {
          error: error.message,
          stack: error.stack,
          mediaId,
        })
        return reply.code(500).send({
          error: 'Failed to delete media',
          message: error.message,
        })
      }
    }
  )

  // Get media by location
  fastify.post(
    '/search/location',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { latitude, longitude, radius = 1000, projectId } = request.body

      try {
        // This would use PostGIS functions to find media within radius
        const media = await prisma.$queryRaw`
        SELECT * FROM media 
        WHERE ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radius}
        )
        ${projectId ? prisma.$queryRaw`AND project_id = ${projectId}` : prisma.$queryRaw``}
        ORDER BY timestamp DESC
        LIMIT 100
      `

        return reply.send(media)
      } catch (error) {
        request.logger.error('Failed to search by location', {
          error: error.message,
          stack: error.stack,
          searchParams: { latitude, longitude, radius, projectId },
        })
        return reply.code(500).send({
          error: 'Failed to search by location',
          message: error.message,
        })
      }
    }
  )

  // Serve local files (only when using local storage)
  if (!useSupabase && !useS3) {
    const path = require('path')
    const fs = require('fs').promises

    fastify.get('/file/*', async (request, reply) => {
      const filePath = request.params['*']
      const fullPath = path.join(process.cwd(), 'uploads', filePath)

      try {
        // Security check - prevent directory traversal
        const normalizedPath = path.normalize(fullPath)
        const uploadsDir = path.join(process.cwd(), 'uploads')

        if (!normalizedPath.startsWith(uploadsDir)) {
          return reply.code(403).send({ error: 'Access denied' })
        }

        // Check if file exists
        await fs.access(fullPath)

        // Get file extension for content type
        const ext = path.extname(fullPath).toLowerCase()
        const contentTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.mov': 'video/quicktime',
        }

        const contentType = contentTypes[ext] || 'application/octet-stream'

        return reply
          .type(contentType)
          .sendFile(filePath, path.join(process.cwd(), 'uploads'))
      } catch (error) {
        return reply.code(404).send({ error: 'File not found' })
      }
    })
  }
}

module.exports = routes
