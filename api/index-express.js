const express = require('express')
const cors = require('cors')

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
)

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Iron Task API',
    version: '1.0.0',
    status: 'ok',
    environment: process.env.NODE_ENV,
  })
})

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  // Mock login for now
  const { email, password } = req.body

  if (email === 'admin@fsw-denver.com' && password === 'Test1234!') {
    res.json({
      message: 'Login successful',
      user: {
        id: 'user-1',
        email: 'admin@fsw-denver.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
      token: 'mock-jwt-token',
    })
  } else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  })
})

module.exports = app
