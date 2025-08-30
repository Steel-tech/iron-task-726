async function setupRoutes(fastify) {
  // Register auth routes
  await fastify.register(require('./auth'), { prefix: '/api/auth' })

  // Register other routes
  await fastify.register(require('./media'), { prefix: '/api/media' })
  await fastify.register(require('./projects'), { prefix: '/api/projects' })
  await fastify.register(require('./users'), { prefix: '/api/users' })
  await fastify.register(require('./dashboard'), { prefix: '/api/dashboard' })

  // Additional routes
  await fastify.register(require('./galleries'), { prefix: '/api' })
  await fastify.register(require('./timelines'), { prefix: '/api' })
  await fastify.register(require('./tags'), { prefix: '/api/tags' })
  await fastify.register(require('./labels'), { prefix: '/api/labels' })
  await fastify.register(require('./filters'), { prefix: '/api/filters' })
  await fastify.register(require('./feed'), { prefix: '/api' })
  await fastify.register(require('./reports'), { prefix: '/api' })
  await fastify.register(require('./forms'), { prefix: '/api' })

  // Push notifications
  await fastify.register(require('./push-subscriptions'), {
    prefix: '/api/push',
  })

  // User preferences
  await fastify.register(require('./user-preferences'), {
    prefix: '/api/users',
  })

  // Debug routes (development only)
  if (process.env.NODE_ENV !== 'production') {
    await fastify.register(require('./debug'), { prefix: '/api/debug' })
  }
}

module.exports = { setupRoutes }
