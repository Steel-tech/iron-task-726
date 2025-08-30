const fastify = require('fastify')
const { setupBasicMiddleware } = require('./middleware/setup')
const { setupRoutes } = require('./routes/setup')

async function createApp(options = {}) {
  const app = fastify({
    logger:
      options.logger !== false
        ? {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          }
        : false,
    ...options,
  })

  // Setup middleware
  await setupBasicMiddleware(app)

  // Setup routes
  await setupRoutes(app)

  return app
}

module.exports = { createApp }
