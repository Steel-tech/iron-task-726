const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Validation schemas
const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().max(200).optional(),
  icon: z.string().max(50).optional()
});

const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().max(200).optional(),
  icon: z.string().max(50).optional()
});

const applyLabelSchema = z.object({
  projectId: z.string().uuid(),
  labelIds: z.array(z.string().uuid())
});

// Helper function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function routes(fastify, options) {
  // Get all labels for the company
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    const { type } = request.query;
    
    const where = { companyId };
    if (type) {
      where.type = type;
    }
    
    const labels = await prisma.label.findMany({
      where,
      include: {
        _count: {
          select: { projects: true }
        },
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });
    
    return labels;
  });
  
  // Get label types
  fastify.get('/types', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    
    const types = await prisma.label.findMany({
      where: { companyId },
      select: { type: true },
      distinct: ['type']
    });
    
    return types.map(t => t.type);
  });
  
  // Create a new label
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, companyId, role } = request.user;
    
    // Only admins and project managers can create labels
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    const data = createLabelSchema.parse(request.body);
    const slug = createSlug(data.name);
    
    // Check if label with this slug already exists
    const existing = await prisma.label.findUnique({
      where: {
        companyId_slug: {
          companyId,
          slug
        }
      }
    });
    
    if (existing) {
      return reply.code(409).send({ error: 'Label with this name already exists' });
    }
    
    const label = await prisma.label.create({
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
    
    return label;
  });
  
  // Update a label
  fastify.patch('/:labelId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId, role } = request.user;
    const { labelId } = request.params;
    
    // Only admins and project managers can update labels
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    const label = await prisma.label.findFirst({
      where: { id: labelId, companyId }
    });
    
    if (!label) {
      return reply.code(404).send({ error: 'Label not found' });
    }
    
    const data = updateLabelSchema.parse(request.body);
    
    const updatedLabel = await prisma.label.update({
      where: { id: labelId },
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
    
    return updatedLabel;
  });
  
  // Delete a label
  fastify.delete('/:labelId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId, role } = request.user;
    const { labelId } = request.params;
    
    // Only admins can delete labels
    if (role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    const label = await prisma.label.findFirst({
      where: { id: labelId, companyId }
    });
    
    if (!label) {
      return reply.code(404).send({ error: 'Label not found' });
    }
    
    await prisma.label.delete({
      where: { id: labelId }
    });
    
    return { success: true };
  });
  
  // Apply labels to project
  fastify.post('/apply', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id: userId, role } = request.user;
    const { projectId, labelIds } = applyLabelSchema.parse(request.body);
    
    // Only admins and project managers can apply labels
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        company: {
          users: { some: { id: userId } }
        }
      }
    });
    
    if (!project) {
      return reply.code(404).send({ error: 'Project not found or access denied' });
    }
    
    // Get existing labels
    const existingLabels = await prisma.projectLabel.findMany({
      where: { projectId },
      select: { labelId: true }
    });
    
    const existingLabelIds = existingLabels.map(l => l.labelId);
    const toAdd = labelIds.filter(id => !existingLabelIds.includes(id));
    const toRemove = existingLabelIds.filter(id => !labelIds.includes(id));
    
    // Add new labels
    if (toAdd.length > 0) {
      await prisma.projectLabel.createMany({
        data: toAdd.map(labelId => ({
          projectId,
          labelId,
          assignedById: userId
        }))
      });
    }
    
    // Remove old labels
    if (toRemove.length > 0) {
      await prisma.projectLabel.deleteMany({
        where: {
          projectId,
          labelId: { in: toRemove }
        }
      });
    }
    
    // Return updated project with labels
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        labels: {
          include: {
            label: true
          }
        }
      }
    });
    
    return updatedProject;
  });
  
  // Get projects by labels
  fastify.get('/projects', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    const { labels, matchAll } = request.query;
    
    if (!labels) {
      return reply.code(400).send({ error: 'Labels parameter required' });
    }
    
    const labelIds = labels.split(',');
    
    const projects = await prisma.project.findMany({
      where: {
        companyId,
        labels: matchAll ? {
          every: {
            labelId: { in: labelIds }
          }
        } : {
          some: {
            labelId: { in: labelIds }
          }
        }
      },
      include: {
        labels: {
          include: {
            label: true
          }
        },
        _count: {
          select: { media: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return projects;
  });
  
  // Initialize default labels
  fastify.post('/init-defaults', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId, role, id: userId } = request.user;
    
    // Only admins can initialize default labels
    if (role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
    
    const defaultLabels = [
      // Project Types
      { name: 'Commercial', type: 'project_type', color: '#3B82F6', icon: 'building' },
      { name: 'Industrial', type: 'project_type', color: '#6366F1', icon: 'factory' },
      { name: 'Infrastructure', type: 'project_type', color: '#8B5CF6', icon: 'bridge' },
      { name: 'Residential', type: 'project_type', color: '#EC4899', icon: 'home' },
      
      // Project Status
      { name: 'Planning', type: 'project_status', color: '#6B7280', icon: 'pencil' },
      { name: 'In Progress', type: 'project_status', color: '#3B82F6', icon: 'clock' },
      { name: 'On Hold', type: 'project_status', color: '#F59E0B', icon: 'pause' },
      { name: 'Completed', type: 'project_status', color: '#10B981', icon: 'check' },
      
      // Budget Range
      { name: 'Under $1M', type: 'budget_range', color: '#10B981', icon: 'dollar' },
      { name: '$1M - $5M', type: 'budget_range', color: '#3B82F6', icon: 'dollar' },
      { name: '$5M - $10M', type: 'budget_range', color: '#8B5CF6', icon: 'dollar' },
      { name: 'Over $10M', type: 'budget_range', color: '#EC4899', icon: 'dollar' },
      
      // Sustainability
      { name: 'LEED Certified', type: 'sustainability', color: '#10B981', icon: 'leaf' },
      { name: 'Energy Efficient', type: 'sustainability', color: '#14B8A6', icon: 'lightning' },
      { name: 'Recycled Materials', type: 'sustainability', color: '#059669', icon: 'recycle' }
    ];
    
    const createdLabels = await Promise.all(
      defaultLabels.map(label => 
        prisma.label.upsert({
          where: {
            companyId_slug: {
              companyId,
              slug: createSlug(label.name)
            }
          },
          update: {},
          create: {
            ...label,
            slug: createSlug(label.name),
            companyId,
            createdById: userId
          }
        })
      )
    );
    
    return {
      message: 'Default labels initialized',
      count: createdLabels.length
    };
  });
}

module.exports = routes;