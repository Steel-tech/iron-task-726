/**
 * Performance Optimization Middleware
 * Implements caching, query optimization, and performance monitoring
 */

const crypto = require('crypto');
const { promisify } = require('util');

/**
 * Memory-based cache for development, Redis for production
 */
class PerformanceCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
    this.useRedis = options.redis && process.env.NODE_ENV === 'production';
    this.redisClient = options.redis;
    this.hitCount = 0;
    this.missCount = 0;
    this.compressionThreshold = options.compressionThreshold || 1024; // 1KB
  }

  generateKey(prefix, data) {
    // Use SHA-256 instead of MD5 for security
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    return `${prefix}:${hash.substring(0, 16)}`; // Use first 16 chars for key length
  }

  async get(key) {
    if (this.useRedis && this.redisClient) {
      try {
        const result = await this.redisClient.get(key);
        if (result) {
          this.hitCount++;
          return JSON.parse(result);
        }
      } catch (error) {
        console.warn('Redis get error:', error.message);
        // Fall back to memory cache
      }
    }

    // Memory cache
    const entry = this.cache.get(key);
    if (entry) {
      if (Date.now() < entry.expires) {
        this.hitCount++;
        return entry.data;
      } else {
        this.cache.delete(key);
      }
    }

    this.missCount++;
    return null;
  }

  async set(key, data, customTtl) {
    const ttl = customTtl || this.ttl;
    const expires = Date.now() + ttl;

    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.setex(key, Math.floor(ttl / 1000), JSON.stringify(data));
        return;
      } catch (error) {
        console.warn('Redis set error:', error.message);
        // Fall back to memory cache
      }
    }

    // Memory cache with size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries (simple LRU)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { data, expires });
  }

  async invalidate(pattern) {
    if (this.useRedis && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (error) {
        console.warn('Redis invalidate error:', error.message);
      }
    }

    // Memory cache pattern matching
    for (const key of this.cache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) + '%' : '0%',
      cacheSize: this.cache.size,
      memoryUsage: process.memoryUsage()
    };
  }
}

/**
 * Query optimization for database operations
 */
class QueryOptimizer {
  constructor(prisma) {
    this.prisma = prisma;
    this.queryMetrics = new Map();
    this.slowQueryThreshold = 1000; // 1 second
  }

