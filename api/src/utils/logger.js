const env = require('../config/env')
const fs = require('fs')
const path = require('path')

/**
 * Structured logging utility with request correlation
 * Provides consistent logging format across the application
 */
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || env.LOG_LEVEL || 'debug' // Set to debug for better logging
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    }

    // Set up log file paths
    this.logsDir = path.join(process.cwd(), '..', 'logs')
    this.debugLogFile = path.join(this.logsDir, 'debug.log')
    this.errorLogFile = path.join(this.logsDir, 'error.log')

    // Ensure logs directory exists
    this.ensureLogsDirectory()
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDirectory() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true })
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error.message)
    }
  }

  /**
   * Write log entry to file
   */
  writeToFile(level, logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n'

      // Write to debug log (all levels)
      fs.appendFileSync(this.debugLogFile, logLine)

      // Also write errors to separate error log
      if (level === 'error') {
        fs.appendFileSync(this.errorLogFile, logLine)
      }
    } catch (error) {
      console.error('Failed to write to log file:', error.message)
    }
  }

  /**
   * Create a logger instance with context
   */
  createContext(context = {}) {
    return new ContextLogger(this, context)
  }

  /**
   * Log with specified level
   */
  log(level, message, meta = {}, context = {}) {
    if (this.logLevels[level] > this.logLevels[this.logLevel]) {
      return // Skip if below log level
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...context,
      ...meta,
      environment: process.env.NODE_ENV || 'development',
      service: 'fsw-api',
      version: process.env.npm_package_version || '1.0.0',
    }

    // Remove undefined/null values
    Object.keys(logEntry).forEach(key => {
      if (logEntry[key] === undefined || logEntry[key] === null) {
        delete logEntry[key]
      }
    })

    const nodeEnv = process.env.NODE_ENV || 'development'
    const output =
      nodeEnv === 'production'
        ? JSON.stringify(logEntry)
        : this.formatForDevelopment(logEntry)

    // Write to file first
    this.writeToFile(level, logEntry)

    // Then output to console
    switch (level) {
      case 'error':
        console.error(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'debug':
        console.debug(output)
        break
      default:
        console.log(output)
    }
  }

  /**
   * Format log entry for development readability
   */
  formatForDevelopment(logEntry) {
    const {
      timestamp,
      level,
      message,
      requestId,
      userId,
      method,
      url,
      statusCode,
      duration,
      ...meta
    } = logEntry

    const timeStr = new Date(timestamp).toLocaleTimeString()
    const requestInfo = requestId ? `[${requestId}]` : ''
    const userInfo = userId ? `[user:${userId}]` : ''
    const httpInfo = method && url ? `${method} ${url}` : ''
    const statusInfo = statusCode ? `${statusCode}` : ''
    const durationInfo = duration ? `(${duration}ms)` : ''

    let formattedMessage = `${timeStr} ${level} ${requestInfo}${userInfo} ${message}`

    if (httpInfo) {
      formattedMessage += ` - ${httpInfo} ${statusInfo} ${durationInfo}`
    }

    if (Object.keys(meta).length > 0) {
      formattedMessage += `\n  ${JSON.stringify(meta, null, 2)}`
    }

    return formattedMessage
  }

  /**
   * Log methods
   */
  error(message, meta = {}, context = {}) {
    this.log('error', message, meta, context)
  }

  warn(message, meta = {}, context = {}) {
    this.log('warn', message, meta, context)
  }

  info(message, meta = {}, context = {}) {
    this.log('info', message, meta, context)
  }

  debug(message, meta = {}, context = {}) {
    this.log('debug', message, meta, context)
  }

  /**
   * HTTP request logging
   */
  http(requestInfo) {
    const { method, url, statusCode, duration, requestId, userId, ip } =
      requestInfo

    this.info(
      'HTTP Request',
      {
        method,
        url,
        statusCode,
        duration,
        ip,
      },
      {
        requestId,
        userId,
        type: 'http_request',
      }
    )
  }

  /**
   * Database operation logging
   */
  database(operation, meta = {}, context = {}) {
    this.debug(
      'Database Operation',
      {
        operation,
        ...meta,
      },
      {
        ...context,
        type: 'database',
      }
    )
  }

  /**
   * Authentication event logging
   */
  auth(event, meta = {}, context = {}) {
    this.info(
      'Authentication Event',
      {
        event,
        ...meta,
      },
      {
        ...context,
        type: 'authentication',
      }
    )
  }

  /**
   * Security event logging
   */
  security(event, meta = {}, context = {}) {
    this.warn(
      'Security Event',
      {
        event,
        ...meta,
      },
      {
        ...context,
        type: 'security',
      }
    )
  }

  /**
   * Business logic logging
   */
  business(event, meta = {}, context = {}) {
    this.info(
      'Business Event',
      {
        event,
        ...meta,
      },
      {
        ...context,
        type: 'business',
      }
    )
  }

  /**
   * Performance logging
   */
  performance(metric, meta = {}, context = {}) {
    this.info(
      'Performance Metric',
      {
        metric,
        ...meta,
      },
      {
        ...context,
        type: 'performance',
      }
    )
  }
}

