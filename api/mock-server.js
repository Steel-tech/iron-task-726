const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ 
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mock data store
let mockProjects = [
  {
    id: '1',
    name: 'Downtown Office Tower',
    code: 'DOT-2024',
    description: 'A 50-story office building',
    status: 'IN_PROGRESS',
    progress: 65,
    startDate: '2024-01-01',
    expectedEndDate: '2025-12-31',
    address: '100 Business Blvd, Metro City'
  },
  {
    id: '2',
    name: 'Bridge Reinforcement',
    code: 'BRP-2024',
    description: 'Highway bridge steel reinforcement',
    status: 'IN_PROGRESS',
    progress: 40,
    startDate: '2024-03-01',
    expectedEndDate: '2024-09-30',
    address: 'Highway 101, Mile Marker 45'
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock API Server Running' });
});

// Handle GET request to login (for debugging)
app.get('/api/auth/login', (req, res) => {
  console.log('⚠️ GET request to login endpoint - this should be POST');
  res.status(405).json({ 
    error: 'Method not allowed', 
    message: 'Use POST for login',
    expectedMethod: 'POST'
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔐 LOGIN REQUEST:', {
    body: req.body,
    headers: req.headers,
    email: req.body?.email,
    password: req.body?.password
  });
  
  const { email, password } = req.body;
  
  if (email === 'admin@demo.com' && password === 'demo123') {
    const token = jwt.sign(
      { userId: '1', email, role: 'ADMIN' },
      'mock-secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: '1',
        email,
        name: 'Demo Admin',
        role: 'ADMIN'
      },
      accessToken: token,
      refreshToken: 'mock-refresh'
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    id: '1',
    email: 'admin@demo.com',
    name: 'Demo Admin',
    role: 'ADMIN',
    company: {
      id: '1',
      name: 'Demo Construction Co.'
    }
  });
});

app.get('/api/projects', (req, res) => {
  res.json(mockProjects);
});

app.get('/api/projects/:id', (req, res) => {
  const project = mockProjects.find(p => p.id === req.params.id);
  if (project) {
    res.json(project);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.post('/api/projects', (req, res) => {
  const newProject = {
    id: String(mockProjects.length + 1),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockProjects.push(newProject);
  res.status(201).json(newProject);
});

app.get('/api/activities', (req, res) => {
  res.json([
    {
      id: '1',
      type: 'WORK_LOG',
      description: 'Completed steel beam installation',
      createdAt: new Date().toISOString(),
      user: { name: 'John Doe' }
    }
  ]);
});

app.get('/api/media', (req, res) => {
  res.json([
    {
      id: '1',
      fileName: 'beam-installation.jpg',
      url: 'https://via.placeholder.com/400x300',
      thumbnailUrl: 'https://via.placeholder.com/150x150'
    }
  ]);
});

// Catch all
app.use((req, res) => {
  console.log(`❌ Unhandled route: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method,
    path: req.path,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/login',
      'GET /api/auth/me', 
      'GET /api/projects',
      'POST /api/projects',
      'GET /api/activities',
      'GET /api/media'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
  console.log('Login: admin@demo.com / demo123');
});