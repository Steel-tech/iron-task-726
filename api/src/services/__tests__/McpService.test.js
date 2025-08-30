const McpService = require('../McpService')
const prisma = require('../../lib/prisma')

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  media: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  aIReport: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  activity: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  projectUser: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  mediaTag: {
    groupBy: jest.fn(),
  },
  tag: {
    findMany: jest.fn(),
  },
}))

describe('McpService', () => {
  let mcpService

  beforeEach(() => {
    mcpService = new McpService()
    jest.clearAllMocks()
  })

  describe('searchProjects', () => {
    it('should search projects by query', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Downtown Tower',
          description: 'High-rise construction',
          status: 'ACTIVE',
          company: { name: 'FSW Denver' },
          _count: { media: 50, activities: 100, users: 10 },
        },
      ]

      prisma.project.findMany.mockResolvedValue(mockProjects)

      const result = await mcpService.searchProjects({
        query: 'Downtown',
        status: 'ACTIVE',
        limit: 10,
      })

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'Downtown', mode: 'insensitive' } },
            { description: { contains: 'Downtown', mode: 'insensitive' } },
            { location: { contains: 'Downtown', mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
        },
        take: 10,
        include: {
          company: { select: { name: true } },
          _count: {
            select: { media: true, activities: true, users: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      expect(result.content[0].text).toContain('Downtown Tower')
    })
  })

  describe('getProjectMedia', () => {
    it('should retrieve media for a project', async () => {
      const mockMedia = [
        {
          id: 'media-1',
          type: 'PHOTO',
          url: 'https://example.com/photo1.jpg',
          thumbnailUrl: 'https://example.com/thumb1.jpg',
          projectId: 'project-1',
          user: { name: 'John Doe', email: 'john@example.com' },
          tags: [
            {
              tag: { name: 'Safety', category: 'compliance' },
            },
          ],
          _count: { comments: 5, views: 20 },
        },
      ]

      prisma.media.findMany.mockResolvedValue(mockMedia)

      const result = await mcpService.getProjectMedia({
        projectId: 'project-1',
        mediaType: 'PHOTO',
        limit: 20,
      })

      expect(prisma.media.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          type: 'PHOTO',
        },
        take: 20,
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

      const parsedResult = JSON.parse(result.content[0].text)
      expect(parsedResult[0]).toHaveProperty('url')
      expect(parsedResult[0]).toHaveProperty('thumbnailUrl')
    })
  })

  describe('getProjectStats', () => {
    it('should return comprehensive project statistics', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        company: { name: 'FSW Denver' },
        _count: { users: 15 },
      }

      const mockTagStats = [
        { tagId: 'tag-1', _count: 25 },
        { tagId: 'tag-2', _count: 15 },
      ]

      const mockTags = [
        { id: 'tag-1', name: 'Safety', category: 'compliance' },
        { id: 'tag-2', name: 'Progress', category: 'status' },
      ]

      prisma.project.findUnique.mockResolvedValue(mockProject)
      prisma.media.count.mockResolvedValue(150)
      prisma.activity.count.mockResolvedValue(300)
      prisma.aIReport.count.mockResolvedValue(10)
      prisma.media.findMany.mockResolvedValue([])
      prisma.mediaTag.groupBy.mockResolvedValue(mockTagStats)
      prisma.tag.findMany.mockResolvedValue(mockTags)

      const result = await mcpService.getProjectStats({
        projectId: 'project-1',
      })

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: {
          company: { select: { name: true } },
          _count: {
            select: { users: true },
          },
        },
      })

      const stats = JSON.parse(result.content[0].text)
      expect(stats.counts).toEqual({
        media: 150,
        activities: 300,
        reports: 10,
        teamMembers: 15,
      })
      expect(stats.topTags).toHaveLength(2)
      expect(stats.topTags[0].name).toBe('Safety')
    })
  })

  describe('searchMedia', () => {
    it('should search media across projects with filters', async () => {
      const mockMedia = [
        {
          id: 'media-1',
          description: 'Steel beam installation',
          capturedAt: new Date('2024-03-15'),
          location: { lat: 39.7392, lng: -104.9903 },
          project: { name: 'Downtown Tower' },
          user: { name: 'John Doe' },
          tags: [
            {
              tag: { name: 'Installation', category: 'activity' },
            },
          ],
        },
      ]

      prisma.media.findMany.mockResolvedValue(mockMedia)

      const result = await mcpService.searchMedia({
        query: 'steel',
        tags: ['Installation'],
        hasLocation: true,
        limit: 10,
      })

      expect(prisma.media.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { description: { contains: 'steel', mode: 'insensitive' } },
            { metadata: { path: ['$.caption'], string_contains: 'steel' } },
          ],
          tags: {
            some: {
              tag: {
                name: { in: ['Installation'] },
              },
            },
          },
          location: { not: null },
        },
        take: 10,
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

      const parsedResult = JSON.parse(result.content[0].text)
      expect(parsedResult[0].description).toContain('Steel beam')
    })
  })

  describe('getTeamMembers', () => {
    it('should retrieve team members for a project', async () => {
      const mockProjectUsers = [
        {
          user: {
            id: 'user-1',
            email: 'pm@example.com',
            name: 'Project Manager',
            role: 'PROJECT_MANAGER',
            avatar: 'https://example.com/avatar1.jpg',
            company: { name: 'FSW Denver' },
          },
          role: 'PROJECT_MANAGER',
          assignedAt: new Date('2024-01-15'),
        },
      ]

      prisma.projectUser.findMany.mockResolvedValue(mockProjectUsers)

      const result = await mcpService.getTeamMembers({
        projectId: 'project-1',
        role: 'PROJECT_MANAGER',
      })

      expect(prisma.projectUser.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          role: 'PROJECT_MANAGER',
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

      const parsedResult = JSON.parse(result.content[0].text)
      expect(parsedResult[0].projectRole).toBe('PROJECT_MANAGER')
      expect(parsedResult[0].name).toBe('Project Manager')
    })

    it('should retrieve team members for a company', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'worker@example.com',
          name: 'Steel Worker',
          role: 'WORKER',
          avatar: null,
          createdAt: new Date(),
        },
      ]

      prisma.user.findMany.mockResolvedValue(mockUsers)

      const result = await mcpService.getTeamMembers({
        companyId: 'company-1',
        role: 'WORKER',
      })

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'company-1',
          role: 'WORKER',
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

      const parsedResult = JSON.parse(result.content[0].text)
      expect(parsedResult[0].role).toBe('WORKER')
    })

    it('should throw error when neither projectId nor companyId provided', async () => {
      await expect(mcpService.getTeamMembers({})).rejects.toThrow(
        'Either projectId or companyId is required'
      )
    })
  })

  describe('getProjectDetails', () => {
    it('should retrieve detailed project information', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        company: { id: 'company-1', name: 'FSW Denver' },
        users: [
          {
            user: {
              id: 'user-1',
              name: 'John Doe',
              email: 'john@example.com',
              role: 'PROJECT_MANAGER',
            },
          },
        ],
        _count: {
          media: 100,
          activities: 200,
          aiReports: 5,
        },
      }

      prisma.project.findUnique.mockResolvedValue(mockProject)

      const result = await mcpService.getProjectDetails('project-1')

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
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

      expect(result).toEqual(mockProject)
    })

    it('should throw error for non-existent project', async () => {
      prisma.project.findUnique.mockResolvedValue(null)

      await expect(
        mcpService.getProjectDetails('non-existent')
      ).rejects.toThrow('Project not found: non-existent')
    })
  })
})