  /**
   * Optimized media queries with proper pagination
   */
  async getOptimizedMedia(filters, pagination) {
    const cacheKey = `media:${JSON.stringify({ filters, pagination })}`;
    const startTime = Date.now();

    try {
      // Build optimized where clause
      const where = {
        project: { companyId: filters.companyId }
      };

      if (filters.projectId) where.projectId = filters.projectId;
      if (filters.mediaType) where.mediaType = filters.mediaType;
      if (filters.status) where.status = filters.status;
      if (filters.userId) where.userId = filters.userId;
      if (filters.dateRange) {
        where.timestamp = {
          gte: new Date(filters.dateRange.start),
          lte: new Date(filters.dateRange.end)
        };
      }

      // Use cursor-based pagination for better performance
      const queryOptions = {
        where,
        select: {
          id: true,
          fileUrl: true,
          thumbnailUrl: true,
          mediaType: true,
          fileName: true,
          fileSize: true,
          timestamp: true,
          status: true,
          activityType: true,
          location: true,
          project: {
            select: { id: true, name: true }
          },
          user: {
            select: { id: true, name: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: pagination.limit + 1 // Fetch one extra to determine if more pages exist
      };

      if (pagination.cursor) {
        queryOptions.cursor = { id: pagination.cursor };
        queryOptions.skip = 1; // Skip the cursor item
      }

      const media = await this.prisma.media.findMany(queryOptions);
      
      // Check if there are more pages
      const hasNextPage = media.length > pagination.limit;
      if (hasNextPage) {
        media.pop(); // Remove the extra item
      }

      const result = {
        data: media,
        pagination: {
          hasNextPage,
          nextCursor: hasNextPage ? media[media.length - 1]?.id : null,
          limit: pagination.limit
        }
      };

      this.recordQueryMetrics('getOptimizedMedia', Date.now() - startTime);
      return result;

    } catch (error) {
      this.recordQueryMetrics('getOptimizedMedia', Date.now() - startTime, error);
      throw error;
    }
  }

  /**
   * Optimized project queries with selective includes
   */
  async getOptimizedProjects(companyId, options = {}) {
    const startTime = Date.now();

    try {
      const baseQuery = {
        where: { companyId },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          location: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { status: 'asc' }, // Active projects first
          { updatedAt: 'desc' }
        ]
      };

      // Add counts only if requested (expensive operations)
      if (options.includeCounts) {
        baseQuery.select._count = {
          select: {
            media: true,
            activities: true,
            members: true
          }
        };
      }

      // Add recent members only if requested
      if (options.includeMembers) {
        baseQuery.select.members = {
          take: 5,
          select: {
            user: {
              select: { id: true, name: true, email: true }
            },
            role: true,
            joinedAt: true
          },
          orderBy: { joinedAt: 'desc' }
        };
      }

      // Add recent activity only if requested
      if (options.includeRecentActivity) {
        baseQuery.select.activities = {
          take: 3,
          select: {
            id: true,
            name: true,
            createdAt: true,
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        };
      }

      const projects = await this.prisma.project.findMany(baseQuery);
      
      this.recordQueryMetrics('getOptimizedProjects', Date.now() - startTime);
      return projects;

    } catch (error) {
      this.recordQueryMetrics('getOptimizedProjects', Date.now() - startTime, error);
      throw error;
    }
  }

  /**
   * Optimized dashboard stats with parallel queries
   */
  async getDashboardStats(companyId, projectId = null) {
    const startTime = Date.now();

    try {
      const baseWhere = projectId 
        ? { projectId } 
        : { project: { companyId } };

      // Execute all queries in parallel
      const [
        mediaStats,
        projectStats,
        userStats,
        recentActivity,
        safetyStats,
        qualityStats
      ] = await Promise.all([
        // Media statistics
        this.prisma.media.aggregate({
          where: baseWhere,
          _count: { id: true },
          _sum: { fileSize: true }
        }),
        
        // Project statistics
        this.prisma.project.aggregate({
          where: { companyId },
          _count: { id: true }
        }),
        
        // Active user statistics
        this.prisma.user.count({
          where: { 
            companyMemberships: { some: { companyId } },
            isActive: true 
          }
        }),
        
        // Recent activity (last 24 hours)
        this.prisma.activity.count({
          where: {
            ...baseWhere,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        
        // Safety incidents (last 30 days)
        this.prisma.safetyIncident.aggregate({
          where: {
            ...baseWhere,
            occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          },
          _count: { id: true }
        }),
        
        // Quality inspections (last 30 days)
        this.prisma.qualityInspection.aggregate({
          where: {
            ...baseWhere,
            inspectionDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          },
          _count: { id: true },
          _avg: { score: true }
        })
      ]);

      const result = {
        media: {
          totalFiles: mediaStats._count.id,
          totalSize: mediaStats._sum.fileSize || 0,
          averageSize: mediaStats._count.id > 0 ? 
            Math.round((mediaStats._sum.fileSize || 0) / mediaStats._count.id) : 0
        },
        projects: {
          total: projectStats._count.id
        },
        users: {
          active: userStats
        },
        activity: {
          last24Hours: recentActivity
        },
        safety: {
          incidentsLast30Days: safetyStats._count.id
        },
        quality: {
          inspectionsLast30Days: qualityStats._count.id,
          averageScore: qualityStats._avg.score ? 
            Math.round(qualityStats._avg.score * 10) / 10 : null
        }
      };

      this.recordQueryMetrics('getDashboardStats', Date.now() - startTime);
      return result;

    } catch (error) {
      this.recordQueryMetrics('getDashboardStats', Date.now() - startTime, error);
      throw error;
    }
  }

  recordQueryMetrics(queryName, duration, error = null) {
    if (!this.queryMetrics.has(queryName)) {
      this.queryMetrics.set(queryName, {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowQueries: 0,
        errors: 0
      });
    }

    const metrics = this.queryMetrics.get(queryName);
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.averageDuration = Math.round(metrics.totalDuration / metrics.count);

    if (duration > this.slowQueryThreshold) {
      metrics.slowQueries++;
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }

    if (error) {
      metrics.errors++;
      console.error(`Query error in ${queryName}:`, error.message);
    }
  }

  getQueryMetrics() {
    return Object.fromEntries(this.queryMetrics);
  }
}

/**
 * Performance monitoring middleware
 */
class PerformanceMonitor {
  constructor() {
    this.requestMetrics = new Map();
    this.systemMetrics = {
      startTime: Date.now(),
      requestCount: 0,
      errorCount: 0
    };
    
    // Collect system metrics every minute
    setInterval(() => this.collectSystemMetrics(), 60000);
  }

  middleware() {
    return async (request, reply) => {
      const startTime = Date.now();
      const route = `${request.method} ${request.routerPath || request.url}`;

      request.startTime = startTime;
      request.performanceMetrics = {
        route,
        startTime: new Date(startTime).toISOString(),
        ip: request.realIp || request.ip,
        userAgent: request.headers['user-agent']
      };

      // Track request
      this.systemMetrics.requestCount++;

      reply.addHook('onSend', async (request, reply, payload) => {
        const duration = Date.now() - startTime;
        const statusCode = reply.statusCode;

        // Record metrics
        this.recordRequestMetrics(route, duration, statusCode);

        // Add performance headers
        reply.header('X-Response-Time', `${duration}ms`);
        reply.header('X-Request-ID', request.id);

        // Log slow requests
        if (duration > 1000) {
          console.warn('Slow request detected:', {
            route,
            duration: `${duration}ms`,
            statusCode,
            ip: request.realIp || request.ip,
            requestId: request.id
          });
        }

        // Track errors
        if (statusCode >= 400) {
          this.systemMetrics.errorCount++;
        }

        return payload;
      });
    };
  }

  recordRequestMetrics(route, duration, statusCode) {
    if (!this.requestMetrics.has(route)) {
      this.requestMetrics.set(route, {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        statusCodes: {},
        slowRequests: 0
      });
    }

    const metrics = this.requestMetrics.get(route);
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.averageDuration = Math.round(metrics.totalDuration / metrics.count);
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    
    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
    
    if (duration > 1000) {
      metrics.slowRequests++;
    }
  }

  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.systemMetrics.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    this.systemMetrics.uptime = Math.round((Date.now() - this.systemMetrics.startTime) / 1000);
    this.systemMetrics.timestamp = new Date().toISOString();
  }

  getMetrics() {
    return {
      system: this.systemMetrics,
      routes: Object.fromEntries(this.requestMetrics),
      summary: {
        totalRequests: this.systemMetrics.requestCount,
        totalErrors: this.systemMetrics.errorCount,
        errorRate: this.systemMetrics.requestCount > 0 ? 
          (this.systemMetrics.errorCount / this.systemMetrics.requestCount * 100).toFixed(2) + '%' : '0%',
        uptime: `${Math.round(this.systemMetrics.uptime / 60)} minutes`
      }
    };
  }
}

/**
 * Response compression and caching middleware
 */
function createCompressionMiddleware(options = {}) {
  const compressionThreshold = options.threshold || 1024; // 1KB
  
  return async (request, reply) => {
    const acceptEncoding = request.headers['accept-encoding'] || '';
    
    if (acceptEncoding.includes('gzip') || acceptEncoding.includes('br')) {
      reply.addHook('onSend', async (request, reply, payload) => {
        if (typeof payload === 'string' && payload.length > compressionThreshold) {
          // Add appropriate headers for caching
          const isStatic = request.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/);
          
          if (isStatic) {
            reply.header('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (request.method === 'GET') {
            reply.header('Cache-Control', 'public, max-age=300'); // 5 minutes
          }
          
          reply.header('Vary', 'Accept-Encoding');
        }
        
        return payload;
      });
    }
  };
}

/**
 * Secure token validation with timing attack protection
 */
function createSecureTokenValidator() {
  return {
    validateToken: (providedToken, expectedToken) => {
      if (!providedToken || !expectedToken) {
        return false;
      }
      
      // Use crypto.timingSafeEqual for timing attack protection
      const providedBuffer = Buffer.from(providedToken);
      const expectedBuffer = Buffer.from(expectedToken);
      
      if (providedBuffer.length !== expectedBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    },
    
    generateSecureToken: (length = 32) => {
      return crypto.randomBytes(length).toString('hex');
    }
  };
}

module.exports = {
  PerformanceCache,
  QueryOptimizer,
  PerformanceMonitor,
  createCompressionMiddleware,
  createSecureTokenValidator
};