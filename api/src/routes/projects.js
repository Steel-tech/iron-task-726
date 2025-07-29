const prisma = require('../lib/prisma');

async function routes(fastify, options) {
  // Get all projects
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { role, userId } = request.user;
      
      let where = {};
      // Workers only see projects they have media in
      if (role === 'WORKER') {
        where = {
          media: {
            some: {
              userId: userId
            }
          }
        };
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          _count: {
            select: { media: true }
          },
          labels: {
            include: {
              label: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      request.logger.info('Projects fetched successfully', {
        count: projects.length,
        userRole: role
      });

      return projects;
    } catch (error) {
      request.logger.error('Failed to fetch projects', {
        error: error.message,
        stack: error.stack
      });
      return reply.code(500).send({ 
        error: 'Failed to fetch projects',
        message: error.message 
      });
    }
  });

  // Get project by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          _count: {
            select: { media: true }
          },
          labels: {
            include: {
              label: true
            }
          }
        },
      });

      if (!project) {
        request.logger.warn('Project not found', { projectId: id });
        return reply.code(404).send({ error: 'Project not found' });
      }

      request.logger.info('Project fetched successfully', {
        projectId: id,
        projectName: project.name
      });

      return project;
    } catch (error) {
      request.logger.error('Failed to fetch project', {
        error: error.message,
        stack: error.stack,
        projectId: id
      });
      return reply.code(500).send({ 
        error: 'Failed to fetch project',
        message: error.message 
      });
    }
  });

  // Get project creation form data (companies, etc.)
  fastify.get('/new', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { role } = request.user;
      
      if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
        request.logger.security('Unauthorized project creation attempt', {
          userRole: role
        });
        return reply.code(403).send({ error: 'Unauthorized to create projects' });
      }

      // Return any data needed for the form
      const companies = await prisma.company.findMany({
        select: { id: true, name: true }
      });

      return {
        companies,
        canCreate: true
      };
    } catch (error) {
      request.logger.error('Failed to fetch project form data', {
        error: error.message,
        stack: error.stack
      });
      return reply.code(500).send({ 
        error: 'Failed to load form data',
        message: error.message 
      });
    }
  });

  // Create new project
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      request.logger.info('Project creation started', {
        projectData: { name: request.body.name, jobNumber: request.body.jobNumber, location: request.body.location }
      });
      
      const { name, jobNumber, location, address, companyId } = request.body;
      const { role, companyId: userCompanyId } = request.user;
      
      if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
        request.logger.security('Unauthorized project creation attempt', {
          userRole: role
        });
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      // Validation
      if (!name || !jobNumber || !location) {
        request.logger.warn('Project creation failed - missing required fields', {
          received: { name: !!name, jobNumber: !!jobNumber, location: !!location }
        });
        return reply.code(400).send({ 
          error: 'Missing required fields',
          message: 'Project name, job number, and location are required',
          received: { name: !!name, jobNumber: !!jobNumber, location: !!location }
        });
      }

      const project = await prisma.project.create({
        data: {
          name,
          jobNumber,
          location,
          address: address || null,
          companyId: companyId || userCompanyId,
        },
        include: {
          company: true,
          _count: {
            select: { media: true }
          }
        }
      });

      request.logger.business('Project created successfully', {
        projectId: project.id,
        projectName: project.name,
        jobNumber: project.jobNumber,
        companyId: project.companyId
      });
      
      return project;
    } catch (error) {
      request.logger.error('Failed to create project', {
        error: error.message,
        stack: error.stack,
        projectData: { name, jobNumber, location, address }
      });
      return reply.code(500).send({ 
        error: 'Failed to create project',
        message: error.message || 'An unexpected error occurred'
      });
    }
  });

  // Update project
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, location, status } = request.body;
      const { role } = request.user;
      
      if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
        request.logger.security('Unauthorized project update attempt', {
          userRole: role,
          projectId: id
        });
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      const project = await prisma.project.update({
        where: { id },
        data: {
          name,
          description,
          location,
          status,
        },
      });

      request.logger.business('Project updated successfully', {
        projectId: id,
        updatedFields: { name, description, location, status }
      });

      return project;
    } catch (error) {
      request.logger.error('Failed to update project', {
        error: error.message,
        stack: error.stack,
        projectId: id,
        updateData: { name, description, location, status }
      });
      return reply.code(500).send({ 
        error: 'Failed to update project',
        message: error.message 
      });
    }
  });

  // Delete project
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { role } = request.user;
      
      if (role !== 'ADMIN') {
        request.logger.security('Unauthorized project deletion attempt', {
          userRole: role,
          projectId: id
        });
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      // Check if project has photos
      const photoCount = await prisma.photo.count({
        where: { projectId: id },
      });

      if (photoCount > 0) {
        request.logger.warn('Project deletion blocked - contains photos', {
          projectId: id,
          photoCount
        });
        return reply.code(400).send({ 
          error: 'Cannot delete project with photos. Delete all photos first.' 
        });
      }

      await prisma.project.delete({
        where: { id },
      });

      request.logger.business('Project deleted successfully', {
        projectId: id
      });

      return { message: 'Project deleted successfully' };
    } catch (error) {
      request.logger.error('Failed to delete project', {
        error: error.message,
        stack: error.stack,
        projectId: id
      });
      return reply.code(500).send({ 
        error: 'Failed to delete project',
        message: error.message 
      });
    }
  });
}

module.exports = routes;