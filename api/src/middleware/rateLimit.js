const constants = require('../config/constants');
const { RateLimitError } = require('../utils/errors');

/**
 * Enhanced rate limiting middleware for Fastify
 * Supports different limits for different endpoint types
 */
class RateLimiter {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Clean every 5 minutes
  }

  /**
   * Create rate limit middleware with custom configuration
   */
  create(options = {}) {
    const config = {
      windowMs: options.windowMs || constants.RATE_LIMIT_WINDOW_MS,
      max: options.max || constants.RATE_LIMIT_MAX_REQUESTS,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      message: options.message || 'Too many requests, please try again later.',
      standardHeaders: options.standardHeaders !== false,
      legacyHeaders: options.legacyHeaders === true,
      onLimitReached: options.onLimitReached || null
    };

    return async (request, reply) => {
      const key = config.keyGenerator(request);
      const now = Date.now();
      
      // Get current window data
      const windowData = this.getWindowData(key, now, config.windowMs);
      
      // Check if limit exceeded
      if (windowData.count >= config.max) {
        const resetTime = windowData.windowStart + config.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        
        // Add rate limit headers
        if (config.standardHeaders) {
          reply.header('RateLimit-Limit', config.max);
          reply.header('RateLimit-Remaining', 0);
          reply.header('RateLimit-Reset', new Date(resetTime).toISOString());
        }
        
        if (config.legacyHeaders) {
          reply.header('X-RateLimit-Limit', config.max);
          reply.header('X-RateLimit-Remaining', 0);
          reply.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
        }
        
        reply.header('Retry-After', retryAfter);
        
        // Call onLimitReached callback if provided
        if (config.onLimitReached) {
          config.onLimitReached(request, reply);
        }
        
        throw new RateLimitError(config.message);
      }
      
      // Add this request to the window
      this.addRequest(key, now, config.windowMs);
      
      // Add success headers
      if (config.standardHeaders) {
        const remaining = Math.max(0, config.max - windowData.count - 1);
        reply.header('RateLimit-Limit', config.max);
        reply.header('RateLimit-Remaining', remaining);
        reply.header('RateLimit-Reset', new Date(windowData.windowStart + config.windowMs).toISOString());
      }
      
      if (config.legacyHeaders) {
        const remaining = Math.max(0, config.max - windowData.count - 1);
        reply.header('X-RateLimit-Limit', config.max);
        reply.header('X-RateLimit-Remaining', remaining);
        reply.header('X-RateLimit-Reset', Math.ceil((windowData.windowStart + config.windowMs) / 1000));
      }
    };
  }

  /**
   * Default key generator - uses validated IP address
   */
  defaultKeyGenerator(request) {
    return this.getValidatedIP(request);
  }

  /**
   * Get validated IP address to prevent spoofing
   */
  getValidatedIP(request) {
    // If behind a trusted proxy (production)
    if (process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true') {
      // Get the first IP from X-Forwarded-For (most likely real client IP)
      const forwardedFor = request.headers['x-forwarded-for'];
      if (forwardedFor) {
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        // Validate the IP format
        const firstIP = ips[0];
        if (this.isValidIP(firstIP)) {
          return firstIP;
        }
      }
      
      // Fallback to X-Real-IP
      const realIP = request.headers['x-real-ip'];
      if (realIP && this.isValidIP(realIP)) {
        return realIP;
      }
    }
    
    // Use direct connection IP (most secure for non-proxy setups)
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  /**
   * Validate IP address format
   */
  isValidIP(ip) {
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Authenticated user key generator
   */
  userKeyGenerator(request) {
    return request.user ? `user:${request.user.id}` : `ip:${this.getValidatedIP(request)}`;
  }

  /**
   * IP + endpoint key generator
   */
  endpointKeyGenerator(request) {
    return `${this.getValidatedIP(request)}:${request.method}:${request.routerPath || request.url}`;
  }

  /**
   * Get window data for a key
   */
  getWindowData(key, now, windowMs) {
    const entry = this.store.get(key);
    
    if (!entry) {
      return { count: 0, windowStart: now };
    }
    
    // Check if we need a new window
    if (now - entry.windowStart >= windowMs) {
      return { count: 0, windowStart: now };
    }
    
    return entry;
  }

  /**
   * Add a request to the window
   */
  addRequest(key, now, windowMs) {
    const entry = this.store.get(key);
    
    if (!entry || now - entry.windowStart >= windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
    } else {
      entry.count++;
      this.store.set(key, entry);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const maxAge = Math.max(
      constants.RATE_LIMIT_WINDOW_MS,
      constants.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
    );
    
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart > maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter and cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Predefined rate limit configurations

/**
 * General API rate limit - 100 requests per 15 minutes per IP
 */
const apiRateLimit = rateLimiter.create({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests, please try again later.',
  keyGenerator: (req) => rateLimiter.getValidatedIP(req)
});

/**
 * Authenticated user rate limit - 500 requests per 15 minutes per user
 */
const userRateLimit = rateLimiter.create({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 500,
  message: 'Too many requests from your account, please try again later.',
  keyGenerator: rateLimiter.userKeyGenerator
});

/**
 * Auth endpoints rate limit - 5 attempts per 15 minutes per IP/email
 */
const authRateLimit = rateLimiter.create({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req) => `${rateLimiter.getValidatedIP(req)}:${req.body?.email || 'unknown'}`,
  onLimitReached: (req, reply) => {
    // Log suspicious activity
    console.warn(`Rate limit exceeded for auth attempt from ${rateLimiter.getValidatedIP(req)} with email ${req.body?.email}`);
  }
});

/**
 * File upload rate limit - 20 uploads per hour per user
 */
const uploadRateLimit = rateLimiter.create({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many file uploads, please try again later.',
  keyGenerator: rateLimiter.userKeyGenerator
});

/**
 * Report generation rate limit - 10 reports per hour per user
 */
const reportRateLimit = rateLimiter.create({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many report generation requests, please try again later.',
  keyGenerator: rateLimiter.userKeyGenerator
});

/**
 * Email/SMS rate limit - 5 notifications per hour per user
 */
const notificationRateLimit = rateLimiter.create({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many notification requests, please try again later.',
  keyGenerator: rateLimiter.userKeyGenerator
});

/**
 * Search rate limit - 50 searches per 15 minutes per IP
 */
const searchRateLimit = rateLimiter.create({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Too many search requests, please try again later.',
  keyGenerator: (req) => rateLimiter.getValidatedIP(req)
});

/**
 * Admin endpoints rate limit - 200 requests per 15 minutes per user
 */
const adminRateLimit = rateLimiter.create({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many admin requests, please try again later.',
  keyGenerator: rateLimiter.userKeyGenerator
});

module.exports = {
  RateLimiter,
  rateLimiter,
  
  // Predefined limits
  apiRateLimit,
  userRateLimit,
  authRateLimit,
  uploadRateLimit,
  reportRateLimit,
  notificationRateLimit,
  searchRateLimit,
  adminRateLimit
};