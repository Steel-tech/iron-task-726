const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function routes(fastify, options) {
  // Get dashboard stats
  fastify.get('/stats', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { role, userId } = request.user;
    
    // Base queries
    let projectWhere = {};
    let mediaWhere = {};
    
    // Workers only see their own data
    if (role === 'WORKER') {
      mediaWhere.userId = userId;
      projectWhere = {
        media: {
          some: {
            userId: userId
          }
        }
      };
    }

    // Get counts
    const [totalProjects, totalMedia, totalPhotos, totalVideos, totalUsers, recentMedia] = await Promise.all([
      prisma.project.count({ where: projectWhere }),
      prisma.media.count({ where: mediaWhere }),
      prisma.media.count({ where: { ...mediaWhere, mediaType: 'PHOTO' } }),
      prisma.media.count({ where: { ...mediaWhere, mediaType: { in: ['VIDEO', 'DUAL_VIDEO'] } } }),
      role === 'ADMIN' || role === 'PROJECT_MANAGER' 
        ? prisma.user.count() 
        : Promise.resolve(0),
      prisma.media.findMany({
        where: mediaWhere,
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true
            }
          },
          project: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    return {
      totalProjects,
      totalMedia,
      totalPhotos,
      totalVideos,
      totalUsers,
      recentMedia
    };
  });

  // Get activity timeline
  fastify.get('/activity', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { role, userId } = request.user;
    const { limit = 20, offset = 0 } = request.query;
    
    let where = {};
    if (role === 'WORKER') {
      where.userId = userId;
    }

    const activities = await prisma.photo.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: {
        uploadedAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const total = await prisma.photo.count({ where });

    return {
      activities,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  });
}

module.exports = routes;