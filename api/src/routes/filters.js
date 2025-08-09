const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Validation schemas
const filterCriteriaSchema = z.object({
  tags: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
  users: z.array(z.string()).optional(),
  mediaTypes: z.array(z.enum(['PHOTO', 'VIDEO'])).optional(),
  activityTypes: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional(),
  keywords: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional()
});

const createFilterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: filterCriteriaSchema,
  isPublic: z.boolean().optional()
});

const updateFilterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  filters: filterCriteriaSchema.optional(),
  isPublic: z.boolean().optional()
});

async function routes(fastify, options) {
  // Get all saved filters
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, companyId } = request.user;
    
    const filters = await prisma.savedFilter.findMany({
      where: {
        companyId,
        OR: [
          { createdById: userId },
          { isPublic: true }
        ]
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { isPublic: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return filters;
  });
  
  // Get a specific filter
  fastify.get('/:filterId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, companyId } = request.user;
    const { filterId } = request.params;
    
    const filter = await prisma.savedFilter.findFirst({
      where: {
        id: filterId,
        companyId,
        OR: [
          { createdById: userId },
          { isPublic: true }
        ]
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!filter) {
      return reply.code(404).send({ error: 'Filter not found' });
    }
    
    return filter;
  });
  
  // Create a new saved filter
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, companyId } = request.user;
    const data = createFilterSchema.parse(request.body);
    
    const filter = await prisma.savedFilter.create({
      data: {
        ...data,
        companyId,
        createdById: userId
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
    
    return filter;
  });
  
  // Update a saved filter
  fastify.patch('/:filterId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId } = request.user;
    const { filterId } = request.params;
    const data = updateFilterSchema.parse(request.body);
    
    // Check if user owns the filter
    const filter = await prisma.savedFilter.findFirst({
      where: {
        id: filterId,
        createdById: userId
      }
    });
    
    if (!filter) {
      return reply.code(404).send({ error: 'Filter not found or you do not have permission to edit it' });
    }
    
    const updatedFilter = await prisma.savedFilter.update({
      where: { id: filterId },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
    
    return updatedFilter;
  });
  
  // Delete a saved filter
  fastify.delete('/:filterId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, role } = request.user;
    const { filterId } = request.params;
    
    // Check if user owns the filter or is admin
    const filter = await prisma.savedFilter.findFirst({
      where: {
        id: filterId,
        OR: [
          { createdById: userId },
          role === 'ADMIN' ? {} : { id: 'never-match' }
        ]
      }
    });
    
    if (!filter) {
      return reply.code(404).send({ error: 'Filter not found or you do not have permission to delete it' });
    }
    
    await prisma.savedFilter.delete({
      where: { id: filterId }
    });
    
    return { success: true };
  });
  
  // Apply a saved filter to get media
  fastify.post('/:filterId/apply', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, companyId } = request.user;
    const { filterId } = request.params;
    const { page = 1, limit = 50 } = request.query;
    
    const filter = await prisma.savedFilter.findFirst({
      where: {
        id: filterId,
        companyId,
        OR: [
          { createdById: userId },
          { isPublic: true }
        ]
      }
    });
    
    if (!filter) {
      return reply.code(404).send({ error: 'Filter not found' });
    }
    
    const filters = filter.filters;
    const where = {
      project: { companyId }
    };
    
    // Apply tag filters
    if (filters.tags?.length > 0) {
      where.mediaTags = {
        some: {
          tagId: { in: filters.tags }
        }
      };
    }
    
    // Apply project filters
    if (filters.projects?.length > 0) {
      where.projectId = { in: filters.projects };
    }
    
    // Apply user filters
    if (filters.users?.length > 0) {
      where.userId = { in: filters.users };
    }
    
    // Apply media type filters
    if (filters.mediaTypes?.length > 0) {
      where.mediaType = { in: filters.mediaTypes };
    }
    
    // Apply activity type filters
    if (filters.activityTypes?.length > 0) {
      where.activityType = { in: filters.activityTypes };
    }
    
    // Apply date range filters
    if (filters.dateRange) {
      where.timestamp = {};
      if (filters.dateRange.start) {
        where.timestamp.gte = new Date(filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        where.timestamp.lte = new Date(filters.dateRange.end);
      }
    }
    
    // Apply location filters
    if (filters.locations?.length > 0) {
      where.location = { in: filters.locations };
    }
    
    // Apply keyword search
    if (filters.keywords?.length > 0) {
      where.OR = filters.keywords.map(keyword => ({
        OR: [
          { notes: { contains: keyword, mode: 'insensitive' } },
          { location: { contains: keyword, mode: 'insensitive' } },
          { address: { contains: keyword, mode: 'insensitive' } }
        ]
      }));
    }
    
    // Get total count
    const total = await prisma.media.count({ where });
    
    // Get paginated results
    const media = await prisma.media.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, jobNumber: true }
        },
        user: {
          select: { id: true, name: true }
        },
        mediaTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    return {
      filter,
      media,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  });
  
  // Get shareable link for a filter
  fastify.get('/:filterId/share', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId } = request.user;
    const { filterId } = request.params;
    
    const filter = await prisma.savedFilter.findFirst({
      where: {
        id: filterId,
        createdById: userId
      },
      select: {
        shareToken: true,
        name: true
      }
    });
    
    if (!filter) {
      return reply.code(404).send({ error: 'Filter not found or you do not have permission' });
    }
    
    const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || (process.env.NODE_ENV === 'production' ? 'https://your-frontend-domain.com' : 'http://localhost:3000');
    const shareUrl = `${baseUrl}/shared/catalog/${filter.shareToken}`;
    
    return {
      name: filter.name,
      shareToken: filter.shareToken,
      shareUrl
    };
  });
}

module.exports = routes;

// Export shared catalog route separately
module.exports.sharedCatalogRoute = async function(fastify, options) {
  // Access shared catalog by token (no auth required)
  fastify.get('/shared/catalog/:shareToken', async (request, reply) => {
    const { shareToken } = request.params;
    const { page = 1, limit = 50 } = request.query;
    
    const filter = await prisma.savedFilter.findUnique({
      where: { shareToken },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!filter) {
      return reply.code(404).send({ error: 'Catalog not found' });
    }
    
    // Apply the filter logic
    const filters = filter.filters;
    const where = {
      project: { companyId: filter.companyId }
    };
    
    // Apply tag filters
    if (filters.tags?.length > 0) {
      where.mediaTags = {
        some: {
          tagId: { in: filters.tags }
        }
      };
    }
    
    // Apply other filters...
    // (same logic as in the apply endpoint)
    
    const total = await prisma.media.count({ where });
    
    const media = await prisma.media.findMany({
      where,
      select: {
        id: true,
        fileUrl: true,
        thumbnailUrl: true,
        mediaType: true,
        timestamp: true,
        location: true,
        notes: true,
        project: {
          select: { name: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    return {
      catalog: {
        name: filter.name,
        description: filter.description,
        company: filter.company.name
      },
      media,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  });
};