/**
 * Context logger that maintains request context
 */
class ContextLogger {
  constructor(logger, context) {
    this.logger = logger
    this.context = context
  }

  error(message, meta = {}) {
    this.logger.error(message, meta, this.context)
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta, this.context)
  }

  info(message, meta = {}) {
    this.logger.info(message, meta, this.context)
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta, this.context)
  }

  http(requestInfo) {
    this.logger.http({ ...requestInfo, ...this.context })
  }

  database(operation, meta = {}) {
    this.logger.database(operation, meta, this.context)
  }

  auth(event, meta = {}) {
    this.logger.auth(event, meta, this.context)
  }

  security(event, meta = {}) {
    this.logger.security(event, meta, this.context)
  }

  business(event, meta = {}) {
    this.logger.business(event, meta, this.context)
  }

  performance(metric, meta = {}) {
    this.logger.performance(metric, meta, this.context)
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext) {
    return new ContextLogger(this.logger, {
      ...this.context,
      ...additionalContext,
    })
  }

  /**
   * Time a function execution
   */
  async time(label, fn) {
    const start = Date.now()
    this.debug(`Starting ${label}`)

    try {
      const result = await fn()
      const duration = Date.now() - start
      this.performance(label, { duration, success: true })
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.performance(label, {
        duration,
        success: false,
        error: error.message,
      })
      throw error
    }
  }
}

/**
 * Request correlation middleware for Fastify
 */
function requestCorrelationMiddleware() {
  return async (request, reply) => {
    // Ensure request ID exists (should be set by security middleware)
    if (!request.id) {
      request.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Create request context
    const context = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      ip: request.realIp || request.ip,
      userAgent: request.headers['user-agent'],
    }

    // Add user context if authenticated
    if (request.user) {
      context.userId = request.user.id
      context.userRole = request.user.role
      context.companyId = request.user.companyId
    }

    // Create logger for this request
    request.logger = logger.createContext(context)

    // Log request start
    const startTime = Date.now()
    request.logger.debug('Request started')

    // Log request completion using onResponse hook
    request.server.addHook('onResponse', async (request, reply) => {
      const duration = Date.now() - startTime

      request.logger.http({
        statusCode: reply.statusCode,
        duration,
        responseSize: reply.getHeader('content-length') || 0,
      })

      // Log slow requests
      if (duration > 5000) {
        // 5 seconds
        request.logger.warn('Slow request detected', {
          duration,
          threshold: 5000,
        })
      }
    })
  }
}

/**
 * Error logging middleware
 */
function errorLoggingMiddleware() {
  return (error, request, reply) => {
    const context = {
      requestId: request.id,
      userId: request.user?.id,
      method: request.method,
      url: request.url,
      ip: request.realIp || request.ip,
    }

    const errorLogger = logger.createContext(context)

    // Log error with full context
    errorLogger.error('Request failed', {
      error: error.message,
      stack: env.NODE_ENV === 'development' ? error.stack : undefined,
      statusCode: error.statusCode || 500,
      validation: error.validation,
      code: error.code,
    })

    // Log security-related errors differently
    if (error.statusCode === 401 || error.statusCode === 403) {
      errorLogger.security('Access denied', {
        statusCode: error.statusCode,
        reason: error.message,
      })
    }

    // Log rate limiting violations
    if (error.statusCode === 429) {
      errorLogger.security('Rate limit exceeded', {
        ip: request.realIp || request.ip,
        endpoint: request.url,
      })
    }
  }
}

// Create singleton logger instance
const logger = new Logger()

module.exports = {
  Logger,
  ContextLogger,
  logger,
  requestCorrelationMiddleware,
  errorLoggingMiddleware,
}
