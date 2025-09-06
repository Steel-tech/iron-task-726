const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const {
  StdioServerTransport,
} = require('@modelcontextprotocol/sdk/server/stdio.js')
const {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js')
const prisma = require('../lib/prisma')
const { formatDistance, formatISO } = require('date-fns')

class McpService {
  constructor() {
    this.server = new Server(
      {
        name: 'fsw-iron-task-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    )

    this.setupHandlers()
  }

  setupHandlers() {
    // Handle resource listing
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const projects = await prisma.project.findMany({
        select: { id: true, name: true, description: true },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      })

      return {
        resources: projects.map(project => ({
          uri: `project://${project.id}`,
          name: project.name,
          description: project.description || 'Construction project',
          mimeType: 'application/json',
        })),
      }
    })

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const uri = request.params.uri

      if (uri.startsWith('project://')) {
        const projectId = uri.replace('project://', '')
        const project = await this.getProjectDetails(projectId)

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(project, null, 2),
            },
          ],
        }
      }

      throw new Error(`Unknown resource URI: ${uri}`)
    })

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params

      switch (name) {
        case 'searchProjects':
          return await this.searchProjects(args)
        case 'getProjectMedia':
          return await this.getProjectMedia(args)
        case 'getProjectReports':
          return await this.getProjectReports(args)
        case 'getProjectActivities':
          return await this.getProjectActivities(args)
        case 'searchMedia':
          return await this.searchMedia(args)
        case 'getTeamMembers':
          return await this.getTeamMembers(args)
        case 'getProjectStats':
          return await this.getProjectStats(args)
        default:
          throw new Error(`Unknown tool: ${name}`)
      }
    })

    // Define available tools
    this.server.tools = [
      {
        name: 'searchProjects',
        description:
          'Search for construction projects by name, status, or company',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            status: {
              type: 'string',
              enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'],
              description: 'Project status filter',
            },
            companyId: { type: 'string', description: 'Company ID filter' },
            limit: { type: 'number', default: 10 },
          },
        },
      },
      {
        name: 'getProjectMedia',
        description: 'Get media files (photos/videos) for a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID' },
            mediaType: {
              type: 'string',
              enum: ['PHOTO', 'VIDEO', 'DUAL_CAM_VIDEO'],
              description: 'Media type filter',
            },
            tagId: { type: 'string', description: 'Tag ID filter' },
            limit: { type: 'number', default: 20 },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'getProjectReports',
        description: 'Get AI-generated reports for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID' },
            reportType: {
              type: 'string',
              enum: ['PROGRESS_RECAP', 'SUMMARY', 'DAILY_LOG'],
              description: 'Report type filter',
            },
            limit: { type: 'number', default: 10 },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'getProjectActivities',
        description: 'Get recent activities for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID' },
            activityType: {
              type: 'string',
              description: 'Activity type filter',
            },
            days: {
              type: 'number',
              default: 7,
              description: 'Number of days to look back',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'searchMedia',
        description:
          'Search media across all projects by tags, location, or date',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tag names to filter by',
            },
            startDate: {
              type: 'string',
              description: 'Start date (ISO format)',
            },
            endDate: { type: 'string', description: 'End date (ISO format)' },
            hasLocation: {
              type: 'boolean',
              description: 'Filter by presence of GPS data',
            },
            limit: { type: 'number', default: 20 },
          },
        },
      },
      {
        name: 'getTeamMembers',
        description: 'Get team members for a project or company',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID' },
            companyId: { type: 'string', description: 'Company ID' },
            role: {
              type: 'string',
              enum: [
                'ADMIN',
                'PROJECT_MANAGER',
                'FOREMAN',
                'WORKER',
                'STEEL_ERECTOR',
                'WELDER',
                'SAFETY_INSPECTOR',
                'VIEWER',
              ],
              description: 'Role filter',
            },
          },
        },
      },
      {
        name: 'getProjectStats',
        description: 'Get statistics and analytics for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID' },
          },
          required: ['projectId'],
        },
      },
    ]
  }

  // Tool implementations
  async searchProjects({ query, status, companyId, limit = 10 }) {
    const where = {}

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (status) {where.status = status}
    if (companyId) {where.companyId = companyId}

    const projects = await prisma.project.findMany({
      where,
      take: limit,
      include: {
        company: { select: { name: true } },
        _count: {
          select: { media: true, activities: true, users: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projects, null, 2),
        },
      ],
    }
  }

  async getProjectMedia({ projectId, mediaType, tagId, limit = 20 }) {
    const where = { projectId }

    if (mediaType) {where.type = mediaType}
    if (tagId) {
      where.tags = {
        some: { tagId },
      }
    }

    const media = await prisma.media.findMany({
      where,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        tags: {
          include: {
            tag: { select: { name: true, category: true } },
          },
        },
        _count: {
          select: { comments: true, views: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            media.map(m => ({
              ...m,
              url: m.url, // In production, this would generate signed URLs
              thumbnailUrl: m.thumbnailUrl,
            })),
            null,
            2
          ),
        },
      ],
    }
  }

  async getProjectReports({ projectId, reportType, limit = 10 }) {
    const where = { projectId }

    if (reportType) {where.type = reportType}

    const reports = await prisma.aIReport.findMany({
      where,
      take: limit,
      include: {
        project: { select: { name: true } },
        generatedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(reports, null, 2),
        },
      ],
    }
  }

  async getProjectActivities({ projectId, activityType, days = 7 }) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const where = {
      projectId,
      createdAt: { gte: startDate },
    }

    if (activityType) {where.type = activityType}

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            activities.map(a => ({
              ...a,
              timeAgo: formatDistance(new Date(a.createdAt), new Date(), {
                addSuffix: true,
              }),
            })),
            null,
            2
          ),
        },
      ],
    }
  }

  async searchMedia({
    query,
    tags,
    startDate,
    endDate,
    hasLocation,
    limit = 20,
  }) {
    const where = {}

    if (query) {
      where.OR = [
        { description: { contains: query, mode: 'insensitive' } },
        { metadata: { path: ['$.caption'], string_contains: query } },
      ]
    }

    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      }
    }

    if (startDate || endDate) {
      where.capturedAt = {}
      if (startDate) {where.capturedAt.gte = new Date(startDate)}
      if (endDate) {where.capturedAt.lte = new Date(endDate)}
    }

    if (hasLocation !== undefined) {
      where.location = hasLocation ? { not: null } : null
    }

    const media = await prisma.media.findMany({
      where,
      take: limit,
      include: {
        project: { select: { name: true } },
        user: { select: { name: true } },
        tags: {
          include: {
            tag: { select: { name: true, category: true } },
          },
        },
      },
      orderBy: { capturedAt: 'desc' },
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(media, null, 2),
        },
      ],
    }
  }

  async getTeamMembers({ projectId, companyId, role }) {
    const where = {}

    if (role) {where.role = role}

    let users

    if (projectId) {
      // Get users assigned to specific project
      const projectUsers = await prisma.projectUser.findMany({
        where: {
          projectId,
          ...(role && { role }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              avatar: true,
              company: { select: { name: true } },
            },
          },
        },
      })

      users = projectUsers.map(pu => ({
        ...pu.user,
        projectRole: pu.role,
        assignedAt: pu.assignedAt,
      }))
    } else if (companyId) {
      users = await prisma.user.findMany({
        where: {
          companyId,
          ...where,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      })
    } else {
      throw new Error('Either projectId or companyId is required')
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(users, null, 2),
        },
      ],
    }
  }

  async getProjectStats({ projectId }) {
    const [
      project,
      mediaCount,
      activityCount,
      reportsCount,
      recentMedia,
      tagStats,
    ] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          company: { select: { name: true } },
          _count: {
            select: { users: true },
          },
        },
      }),
      prisma.media.count({ where: { projectId } }),
      prisma.activity.count({ where: { projectId } }),
      prisma.aIReport.count({ where: { projectId } }),
      prisma.media.findMany({
        where: { projectId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, createdAt: true },
      }),
      prisma.mediaTag.groupBy({
        by: ['tagId'],
        where: {
          media: { projectId },
        },
        _count: true,
        orderBy: {
          _count: {
            tagId: 'desc',
          },
        },
        take: 10,
      }),
    ])

    // Get tag details for the stats
    const tagIds = tagStats.map(ts => ts.tagId)
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true, name: true, category: true },
    })

    const tagMap = new Map(tags.map(t => [t.id, t]))
    const topTags = tagStats.map(ts => ({
      ...tagMap.get(ts.tagId),
      count: ts._count,
    }))

    const stats = {
      project: {
        ...project,
        duration: formatDistance(
          new Date(project.startDate || project.createdAt),
          new Date()
        ),
      },
      counts: {
        media: mediaCount,
        activities: activityCount,
        reports: reportsCount,
        teamMembers: project._count.users,
      },
      recentMedia,
      topTags,
      lastUpdated: project.updatedAt,
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    }
  }

  // Helper method to get detailed project info
  async getProjectDetails(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: true,
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            media: true,
            activities: true,
            aiReports: true,
          },
        },
      },
    })

    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }

    return project
  }

  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('FSW Iron Task MCP server started')
  }
}

module.exports = McpService
