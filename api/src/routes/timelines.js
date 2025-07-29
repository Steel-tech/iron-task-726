const crypto = require('crypto');

module.exports = async function timelineRoutes(fastify, opts) {
  const authenticate = fastify.authenticate;
  
  // Create or update project timeline
  fastify.post(
    '/projects/:projectId/timeline',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId } = request.params
      const settings = request.body
      
      // Verify user has access to project
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { companyId: request.user.companyId },
            { 
              members: { 
                some: { 
                  userId: request.user.id,
                  role: { in: ['ADMIN', 'PROJECT_MANAGER', 'FOREMAN'] }
                } 
              } 
            }
          ]
        }
      })
      
      if (!project) {
        return reply.code(403).send({ error: 'Access denied to project' })
      }
      
      // Check if timeline exists
      let timeline = await fastify.prisma.projectTimeline.findUnique({
        where: { projectId }
      })
      
      if (timeline) {
        // Update existing timeline
        if (settings.password !== undefined) {
          settings.password = settings.password 
            ? await fastify.bcrypt.hash(settings.password)
            : null
        }
        
        timeline = await fastify.prisma.projectTimeline.update({
          where: { projectId },
          data: settings
        })
      } else {
        // Create new timeline
        timeline = await fastify.prisma.projectTimeline.create({
          data: {
            projectId,
            shareToken: crypto.randomBytes(16).toString('hex'),
            isPublic: settings.isPublic || false,
            password: settings.password ? await fastify.bcrypt.hash(settings.password) : null,
            showAllMedia: settings.showAllMedia !== false,
            mediaTypes: settings.mediaTypes || ['PHOTO', 'VIDEO'],
            activityTypes: settings.activityTypes || [],
            brandLogo: settings.brandLogo,
            brandColor: settings.brandColor,
            title: settings.title || project.name,
            description: settings.description
          }
        })
        
        // Log activity
        await fastify.prisma.activity.create({
          data: {
            projectId,
            userId: request.user.id,
            type: 'timeline_created',
            data: { timelineId: timeline.id }
          }
        })
      }
      
      return {
        ...timeline,
        shareUrl: `${process.env.PUBLIC_URL}/timeline/${timeline.shareToken}`
      }
    }
  )
  
  // Get project timeline settings
  fastify.get(
    '/projects/:projectId/timeline',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId } = request.params
      
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
      
      const timeline = await fastify.prisma.projectTimeline.findUnique({
        where: { projectId },
        include: {
          _count: {
            select: { views: true }
          }
        }
      })
      
      if (!timeline) {
        return reply.code(404).send({ error: 'Timeline not configured' })
      }
      
      return {
        ...timeline,
        shareUrl: `${process.env.PUBLIC_URL}/timeline/${timeline.shareToken}`
      }
    }
  )
  
  // Delete project timeline
  fastify.delete(
    '/projects/:projectId/timeline',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId } = request.params
      
      // Verify admin or project manager access
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { companyId: request.user.companyId },
            { 
              members: { 
                some: { 
                  userId: request.user.id,
                  role: { in: ['ADMIN', 'PROJECT_MANAGER'] }
                } 
              } 
            }
          ]
        }
      })
      
      if (!project) {
        return reply.code(403).send({ error: 'Access denied' })
      }
      
      await fastify.prisma.projectTimeline.delete({
        where: { projectId }
      })
      
      return { success: true }
    }
  )
  
  // Public timeline view (no auth required)
  fastify.get(
    '/public/timeline/:shareToken',
    async (request, reply) => {
      const { shareToken } = request.params
      const { password, page = 1, limit = 20 } = request.query
      
      const timeline = await fastify.prisma.projectTimeline.findUnique({
        where: { shareToken },
        include: {
          project: {
            select: { 
              name: true,
              location: true,
              status: true
            }
          }
        }
      })
      
      if (!timeline) {
        return reply.code(404).send({ error: 'Timeline not found' })
      }
      
      // Check password
      if (timeline.password) {
        if (!password) {
          return reply.code(401).send({ error: 'Password required' })
        }
        
        const isValid = await fastify.bcrypt.compare(password, timeline.password)
        if (!isValid) {
          return reply.code(401).send({ error: 'Invalid password' })
        }
      }
      
      // Track view
      const viewerIp = request.ip
      await fastify.prisma.timelineView.create({
        data: {
          timelineId: timeline.id,
          viewerIp,
          viewerInfo: {
            userAgent: request.headers['user-agent'],
            referrer: request.headers.referer
          }
        }
      })
      
      // Increment view count
      await fastify.prisma.projectTimeline.update({
        where: { id: timeline.id },
        data: { viewCount: { increment: 1 } }
      })
      
      // Build media query
      const mediaWhere = {
        projectId: timeline.projectId,
        status: 'READY'
      }
      
      if (!timeline.showAllMedia) {
        if (timeline.mediaTypes.length > 0) {
          mediaWhere.mediaType = { in: timeline.mediaTypes }
        }
        if (timeline.activityTypes.length > 0) {
          mediaWhere.activityType = { in: timeline.activityTypes }
        }
      }
      
      // Get media with pagination
      const [media, total] = await Promise.all([
        fastify.prisma.media.findMany({
          where: mediaWhere,
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        fastify.prisma.media.count({ where: mediaWhere })
      ])
      
      // Generate signed URLs
      const { getSignedUrl } = require('../services/media');
      const mediaWithUrls = await Promise.all(
        media.map(async (item) => ({
          ...item,
          fileUrl: await getSignedUrl(item.fileUrl),
          thumbnailUrl: item.thumbnailUrl 
            ? await getSignedUrl(item.thumbnailUrl)
            : null,
          frontCameraUrl: item.frontCameraUrl
            ? await getSignedUrl(item.frontCameraUrl)
            : null,
          backCameraUrl: item.backCameraUrl
            ? await getSignedUrl(item.backCameraUrl)
            : null
        }))
      )
      
      return {
        id: timeline.id,
        title: timeline.title || timeline.project.name,
        description: timeline.description,
        project: timeline.project,
        brandLogo: timeline.brandLogo,
        brandColor: timeline.brandColor,
        media: mediaWithUrls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        viewCount: timeline.viewCount
      }
    }
  )
  
  // Timeline analytics
  fastify.get(
    '/projects/:projectId/timeline/analytics',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId } = request.params
      const { days = 30 } = request.query
      
      // Verify access
      const timeline = await fastify.prisma.projectTimeline.findFirst({
        where: {
          projectId,
          project: {
            OR: [
              { companyId: request.user.companyId },
              { members: { some: { userId: request.user.id } } }
            ]
          }
        }
      })
      
      if (!timeline) {
        return reply.code(403).send({ error: 'Access denied' })
      }
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      // Get view stats
      const views = await fastify.prisma.timelineView.groupBy({
        by: ['viewedAt'],
        where: {
          timelineId: timeline.id,
          viewedAt: { gte: startDate }
        },
        _count: true
      })
      
      // Get unique viewers
      const uniqueViewers = await fastify.prisma.timelineView.groupBy({
        by: ['viewerIp'],
        where: {
          timelineId: timeline.id,
          viewedAt: { gte: startDate }
        },
        _count: true
      })
      
      // Get referrers
      const referrers = await fastify.prisma.$queryRaw`
        SELECT 
          viewerInfo->>'referrer' as referrer,
          COUNT(*) as count
        FROM "TimelineView"
        WHERE "timelineId" = ${timeline.id}
          AND "viewedAt" >= ${startDate}
          AND viewerInfo->>'referrer' IS NOT NULL
        GROUP BY viewerInfo->>'referrer'
        ORDER BY count DESC
        LIMIT 10
      `
      
      return {
        totalViews: timeline.viewCount,
        periodViews: views.length,
        uniqueViewers: uniqueViewers.length,
        viewsByDay: views,
        topReferrers: referrers
      }
    }
  )
  
  // SSE endpoint for real-time timeline updates
  fastify.get(
    '/public/timeline/:shareToken/stream',
    {
      schema: {
        response: {
          200: {
            type: 'string',
            description: 'Server-sent events stream'
          }
        }
      }
    },
    async (request, reply) => {
      const { shareToken } = request.params
      
      const timeline = await fastify.prisma.projectTimeline.findUnique({
        where: { shareToken },
        select: { id: true, projectId: true }
      })
      
      if (!timeline) {
        return reply.code(404).send({ error: 'Timeline not found' })
      }
      
      // Set up SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      })
      
      // Send initial connection message
      reply.raw.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      
      // Set up polling for new media (every 5 seconds)
      let lastCheck = new Date()
      const interval = setInterval(async () => {
        try {
          const newMedia = await fastify.prisma.media.findMany({
            where: {
              projectId: timeline.projectId,
              status: 'READY',
              createdAt: { gt: lastCheck }
            },
            include: {
              user: {
                select: { id: true, name: true }
              }
            },
            orderBy: { timestamp: 'desc' }
          })
          
          if (newMedia.length > 0) {
            // Generate signed URLs
            const { getSignedUrl } = require('../services/media');
            const mediaWithUrls = await Promise.all(
              newMedia.map(async (item) => ({
                ...item,
                fileUrl: await getSignedUrl(item.fileUrl),
                thumbnailUrl: item.thumbnailUrl 
                  ? await getSignedUrl(item.thumbnailUrl)
                  : null
              }))
            )
            
            reply.raw.write(`data: ${JSON.stringify({ 
              type: 'new_media', 
              media: mediaWithUrls 
            })}\n\n`)
            
            lastCheck = new Date()
          }
        } catch (error) {
          console.error('SSE error:', error)
        }
      }, 5000)
      
      // Clean up on disconnect
      request.raw.on('close', () => {
        clearInterval(interval)
      })
    }
  )
};