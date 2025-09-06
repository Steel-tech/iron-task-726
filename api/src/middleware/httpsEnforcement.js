const env = require('../config/env')

/**
 * HTTPS enforcement middleware
 * Redirects HTTP requests to HTTPS in production
 */
function httpsEnforcement() {
  return async (request, reply) => {
    // Only enforce HTTPS in production
    if (env.NODE_ENV !== 'production') {
      return
    }

    // Check if request is already HTTPS
    const isHttps =
      request.headers['x-forwarded-proto'] === 'https' ||
      request.protocol === 'https' ||
      request.secure ||
      request.connection.encrypted

    if (!isHttps) {
      // Construct HTTPS URL
      const host = request.headers.host
      const httpsUrl = `https://${host}${request.url}`

      // Log the redirect for monitoring
      const logger = require('../utils/logger') || console
      logger.info('HTTPS redirect performed', {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent']?.substring(0, 100)
      })

      // Redirect to HTTPS
      return reply.code(301).redirect(httpsUrl)
    }
  }
}

/**
 * Comprehensive security headers middleware
 */
function securityHeaders() {
  return async (request, reply) => {
    const isProduction = env.NODE_ENV === 'production'

    // Strict Transport Security (HSTS)
    if (isProduction) {
      reply.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }

    // Content Security Policy (additional headers beyond Helmet)
    if (isProduction) {
      reply.header('Expect-CT', 'max-age=86400, enforce')
    }

    // Additional security headers
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('X-XSS-Protection', '1; mode=block')
    reply.header('X-Download-Options', 'noopen')
    reply.header('X-Permitted-Cross-Domain-Policies', 'none')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Remove server fingerprinting
    reply.removeHeader('X-Powered-By')
    reply.removeHeader('Server')

    // Custom application headers
    reply.header('X-Request-ID', request.id)
    reply.header('X-API-Version', require('../../package.json').version)

    // Cache control for API responses
    if (request.url.startsWith('/api/')) {
      reply.header(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      )
      reply.header('Pragma', 'no-cache')
      reply.header('Expires', '0')
    }
  }
}

/**
 * Request validation and sanitization
 */
function requestValidation() {
  return async (request, reply) => {
    // Block requests with suspicious patterns
    const suspiciousPatterns = [
      /\.\.\//, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript protocol
      /data:.*base64/i, // Suspicious data URLs
      /eval\s*\(/i, // Code execution attempts
    ]

    const urlToCheck = decodeURIComponent(request.url)
    const userAgent = request.headers['user-agent'] || ''

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(urlToCheck) || pattern.test(userAgent)) {
        const logger = require('../utils/logger') || console
        logger.warn('Suspicious request blocked', {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: userAgent.substring(0, 200),
          pattern: pattern.toString()
        })

        return reply.code(400).send({ error: 'Invalid request' })
      }
    }

    // Block requests with excessive headers (potential attack)
    if (Object.keys(request.headers).length > 50) {
      const logger = require('../utils/logger') || console
      logger.warn('Request with excessive headers blocked', {
        ip: request.ip,
        headerCount: Object.keys(request.headers).length,
        method: request.method,
        url: request.url
      })
      return reply.code(400).send({ error: 'Too many headers' })
    }

    // Block requests with suspicious content-length
    const contentLength = parseInt(request.headers['content-length'] || '0')
    if (contentLength > 100 * 1024 * 1024) {
      // 100MB
      const logger = require('../utils/logger') || console
      logger.warn('Request with excessive content-length blocked', {
        ip: request.ip,
        contentLength,
        method: request.method,
        url: request.url
      })
      return reply.code(413).send({ error: 'Payload too large' })
    }
  }
}

/**
 * IP whitelisting/blacklisting middleware
 */
function ipFiltering() {
  // In production, you might want to implement IP-based filtering
  const blacklistedIPs = new Set([
    // Add known malicious IPs here
  ])

  const whitelistedIPs = new Set([
    // Add trusted IPs here (optional)
  ])

  return async (request, reply) => {
    const clientIP = request.realIp || request.ip

    // Check blacklist
    if (blacklistedIPs.has(clientIP)) {
      const logger = require('../utils/logger') || console
      logger.warn('Blacklisted IP blocked', { ip: clientIP })
      return reply.code(403).send({ error: 'Access denied' })
    }

    // If whitelist is configured and IP is not whitelisted
    if (whitelistedIPs.size > 0 && !whitelistedIPs.has(clientIP)) {
      const logger = require('../utils/logger') || console
      logger.warn('Non-whitelisted IP blocked', { ip: clientIP })
      return reply.code(403).send({ error: 'Access denied' })
    }
  }
}

/**
 * Request logging middleware for security monitoring
 */
function securityLogging() {
  const suspiciousEvents = []
  const MAX_EVENTS = 1000

  return async (request, reply) => {
    const event = {
      timestamp: new Date().toISOString(),
      ip: request.realIp || request.ip,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      referer: request.headers.referer,
      contentType: request.headers['content-type'],
    }

    // Log authentication failures
    if (request.url.includes('/auth/') && request.method === 'POST') {
      suspiciousEvents.push({ ...event, type: 'auth_attempt' })
    }

    // Log file upload attempts
    if (request.url.includes('/upload') && request.method === 'POST') {
      suspiciousEvents.push({ ...event, type: 'file_upload' })
    }

    // Maintain circular buffer
    if (suspiciousEvents.length > MAX_EVENTS) {
      suspiciousEvents.shift()
    }

    // In production, you would send these to a security monitoring service
    if (env.NODE_ENV === 'production' && Math.random() < 0.01) {
      // 1% sampling for performance
      const logger = require('../utils/logger') || console
      logger.info('Security event sample', event)
    }
  }
}

module.exports = {
  httpsEnforcement,
  securityHeaders,
  requestValidation,
  ipFiltering,
  securityLogging,
}
