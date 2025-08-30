// Vercel serverless function entry point
require('dotenv').config()

const { createApp } = require('./src/app')

let app

async function handler(req, res) {
  try {
    // Initialize app if not already done
    if (!app) {
      console.log('Initializing Fastify app...')
      app = await createApp({ logger: false })
      await app.ready()
      console.log('Fastify app initialized successfully')
    }

    // Handle the request
    const response = await app.inject({
      method: req.method,
      url: req.url,
      headers: req.headers,
      payload: req.body,
    })

    // Set status code
    res.statusCode = response.statusCode

    // Set headers
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key])
    })

    // Send response
    res.end(response.payload)
  } catch (error) {
    console.error('Handler error:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: 'Internal Server Error',
        message:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Something went wrong',
      })
    )
  }
}

module.exports = handler
