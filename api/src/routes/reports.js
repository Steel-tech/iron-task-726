const { z } = require('zod')
const prisma = require('../lib/prisma')
const pdfReportService = require('../services/pdfReportService')
const {
  reportRateLimit,
  notificationRateLimit,
} = require('../middleware/rateLimit')
const { format } = require('date-fns')

// Validation schemas
const createReportSchema = z.object({
  projectId: z.string().uuid(),
  reportType: z.enum(['PROGRESS_RECAP', 'SUMMARY', 'DAILY_LOG']),
  title: z.string().min(1).max(200),
  dateRange: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
  mediaIds: z.array(z.string().uuid()).optional(),
  sections: z
    .array(
      z.object({
        title: z.string(),
        includePhotos: z.boolean().default(true),
        includeNotes: z.boolean().default(true),
        customContent: z.string().optional(),
      })
    )
    .optional(),
})

const shareReportSchema = z.object({
  method: z.enum(['email', 'sms', 'link']),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

module.exports = async function reportRoutes(fastify, options) {
  // Create a new AI report
  fastify.post(
    '/reports',
    {
      preHandler: [fastify.authenticate, reportRateLimit],
    },
    async (request, reply) => {
      const { id: userId, companyId } = request.user
      const data = createReportSchema.parse(request.body)

      try {
        // Verify project access
        const project = await prisma.project.findFirst({
          where: {
            id: data.projectId,
            companyId,
          },
        })

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' })
        }

        // Create the report
        const report = await prisma.aIReport.create({
          data: {
            projectId: data.projectId,
            userId,
            reportType: data.reportType,
            title: data.title,
            dateRange: data.dateRange,
            mediaIds: data.mediaIds || [],
            sections: data.sections,
            status: 'PENDING',
          },
        })

        // Trigger AI generation (async)
        generateReport(report.id)

        reply.send({ report })
      } catch (error) {
        console.error('Failed to create report:', error)
        reply.code(500).send({ error: 'Failed to create report' })
      }
    }
  )

  // Get reports for a project
  fastify.get(
    '/projects/:projectId/reports',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId, companyId } = request.user
      const { projectId } = request.params
      const { reportType, status } = request.query

      try {
        // Verify project access
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            companyId,
          },
        })

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' })
        }

        const where = { projectId }
        if (reportType) where.reportType = reportType
        if (status) where.status = status

        const reports = await prisma.aIReport.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                shares: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        reply.send({ reports })
      } catch (error) {
        console.error('Failed to fetch reports:', error)
        reply.code(500).send({ error: 'Failed to fetch reports' })
      }
    }
  )

  // Get a specific report
  fastify.get(
    '/reports/:reportId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId, companyId } = request.user
      const { reportId } = request.params

      try {
        const report = await prisma.aIReport.findFirst({
          where: {
            id: reportId,
            project: { companyId },
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                jobNumber: true,
                location: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            shares: {
              include: {
                sharedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        })

        if (!report) {
          return reply.code(404).send({ error: 'Report not found' })
        }

        // If report is still generating, check status
        if (report.status === 'GENERATING') {
          // Check if generation is complete
          const updatedReport = await checkReportStatus(report.id)
          if (updatedReport) {
            Object.assign(report, updatedReport)
          }
        }

        reply.send({ report })
      } catch (error) {
        console.error('Failed to fetch report:', error)
        reply.code(500).send({ error: 'Failed to fetch report' })
      }
    }
  )

  // Delete a report
  fastify.delete(
    '/reports/:reportId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id: userId, companyId } = request.user
      const { reportId } = request.params

      try {
        const report = await prisma.aIReport.findFirst({
          where: {
            id: reportId,
            project: { companyId },
            userId, // Only creator can delete
          },
        })

        if (!report) {
          return reply.code(404).send({ error: 'Report not found' })
        }

        await prisma.aIReport.delete({
          where: { id: reportId },
        })

        reply.send({ success: true })
      } catch (error) {
        console.error('Failed to delete report:', error)
        reply.code(500).send({ error: 'Failed to delete report' })
      }
    }
  )

  // Share a report
  fastify.post(
    '/reports/:reportId/share',
    {
      preHandler: [fastify.authenticate, notificationRateLimit],
    },
    async (request, reply) => {
      const { id: userId } = request.user
      const { reportId } = request.params
      const data = shareReportSchema.parse(request.body)

      try {
        const report = await prisma.aIReport.findUnique({
          where: { id: reportId },
          include: {
            project: {
              select: {
                name: true,
                companyId: true,
              },
            },
          },
        })

        if (!report) {
          return reply.code(404).send({ error: 'Report not found' })
        }

        // Create share record
        const share = await prisma.reportShare.create({
          data: {
            reportId,
            sharedById: userId,
            method: data.method,
            recipientEmail: data.recipientEmail,
            recipientPhone: data.recipientPhone,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          },
        })

        // Generate shareable link
        const shareUrl = `${process.env.FRONTEND_URL}/shared/reports/${report.shareToken}`

        // Send notification based on method
        if (data.method === 'email' && data.recipientEmail) {
          // Send email with report link
          await sendReportEmail(data.recipientEmail, report, shareUrl)
        } else if (data.method === 'sms' && data.recipientPhone) {
          // Send SMS with report link
          await sendReportSMS(data.recipientPhone, report, shareUrl)
        }

        reply.send({
          share,
          shareUrl,
        })
      } catch (error) {
        console.error('Failed to share report:', error)
        reply.code(500).send({ error: 'Failed to share report' })
      }
    }
  )

  // Get public report by share token (no auth required)
  fastify.get('/shared/reports/:shareToken', async (request, reply) => {
    const { shareToken } = request.params

    try {
      const report = await prisma.aIReport.findUnique({
        where: { shareToken },
        include: {
          project: {
            select: {
              name: true,
              jobNumber: true,
              location: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      if (!report || report.status !== 'COMPLETED') {
        return reply.code(404).send({ error: 'Report not found' })
      }

      // Increment view count
      await prisma.reportShare.updateMany({
        where: { reportId: report.id },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      })

      reply.send({ report })
    } catch (error) {
      console.error('Failed to fetch shared report:', error)
      reply.code(500).send({ error: 'Failed to fetch shared report' })
    }
  })

  // Download report as PDF
  fastify.get(
    '/reports/:reportId/download',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { reportId } = request.params

      try {
        const report = await prisma.aIReport.findUnique({
          where: { id: reportId },
          include: {
            project: true,
            user: true,
          },
        })

        if (!report || report.status !== 'COMPLETED') {
          return reply
            .code(404)
            .send({ error: 'Report not found or not ready' })
        }

        // Generate PDF if not already generated
        let pdfUrl = report.pdfUrl
        if (!pdfUrl) {
          pdfUrl = await generatePDF(report)
          await prisma.aIReport.update({
            where: { id: reportId },
            data: { pdfUrl },
          })
        }

        // Redirect to PDF URL or stream the PDF
        reply.redirect(pdfUrl)
      } catch (error) {
        console.error('Failed to download report:', error)
        reply.code(500).send({ error: 'Failed to download report' })
      }
    }
  )

  // Serve PDF file
  fastify.get(
    '/reports/:reportId/pdf',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { reportId } = request.params

      try {
        const report = await validateReportAccess(reportId, request.user.id)
        const pdfFilePath = await findLatestReportPDF(reportId)
        await streamPDFFile(reply, pdfFilePath, report.title)
      } catch (error) {
        console.error('Failed to serve PDF:', error)
        if (error.code === 404) {
          return reply.code(404).send({ error: error.message })
        }
        if (error.code === 403) {
          return reply.code(403).send({ error: error.message })
        }
        reply.code(500).send({ error: 'Failed to serve PDF' })
      }
    }
  )

  // Get report templates
  fastify.get(
    '/report-templates',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { companyId } = request.user
      const { reportType } = request.query

      try {
        const where = { companyId }
        if (reportType) where.reportType = reportType

        const templates = await prisma.reportTemplate.findMany({
          where,
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        })

        reply.send({ templates })
      } catch (error) {
        console.error('Failed to fetch templates:', error)
        reply.code(500).send({ error: 'Failed to fetch templates' })
      }
    }
  )
}

// Helper function to generate AI report content
async function generateReport(reportId) {
  try {
    const report = await fetchReportWithIncludes(reportId)
    await updateReportStatus(reportId, 'GENERATING')
    
    const { content, summary, todoItems } = await generateReportContent(report)
    
    await updateReportWithGeneratedContent(reportId, content, summary, todoItems)
  } catch (error) {
    console.error('Failed to generate report:', error)
    await updateReportStatus(reportId, 'FAILED')
  }
}

// Fetch report with all necessary includes
async function fetchReportWithIncludes(reportId) {
  const report = await prisma.aIReport.findUnique({
    where: { id: reportId },
  })
  
  return await prisma.aIReport.findUnique({
    where: { id: reportId },
    include: {
      project: {
        include: {
          media: {
            where:
              report.mediaIds?.length > 0
                ? { id: { in: report.mediaIds } }
                : report.dateRange
                  ? {
                      createdAt: {
                        gte: new Date(report.dateRange.start),
                        lte: new Date(report.dateRange.end),
                      },
                    }
                  : undefined,
            include: {
              user: true,
              annotations: true,
              mediaTags: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          activities: {
            where: report.dateRange
              ? {
                  timestamp: {
                    gte: new Date(report.dateRange.start),
                    lte: new Date(report.dateRange.end),
                  },
                }
              : undefined,
            include: {
              user: true,
            },
            orderBy: { timestamp: 'asc' },
          },
        },
      },
    },
  })
}

// Generate content based on report type
async function generateReportContent(report) {
  let content = {}
  let summary = ''
  let todoItems = null

  switch (report.reportType) {
    case 'PROGRESS_RECAP':
      content = await generateProgressRecap(report)
      summary = `Progress report for ${report.project.name} covering ${report.project.media.length} photos and ${report.project.activities.length} activities.`
      break

    case 'SUMMARY':
      content = await generateSummary(report)
      summary = content.summary
      break

    case 'DAILY_LOG':
      const dailyLog = await generateDailyLog(report)
      content = dailyLog.content
      todoItems = dailyLog.todoItems
      summary = `Daily log for ${format(new Date(), 'MMMM d, yyyy')} with ${dailyLog.todoItems.length} action items.`
      break
  }

  return { content, summary, todoItems }
}

// Update report status
async function updateReportStatus(reportId, status) {
  await prisma.aIReport.update({
    where: { id: reportId },
    data: { status },
  })
}

// Update report with generated content
async function updateReportWithGeneratedContent(reportId, content, summary, todoItems) {
  await prisma.aIReport.update({
    where: { id: reportId },
    data: {
      content,
      summary,
      todoItems,
      status: 'COMPLETED',
      generatedAt: new Date(),
    },
  })
}

// Generate Progress Recap report
async function generateProgressRecap(report) {
  const sections = []
  const project = report.project

  sections.push(createProjectOverviewSection(project, report))
  sections.push(createWorkCompletedSection(project))
  sections.push(createPhotoDocumentationSection(project))
  sections.push(createKeyObservationsSection(project))

  return { sections }
}

// Create project overview section
function createProjectOverviewSection(project, report) {
  return {
    title: 'Project Overview',
    content: {
      projectName: project.name,
      jobNumber: project.jobNumber,
      location: project.location,
      dateRange: report.dateRange,
      totalPhotos: project.media.length,
      totalActivities: project.activities.length,
    },
  }
}

// Create work completed section
function createWorkCompletedSection(project) {
  const workByDate = groupActivitiesByDate(project.activities)
  
  return {
    title: 'Work Completed',
    content: Object.entries(workByDate).map(([date, activities]) => ({
      date,
      activities: activities.map(a => ({
        type: a.activityType,
        description: a.description,
        user: a.user.name,
        location: a.location,
      })),
    })),
  }
}

// Group activities by date
function groupActivitiesByDate(activities) {
  const workByDate = {}
  activities.forEach(activity => {
    const date = format(new Date(activity.timestamp), 'yyyy-MM-dd')
    if (!workByDate[date]) workByDate[date] = []
    workByDate[date].push(activity)
  })
  return workByDate
}

// Create photo documentation section
function createPhotoDocumentationSection(project) {
  const photosByCategory = groupMediaByCategory(project.media)
  
  return {
    title: 'Photo Documentation',
    content: photosByCategory,
  }
}

// Group media by category
function groupMediaByCategory(media) {
  const photosByCategory = {}
  media.forEach(mediaItem => {
    const category = mediaItem.mediaTags[0]?.tag.name || 'General'
    if (!photosByCategory[category]) photosByCategory[category] = []
    photosByCategory[category].push({
      id: mediaItem.id,
      url: mediaItem.fileUrl,
      thumbnailUrl: mediaItem.thumbnailUrl,
      caption: mediaItem.notes,
      timestamp: mediaItem.timestamp,
      user: mediaItem.user.name,
      tags: mediaItem.mediaTags.map(mt => mt.tag.name),
    })
  })
  return photosByCategory
}

// Create key observations section
function createKeyObservationsSection(project) {
  return {
    title: 'Key Observations',
    content: generateObservations(project.media),
  }
}

// Generate Summary report
async function generateSummary(report) {
  const project = report.project
  const media = project.media

  // Analyze media content and generate summary
  const summary = generateMediaSummary(media)

  return {
    summary,
    mediaCount: media.length,
    dateRange: {
      start: media[0]?.createdAt,
      end: media[media.length - 1]?.createdAt,
    },
    highlights: extractHighlights(media),
    tags: extractUniqueTags(media),
  }
}

// Generate Daily Log report
async function generateDailyLog(report) {
  const project = report.project
  const today = new Date()

  // Get today's activities and media
  const todayStart = new Date(today.setHours(0, 0, 0, 0))
  const todayEnd = new Date(today.setHours(23, 59, 59, 999))

  const todaysActivities = project.activities.filter(a => {
    const activityDate = new Date(a.timestamp)
    return activityDate >= todayStart && activityDate <= todayEnd
  })

  const todaysMedia = project.media.filter(m => {
    const mediaDate = new Date(m.createdAt)
    return mediaDate >= todayStart && mediaDate <= todayEnd
  })

  // Generate content
  const content = {
    date: format(today, 'MMMM d, yyyy'),
    summary: generateDailySummary(todaysActivities, todaysMedia),
    workCompleted: todaysActivities.map(a => ({
      time: format(new Date(a.timestamp), 'h:mm a'),
      activity: a.activityType,
      description: a.description,
      worker: a.user.name,
      location: a.location,
    })),
    photosAdded: todaysMedia.length,
    keyAccomplishments: extractAccomplishments(todaysActivities),
  }

  // Generate todo items based on activities and notes
  const todoItems = generateTodoItems(todaysActivities, todaysMedia)

  return { content, todoItems }
}

// Helper functions for AI content generation
function generateObservations(media) {
  // Analyze media and notes to generate observations
  const observations = []

  // Group by activity type
  const byActivity = {}
  media.forEach(m => {
    if (!byActivity[m.activityType]) byActivity[m.activityType] = 0
    byActivity[m.activityType]++
  })

  Object.entries(byActivity).forEach(([activity, count]) => {
    observations.push(
      `${count} photos documented for ${activity.toLowerCase()} activities`
    )
  })

  // Safety observations
  const safetyTags = media.filter(m =>
    m.mediaTags.some(mt => mt.tag.category === 'Safety')
  )
  if (safetyTags.length > 0) {
    observations.push(`${safetyTags.length} safety-related items documented`)
  }

  return observations
}

function generateMediaSummary(media) {
  const activities = new Set(media.map(m => m.activityType))
  const workers = new Set(media.map(m => m.user.name))

  return `This collection documents ${media.length} photos across ${activities.size} different activities, captured by ${workers.size} team members. The work includes ${Array.from(activities).join(', ').toLowerCase()}.`
}

function extractHighlights(media) {
  return media
    .filter(m => m.annotations?.length > 0 || m.mediaTags?.length > 2)
    .slice(0, 5)
    .map(m => ({
      photo: m.id,
      highlight: m.notes || 'Significant progress documented',
    }))
}

function extractUniqueTags(media) {
  const tags = new Set()
  media.forEach(m => {
    m.mediaTags.forEach(mt => tags.add(mt.tag.name))
  })
  return Array.from(tags)
}

function generateDailySummary(activities, media) {
  const activityTypes = new Set(activities.map(a => a.activityType))
  return `Today's work included ${activities.length} activities across ${activityTypes.size} different work types. ${media.length} photos were captured to document progress.`
}

function extractAccomplishments(activities) {
  return activities
    .filter(
      a =>
        a.description?.includes('complet') || a.description?.includes('finish')
    )
    .map(a => a.description)
    .slice(0, 5)
}

function generateTodoItems(activities, media) {
  const todos = []

  // Extract todos from activity descriptions
  activities.forEach(a => {
    if (
      a.description?.includes('need') ||
      a.description?.includes('tomorrow')
    ) {
      todos.push({
        task: extractTodoFromText(a.description),
        priority: 'medium',
        assignedTo: null,
      })
    }
  })

  // Extract todos from media notes
  media.forEach(m => {
    if (m.notes?.includes('TODO') || m.notes?.includes('need')) {
      todos.push({
        task: extractTodoFromText(m.notes),
        priority: 'medium',
        assignedTo: null,
      })
    }
  })

  // Add standard daily todos
  todos.push(
    {
      task: 'Review and approve daily progress photos',
      priority: 'high',
      assignedTo: 'Project Manager',
    },
    {
      task: "Update project schedule based on today's progress",
      priority: 'medium',
      assignedTo: 'Project Manager',
    }
  )

  return todos
}

function extractTodoFromText(text) {
  // Simple extraction - in production, use AI/NLP
  return text.replace(/TODO:|need to|tomorrow/gi, '').trim()
}

// Check report generation status
async function checkReportStatus(reportId) {
  // In production, this would check the actual AI generation service
  return null
}

// Generate PDF from report
async function generatePDF(report) {
  try {
    // Generate PDF buffer
    const pdfBuffer = await pdfReportService.generatePDF(report)

    // Save PDF to file system or upload to S3
    const filename = `report_${report.id}_${Date.now()}.pdf`

    // If S3 is configured, upload to S3
    if (process.env.AWS_BUCKET_NAME) {
      // TODO: Upload to S3 and return signed URL
      // For now, save locally
      const filepath = await pdfReportService.savePDF(pdfBuffer, filename)
      return `/api/reports/${report.id}/pdf`
    } else {
      // Save locally for development
      const filepath = await pdfReportService.savePDF(pdfBuffer, filename)
      return `/api/reports/${report.id}/pdf`
    }
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    throw error
  }
}

// Send email notification
async function sendReportEmail(email, report, shareUrl) {
  const emailService = require('../services/emailService')

  try {
    await emailService.sendReportShare(
      { email, name: 'Report Recipient' },
      report,
      { name: report.user.name },
      shareUrl
    )
  } catch (error) {
    console.error('Failed to send report email:', error)
    throw error
  }
}

// Validate report access for user
async function validateReportAccess(reportId, userId) {
  const report = await prisma.aIReport.findUnique({
    where: { id: reportId },
    include: {
      project: {
        include: { company: true },
      },
    },
  })

  if (!report) {
    const error = new Error('Report not found')
    error.code = 404
    throw error
  }

  // Check if user has access to this report
  const hasAccess = await prisma.projectMember.findFirst({
    where: {
      projectId: report.projectId,
      userId,
    },
  })

  if (!hasAccess && report.userId !== userId) {
    const error = new Error('Access denied')
    error.code = 403
    throw error
  }

  return report
}

// Find latest PDF file for report
async function findLatestReportPDF(reportId) {
  const fs = require('fs').promises
  const path = require('path')
  
  const reportsDir = path.join(process.cwd(), 'reports')
  const files = await fs.readdir(reportsDir)
  const reportFiles = files.filter(f => f.includes(`report_${reportId}_`))

  if (reportFiles.length === 0) {
    const error = new Error('PDF not found')
    error.code = 404
    throw error
  }

  const latestFile = reportFiles.sort().pop()
  return path.join(reportsDir, latestFile)
}

// Stream PDF file to response
async function streamPDFFile(reply, filepath, reportTitle) {
  const stream = require('fs').createReadStream(filepath)
  reply.type('application/pdf')
  reply.header(
    'Content-Disposition',
    `attachment; filename="${reportTitle.replace(/[^a-z0-9]/gi, '_')}.pdf"`
  )
  return reply.send(stream)
}

// Send SMS notification
async function sendReportSMS(phone, report, shareUrl) {
  // In production, integrate with SMS service
  // TODO: Implement SMS service integration
  // For now, log at info level for audit trail
  const logger = require('fastify').log || console
  logger.info('SMS notification queued', {
    phone: phone.substring(0, 3) + '***',
    reportId: report.id,
    hasShareUrl: !!shareUrl
  })
}
