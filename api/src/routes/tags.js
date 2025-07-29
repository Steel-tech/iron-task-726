const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  isSystem: z.boolean().optional()
});

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().max(200).optional(),
  category: z.string().max(50).optional()
});

const tagMediaSchema = z.object({
  mediaId: z.string().uuid(),
  tagIds: z.array(z.string().uuid())
});

// Helper function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function routes(fastify, options) {
  // Get all tags for the company
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    const { category } = request.query;
    
    const where = { companyId };
    if (category) {
      where.category = category;
    }
    
    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: { mediaTags: true }
        },
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    return tags;
  });
  
  // Get tag categories
  fastify.get('/categories', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    
    const categories = await prisma.tag.findMany({
      where: { 
        companyId,
        category: { not: null }
      },
      select: { category: true },
      distinct: ['category']
    });
    
    return categories.map(c => c.category).filter(Boolean);
  });
  
  // Create a new tag
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, companyId, role } = request.user;
    
    // Only admins and project managers can create tags
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    const data = createTagSchema.parse(request.body);
    const slug = createSlug(data.name);
    
    // Check if tag with this slug already exists
    const existing = await prisma.tag.findUnique({
      where: {
        companyId_slug: {
          companyId,
          slug
        }
      }
    });
    
    if (existing) {
      return reply.code(409).send({ error: 'Tag with this name already exists' });
    }
    
    const tag = await prisma.tag.create({
      data: {
        ...data,
        slug,
        companyId,
        createdById: userId
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
    
    return tag;
  });
  
  // Update a tag
  fastify.patch('/:tagId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, companyId, role } = request.user;
    const { tagId } = request.params;
    
    // Only admins and project managers can update tags
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, companyId }
    });
    
    if (!tag) {
      return reply.code(404).send({ error: 'Tag not found' });
    }
    
    if (tag.isSystem) {
      return reply.code(403).send({ error: 'Cannot modify system tags' });
    }
    
    const data = updateTagSchema.parse(request.body);
    
    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...data,
        slug: data.name ? createSlug(data.name) : undefined
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
    
    return updatedTag;
  });
  
  // Delete a tag
  fastify.delete('/:tagId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId, role } = request.user;
    const { tagId } = request.params;
    
    // Only admins can delete tags
    if (role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, companyId }
    });
    
    if (!tag) {
      return reply.code(404).send({ error: 'Tag not found' });
    }
    
    if (tag.isSystem) {
      return reply.code(403).send({ error: 'Cannot delete system tags' });
    }
    
    await prisma.tag.delete({
      where: { id: tagId }
    });
    
    return { success: true };
  });
  
  // Tag media items
  fastify.post('/apply', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId } = request.user;
    const { mediaId, tagIds } = tagMediaSchema.parse(request.body);
    
    // Verify user has access to the media
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        project: {
          OR: [
            { members: { some: { userId } } },
            { company: { users: { some: { id: userId } } } }
          ]
        }
      }
    });
    
    if (!media) {
      return reply.code(404).send({ error: 'Media not found or access denied' });
    }
    
    // Get existing tags
    const existingTags = await prisma.mediaTag.findMany({
      where: { mediaId },
      select: { tagId: true }
    });
    
    const existingTagIds = existingTags.map(t => t.tagId);
    const toAdd = tagIds.filter(id => !existingTagIds.includes(id));
    const toRemove = existingTagIds.filter(id => !tagIds.includes(id));
    
    // Add new tags
    if (toAdd.length > 0) {
      await prisma.mediaTag.createMany({
        data: toAdd.map(tagId => ({
          mediaId,
          tagId,
          taggedById: userId
        }))
      });
    }
    
    // Remove old tags
    if (toRemove.length > 0) {
      await prisma.mediaTag.deleteMany({
        where: {
          mediaId,
          tagId: { in: toRemove }
        }
      });
    }
    
    // Return updated media with tags
    const updatedMedia = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        mediaTags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    return updatedMedia;
  });
  
  // Get media by tags
  fastify.get('/media', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    const { tags, matchAll } = request.query;
    
    if (!tags) {
      return reply.code(400).send({ error: 'Tags parameter required' });
    }
    
    const tagIds = tags.split(',');
    
    const media = await prisma.media.findMany({
      where: {
        project: { companyId },
        mediaTags: matchAll ? {
          every: {
            tagId: { in: tagIds }
          }
        } : {
          some: {
            tagId: { in: tagIds }
          }
        }
      },
      include: {
        mediaTags: {
          include: {
            tag: true
          }
        },
        project: {
          select: { id: true, name: true, jobNumber: true }
        },
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    
    return media;
  });
  
  // Initialize default system tags
  fastify.post('/init-defaults', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId, role, id: userId } = request.user;
    
    // Only admins can initialize default tags
    if (role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    const defaultTags = [
      // Materials
      { name: 'Steel Beam', category: 'Material', color: '#6B7280' },
      { name: 'Concrete', category: 'Material', color: '#9CA3AF' },
      { name: 'Rebar', category: 'Material', color: '#4B5563' },
      { name: 'Decking', category: 'Material', color: '#8B5CF6' },
      { name: 'Bolts', category: 'Material', color: '#F59E0B' },
      { name: 'Welds', category: 'Material', color: '#EF4444' },
      
      // Status
      { name: 'Pre-existing Damage', category: 'Status', color: '#DC2626' },
      { name: 'Safety Issue', category: 'Status', color: '#F59E0B' },
      { name: 'Completed', category: 'Status', color: '#10B981' },
      { name: 'In Progress', category: 'Status', color: '#3B82F6' },
      { name: 'Needs Review', category: 'Status', color: '#F59E0B' },
      
      // Locations
      { name: 'Foundation', category: 'Location', color: '#6366F1' },
      { name: 'First Floor', category: 'Location', color: '#8B5CF6' },
      { name: 'Roof', category: 'Location', color: '#EC4899' },
      { name: 'Exterior', category: 'Location', color: '#14B8A6' },
      { name: 'Interior', category: 'Location', color: '#F97316' }
    ];
    
    const createdTags = await Promise.all(
      defaultTags.map(tag => 
        prisma.tag.upsert({
          where: {
            companyId_slug: {
              companyId,
              slug: createSlug(tag.name)
            }
          },
          update: {},
          create: {
            ...tag,
            slug: createSlug(tag.name),
            isSystem: true,
            companyId,
            createdById: userId
          }
        })
      )
    );
    
    return {
      message: 'Default tags initialized',
      count: createdTags.length
    };
  });
}

module.exports = routes;