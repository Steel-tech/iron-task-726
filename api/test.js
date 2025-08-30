const url = require('url')
const querystring = require('querystring')

// CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (err) {
        reject(err)
      }
    })
  })
}

module.exports = async (req, res) => {
  setCorsHeaders(res)

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  const parsedUrl = url.parse(req.url, true)
  const path = parsedUrl.pathname
  const method = req.method

  try {
    // Health check
    if (path === '/health') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        })
      )
      return
    }

    // API info
    if (path === '/api' && method === 'GET') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          name: 'Iron Task API',
          version: '1.0.0',
          status: 'ok',
          environment: process.env.NODE_ENV || 'development',
        })
      )
      return
    }

    // Login endpoint
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req)
      const { email, password } = body

      // Mock authentication
      if (email === 'admin@fsw-denver.com' && password === 'Test1234!') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            message: 'Login successful',
            user: {
              id: 'user-1',
              email: 'admin@fsw-denver.com',
              name: 'Admin User',
              role: 'ADMIN',
            },
            token: 'mock-jwt-token-' + Date.now(),
          })
        )
        return
      } else {
        res.statusCode = 401
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Invalid credentials' }))
        return
      }
    }

    // Default response for unmatched routes
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: 'Route not found',
        path: path,
        method: method,
        timestamp: new Date().toISOString(),
      })
    )
  } catch (error) {
    console.error('API Error:', error)
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
