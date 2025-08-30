const fs = require('fs')
const path = require('path')

/**
 * Debug routes for log viewing and system diagnostics
 */
async function debugRoutes(fastify, options) {
  const logsDir = path.join(process.cwd(), '..', 'logs')
  const debugLogFile = path.join(logsDir, 'debug.log')
  const errorLogFile = path.join(logsDir, 'error.log')

  // Get debug logs
  fastify.get('/logs/debug', async (request, reply) => {
    try {
      const { lines = 50, format = 'json' } = request.query

      if (!fs.existsSync(debugLogFile)) {
        return reply.code(404).send({ error: 'Debug log file not found' })
      }

      const logContent = fs.readFileSync(debugLogFile, 'utf8')
      const logLines = logContent
        .trim()
        .split('\n')
        .filter(line => line)
      const recentLines = logLines.slice(-parseInt(lines))

      if (format === 'raw') {
        return reply.type('text/plain').send(recentLines.join('\n'))
      }

      // Parse JSON logs
      const parsedLogs = recentLines.map((line, index) => {
        try {
          return JSON.parse(line)
        } catch (e) {
          return {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: `Failed to parse log line ${index}: ${line}`,
          }
        }
      })

      return reply.send({
        total: logLines.length,
        showing: recentLines.length,
        logs: parsedLogs,
      })
    } catch (error) {
      fastify.log.error('Failed to read debug logs:', error)
      return reply.code(500).send({ error: 'Failed to read debug logs' })
    }
  })

  // Get error logs
  fastify.get('/logs/errors', async (request, reply) => {
    try {
      const { lines = 20, format = 'json' } = request.query

      if (!fs.existsSync(errorLogFile)) {
        return reply.send({ total: 0, showing: 0, logs: [] })
      }

      const logContent = fs.readFileSync(errorLogFile, 'utf8')
      const logLines = logContent
        .trim()
        .split('\n')
        .filter(line => line)
      const recentLines = logLines.slice(-parseInt(lines))

      if (format === 'raw') {
        return reply.type('text/plain').send(recentLines.join('\n'))
      }

      // Parse JSON logs
      const parsedLogs = recentLines.map((line, index) => {
        try {
          return JSON.parse(line)
        } catch (e) {
          return {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: `Failed to parse log line ${index}: ${line}`,
          }
        }
      })

      return reply.send({
        total: logLines.length,
        showing: recentLines.length,
        logs: parsedLogs,
      })
    } catch (error) {
      fastify.log.error('Failed to read error logs:', error)
      return reply.code(500).send({ error: 'Failed to read error logs' })
    }
  })

  // Get log statistics
  fastify.get('/logs/stats', async (request, reply) => {
    try {
      const stats = {
        debugLog: {
          exists: fs.existsSync(debugLogFile),
          size: 0,
          lines: 0,
          lastModified: null,
        },
        errorLog: {
          exists: fs.existsSync(errorLogFile),
          size: 0,
          lines: 0,
          lastModified: null,
        },
      }

      if (stats.debugLog.exists) {
        const debugStat = fs.statSync(debugLogFile)
        const debugContent = fs.readFileSync(debugLogFile, 'utf8')
        stats.debugLog.size = debugStat.size
        stats.debugLog.lines = debugContent
          .split('\n')
          .filter(line => line).length
        stats.debugLog.lastModified = debugStat.mtime
      }

      if (stats.errorLog.exists) {
        const errorStat = fs.statSync(errorLogFile)
        const errorContent = fs.readFileSync(errorLogFile, 'utf8')
        stats.errorLog.size = errorStat.size
        stats.errorLog.lines = errorContent
          .split('\n')
          .filter(line => line).length
        stats.errorLog.lastModified = errorStat.mtime
      }

      return reply.send(stats)
    } catch (error) {
      fastify.log.error('Failed to get log stats:', error)
      return reply.code(500).send({ error: 'Failed to get log statistics' })
    }
  })

  // Clear logs (development only)
  fastify.delete('/logs/clear', async (request, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply
        .code(403)
        .send({ error: 'Log clearing not allowed in production' })
    }

    try {
      if (fs.existsSync(debugLogFile)) {
        fs.writeFileSync(debugLogFile, '')
      }
      if (fs.existsSync(errorLogFile)) {
        fs.writeFileSync(errorLogFile, '')
      }

      fastify.log.info('Debug logs cleared by user request')

      return reply.send({ message: 'Logs cleared successfully' })
    } catch (error) {
      fastify.log.error('Failed to clear logs:', error)
      return reply.code(500).send({ error: 'Failed to clear logs' })
    }
  })

  // Live log streaming endpoint
  fastify.get('/logs/stream', { websocket: true }, (connection, request) => {
    const logWatcher = fs.watchFile(debugLogFile, { interval: 1000 }, () => {
      try {
        const logContent = fs.readFileSync(debugLogFile, 'utf8')
        const logLines = logContent
          .trim()
          .split('\n')
          .filter(line => line)
        const lastLine = logLines[logLines.length - 1]

        if (lastLine) {
          try {
            const logEntry = JSON.parse(lastLine)
            connection.send(JSON.stringify(logEntry))
          } catch (e) {
            // Skip malformed lines
          }
        }
      } catch (error) {
        // Log file might not exist yet
      }
    })

    connection.on('close', () => {
      fs.unwatchFile(debugLogFile)
    })
  })
}

module.exports = debugRoutes
