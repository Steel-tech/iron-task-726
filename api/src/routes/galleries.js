const crypto = require('crypto');

module.exports = async function galleryRoutes(fastify, opts) {
  const authenticate = fastify.authenticate;
  
  // Create gallery
  fastify.post(
    '/galleries',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId, name, description, mediaIds, settings = {} } = request.body
      
      // Verify user has access to project
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { companyId: request.user.companyId },
            { members: { some: { userId: request.user.id } } }
          ]
        }
      })
      
      if (!project) {
        return reply.code(403).send({ error: 'Access denied to project' })
      }
      
      // Verify media belongs to project
      const mediaCount = await fastify.prisma.media.count({
        where: {
          id: { in: mediaIds },
          projectId
        }
      })
      
      if (mediaCount !== mediaIds.length) {
        return reply.code(400).send({ error: 'Invalid media selection' })
      }
      
      // Create gallery with items
      const gallery = await fastify.prisma.gallery.create({
        data: {
          projectId,
          createdById: request.user.id,
          name,
          description,
          shareToken: crypto.randomBytes(16).toString('hex'),
          isPublic: settings.isPublic || false,
          password: settings.password ? await fastify.bcrypt.hash(settings.password) : null,
          expiresAt: settings.expiresAt ? new Date(settings.expiresAt) : null,
          brandLogo: settings.brandLogo,
          brandColor: settings.brandColor,
          watermark: settings.watermark !== false,
          items: {
            create: mediaIds.map((mediaId, index) => ({
              mediaId,
              order: index,
              caption: settings.captions?.[mediaId]
            }))
          }
        },
        include: {
          items: {
            include: {
              media: true
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { views: true }
          }
        }
      })
      
      // Log activity
      await fastify.prisma.activity.create({
        data: {
          projectId,
          userId: request.user.id,
          type: 'gallery_created',
          data: { galleryId: gallery.id, name: gallery.name }
        }
      })
      
      return {
        ...gallery,
        shareUrl: `${process.env.PUBLIC_URL}/gallery/${gallery.shareToken}`
      }
    }
  )
  
  // Get project galleries
  fastify.get(
    '/projects/:projectId/galleries',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId } = request.params
      const { page = 1, limit = 20 } = request.query
      
      // Verify access
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { companyId: request.user.companyId },
            { members: { some: { userId: request.user.id } } }
          ]
        }
      })
      
      if (!project) {
        return reply.code(403).send({ error: 'Access denied' })
      }
      
      const galleries = await fastify.prisma.gallery.findMany({
        where: { projectId },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { items: true, views: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
      
      const total = await fastify.prisma.gallery.count({
        where: { projectId }
      })
      
      return {
        galleries: galleries.map(g => ({
          ...g,
          shareUrl: `${process.env.PUBLIC_URL}/gallery/${g.shareToken}`
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  )
  
  // Get gallery details
  fastify.get(
    '/galleries/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params
      
      const gallery = await fastify.prisma.gallery.findFirst({
        where: {
          id,
          project: {
            OR: [
              { companyId: request.user.companyId },
              { members: { some: { userId: request.user.id } } }
            ]
          }
        },
        include: {
          project: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          items: {
            include: {
              media: {
                include: {
                  user: {
                    select: { id: true, name: true }
                  }
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { views: true }
          }
        }
      })
      
      if (!gallery) {
        return reply.code(404).send({ error: 'Gallery not found' })
      }
      
      return {
        ...gallery,
        shareUrl: `${process.env.PUBLIC_URL}/gallery/${gallery.shareToken}`
      }
    }
  )
  
  // Update gallery
  fastify.patch(
    '/galleries/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params
      const updates = request.body
      
      // Verify ownership or admin
      const gallery = await fastify.prisma.gallery.findFirst({
        where: {
          id,
          OR: [
            { createdById: request.user.id },
            {
              project: {
                companyId: request.user.companyId,
                members: {
                  some: {
                    userId: request.user.id,
                    role: { in: ['ADMIN', 'PROJECT_MANAGER'] }
                  }
                }
              }
            }
          ]
        }
      })
      
      if (!gallery) {
        return reply.code(403).send({ error: 'Access denied' })
      }
      
      // Handle password update
      if (updates.password !== undefined) {
        updates.password = updates.password 
          ? await fastify.bcrypt.hash(updates.password)
          : null
      }
      
      // Handle media updates
      if (updates.mediaIds) {
        // Verify media belongs to project
        const mediaCount = await fastify.prisma.media.count({
          where: {
            id: { in: updates.mediaIds },
            projectId: gallery.projectId
          }
        })
        
        if (mediaCount !== updates.mediaIds.length) {
          return reply.code(400).send({ error: 'Invalid media selection' })
        }
        
        // Delete existing items and create new ones
        await fastify.prisma.galleryItem.deleteMany({
          where: { galleryId: id }
        })
        
        await fastify.prisma.galleryItem.createMany({
          data: updates.mediaIds.map((mediaId, index) => ({
            galleryId: id,
            mediaId,
            order: index,
            caption: updates.captions?.[mediaId]
          }))
        })
        
        delete updates.mediaIds
        delete updates.captions
      }
      
      const updated = await fastify.prisma.gallery.update({
        where: { id },
        data: updates,
        include: {
          items: {
            include: {
              media: true
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { views: true }
          }
        }
      })
      
      return {
        ...updated,
        shareUrl: `${process.env.PUBLIC_URL}/gallery/${updated.shareToken}`
      }
    }
  )
  
  // Delete gallery
  fastify.delete(
    '/galleries/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params
      
      // Verify ownership or admin
      const gallery = await fastify.prisma.gallery.findFirst({
        where: {
          id,
          OR: [
            { createdById: request.user.id },
            {
              project: {
                companyId: request.user.companyId,
                members: {
                  some: {
                    userId: request.user.id,
                    role: { in: ['ADMIN', 'PROJECT_MANAGER'] }
                  }
                }
              }
            }
          ]
        }
      })
      
      if (!gallery) {
        return reply.code(403).send({ error: 'Access denied' })
      }
      
      await fastify.prisma.gallery.delete({
        where: { id }
      })
      
      return { success: true }
    }
  )
  
  // Public gallery view (no auth required)
  fastify.get(
    '/public/gallery/:shareToken',
    async (request, reply) => {
      const { shareToken } = request.params
      const { password } = request.query
      
      const gallery = await fastify.prisma.gallery.findUnique({
        where: { shareToken },
        include: {
          project: {
            select: { name: true }
          },
          items: {
            include: {
              media: {
                select: {
                  id: true,
                  fileUrl: true,
                  thumbnailUrl: true,
                  mediaType: true,
                  width: true,
                  height: true,
                  duration: true,
                  timestamp: true,
                  location: true,
                  notes: true
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      })
      
      if (!gallery) {
        return reply.code(404).send({ error: 'Gallery not found' })
      }
      
      // Check expiration
      if (gallery.expiresAt && new Date() > gallery.expiresAt) {
        return reply.code(410).send({ error: 'Gallery has expired' })
      }
      
      // Check password
      if (gallery.password) {
        if (!password) {
          return reply.code(401).send({ error: 'Password required' })
        }
        
        const isValid = await fastify.bcrypt.compare(password, gallery.password)
        if (!isValid) {
          return reply.code(401).send({ error: 'Invalid password' })
        }
      }
      
      // Track view
      const viewerIp = request.ip
      await fastify.prisma.galleryView.create({
        data: {
          galleryId: gallery.id,
          viewerIp,
          viewerInfo: {
            userAgent: request.headers['user-agent'],
            referrer: request.headers.referer
          }
        }
      })
      
      // Increment view count
      await fastify.prisma.gallery.update({
        where: { id: gallery.id },
        data: { viewCount: { increment: 1 } }
      })
      
      // Generate signed URLs for media
      const { getSignedUrl } = require('../services/media');
      const itemsWithUrls = await Promise.all(
        gallery.items.map(async (item) => ({
          ...item,
          media: {
            ...item.media,
            fileUrl: await getSignedUrl(item.media.fileUrl),
            thumbnailUrl: item.media.thumbnailUrl 
              ? await getSignedUrl(item.media.thumbnailUrl)
              : null
          }
        }))
      )
      
      return {
        id: gallery.id,
        name: gallery.name,
        description: gallery.description,
        projectName: gallery.project.name,
        brandLogo: gallery.brandLogo,
        brandColor: gallery.brandColor,
        watermark: gallery.watermark,
        items: itemsWithUrls,
        viewCount: gallery.viewCount
      }
    }
  )
  
  // Gallery analytics
  fastify.get(
    '/galleries/:id/analytics',
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.params
      const { days = 30 } = request.query
      
      // Verify access
      const gallery = await fastify.prisma.gallery.findFirst({
        where: {
          id,
          project: {
            OR: [
              { companyId: request.user.companyId },
              { members: { some: { userId: request.user.id } } }
            ]
          }
        }
      })
      
      if (!gallery) {
        return reply.code(403).send({ error: 'Access denied' })
      }
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      // Get view stats
      const views = await fastify.prisma.galleryView.groupBy({
        by: ['viewedAt'],
        where: {
          galleryId: id,
          viewedAt: { gte: startDate }
        },
        _count: true
      })
      
      // Get unique viewers
      const uniqueViewers = await fastify.prisma.galleryView.groupBy({
        by: ['viewerIp'],
        where: {
          galleryId: id,
          viewedAt: { gte: startDate }
        },
        _count: true
      })
      
      // Get referrers
      const referrers = await fastify.prisma.$queryRaw`
        SELECT 
          viewerInfo->>'referrer' as referrer,
          COUNT(*) as count
        FROM "GalleryView"
        WHERE "galleryId" = ${id}
          AND "viewedAt" >= ${startDate}
          AND viewerInfo->>'referrer' IS NOT NULL
        GROUP BY viewerInfo->>'referrer'
        ORDER BY count DESC
        LIMIT 10
      `
      
      return {
        totalViews: gallery.viewCount,
        periodViews: views.length,
        uniqueViewers: uniqueViewers.length,
        viewsByDay: views,
        topReferrers: referrers
      }
    }
  )
};