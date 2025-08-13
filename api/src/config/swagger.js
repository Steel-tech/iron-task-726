/**
 * Swagger/OpenAPI Configuration for FSW Iron Task API
 * Comprehensive API documentation for construction documentation system
 */

const swaggerConfig = {
  openapi: {
    info: {
      title: 'FSW Iron Task API',
      description: `
        **Professional Construction Documentation System API**
        
        A comprehensive API for ironworkers and construction teams featuring:
        - Real-time collaboration with WebSocket support
        - Secure media management with GPS metadata
        - Role-based access control (8 user roles)
        - AI-powered report generation
        - Safety and quality compliance tracking
        - Multi-company project management
        
        ## Authentication
        This API uses JWT tokens with refresh token rotation for security:
        1. Login with \`POST /api/auth/login\` to get access and refresh tokens
        2. Include the access token in \`Authorization: Bearer <token>\` header
        3. Refresh expired tokens with \`POST /api/auth/refresh\`
        
        ## Rate Limiting
        - Authentication: 5 attempts per 15 minutes
        - File uploads: 20 per hour per user
        - AI reports: 10 per hour per user
        - General API: 100 requests per 15 minutes
        
        ## Security Features
        - bcrypt password hashing (12 rounds)
        - HttpOnly secure cookies for refresh tokens
        - Comprehensive input validation with Zod
        - CSP and security headers via Helmet
        - Multi-tier rate limiting
        
        ## Media Management
        - Supports photos, videos, dual-camera recordings
        - Automatic thumbnail generation
        - GPS metadata extraction for location tracking
        - Signed URLs with 1-hour expiration
        - Multi-backend storage (Supabase, S3, local)
      `,
      version: '1.0.0',
      contact: {
        name: 'FSW Iron Task Support',
        email: 'support@fswirontask.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://fswirontask.com/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.fswirontask.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /api/auth/login'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'HttpOnly refresh token cookie'
        }
      },
      schemas: {
        // Authentication Schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@construction.com',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'SecurePass123!',
              description: 'User password (min 8 characters)'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (15-minute expiration)'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            companies: {
              type: 'array',
              items: { $ref: '#/components/schemas/Company' },
              description: 'Companies the user belongs to'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
              description: 'Full name of the user'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@construction.com'
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'SecurePass123!',
              description: 'Strong password with uppercase, lowercase, number, and special character'
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'WORKER', 'CLIENT', 'INSPECTOR', 'SUBCONTRACTOR', 'VIEWER'],
              description: 'User role within the organization'
            },
            companyId: {
              type: 'string',
              format: 'uuid',
              description: 'Company ID to associate the user with'
            }
          }
        },
        
        // User & Company Schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'WORKER', 'CLIENT', 'INSPECTOR', 'SUBCONTRACTOR', 'VIEWER']
            },
            isActive: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Acme Construction Inc.' },
            address: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email', nullable: true },
            logo: { type: 'string', nullable: true, description: 'URL to company logo' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Project Schemas
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Downtown Office Complex' },
            description: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
              default: 'PLANNED'
            },
            startDate: { type: 'string', format: 'date', nullable: true },
            endDate: { type: 'string', format: 'date', nullable: true },
            location: { type: 'string', nullable: true },
            projectNumber: { type: 'string', nullable: true },
            companyId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            _count: {
              type: 'object',
              properties: {
                media: { type: 'integer' },
                activities: { type: 'integer' },
                members: { type: 'integer' }
              }
            }
          }
        },
        CreateProjectRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Steel Frame Building Project' },
            description: { type: 'string', example: 'Multi-story steel frame construction' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            location: { type: 'string', example: '123 Main St, Construction City, ST 12345' },
            projectNumber: { type: 'string', example: 'PROJ-2025-001' }
          }
        },
        
        // Media Schemas
        Media: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fileUrl: { type: 'string', description: 'Signed URL to media file' },
            thumbnailUrl: { type: 'string', nullable: true, description: 'Thumbnail for videos' },
            mediaType: {
              type: 'string',
              enum: ['PHOTO', 'VIDEO', 'DUAL_CAMERA_VIDEO']
            },
            fileName: { type: 'string' },
            fileSize: { type: 'integer', description: 'File size in bytes' },
            mimeType: { type: 'string' },
            status: {
              type: 'string',
              enum: ['UPLOADING', 'PROCESSING', 'READY', 'ERROR'],
              default: 'UPLOADING'
            },
            timestamp: { type: 'string', format: 'date-time', description: 'When photo/video was taken' },
            location: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                address: { type: 'string', nullable: true }
              }
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata (device info, camera settings, etc.)'
            },
            activityType: { type: 'string', nullable: true },
            projectId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        MediaUploadResponse: {
          type: 'object',
          properties: {
            uploadedFiles: {
              type: 'array',
              items: { $ref: '#/components/schemas/Media' }
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fileName: { type: 'string' },
                  error: { type: 'string' }
                }
              }
            }
          }
        },
        
        // Safety Schemas
        SafetyIncident: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Near miss with crane operation' },
            description: { type: 'string' },
            severity: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            },
            status: {
              type: 'string',
              enum: ['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']
            },
            occurredAt: { type: 'string', format: 'date-time' },
            location: { type: 'string', nullable: true },
            involvedPersons: {
              type: 'array',
              items: { type: 'string' }
            },
            corrective: { type: 'string', nullable: true },
            preventative: { type: 'string', nullable: true },
            projectId: { type: 'string', format: 'uuid' },
            reportedById: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Quality Control Schemas
        QualityInspection: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Steel Connection Inspection' },
            status: {
              type: 'string',
              enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']
            },
            score: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            inspectionDate: { type: 'string', format: 'date-time' },
            location: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            criteria: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  passed: { type: 'boolean' },
                  notes: { type: 'string', nullable: true }
                }
              }
            },
            projectId: { type: 'string', format: 'uuid' },
            inspectorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Error Schemas
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            details: { type: 'string', nullable: true, description: 'Additional error details' },
            code: { type: 'string', nullable: true, description: 'Error code' },
            requestId: { type: 'string', description: 'Unique request identifier for debugging' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        
        // Pagination Schema
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', minimum: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 100 },
                total: { type: 'integer', minimum: 0 },
                pages: { type: 'integer', minimum: 0 },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' }
              }
            }
          }
        }
      },
      
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Authentication required',
                code: 'UNAUTHORIZED',
                requestId: 'req_123456789',
                timestamp: '2025-01-11T10:00:00Z'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Insufficient permissions for this resource',
                code: 'FORBIDDEN',
                requestId: 'req_123456789',
                timestamp: '2025-01-11T10:00:00Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Validation failed',
                details: 'email: Invalid email format, password: Must be at least 8 characters',
                code: 'VALIDATION_ERROR',
                requestId: 'req_123456789',
                timestamp: '2025-01-11T10:00:00Z'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Rate limit exceeded',
                details: 'Too many requests. Please try again in 15 minutes.',
                code: 'RATE_LIMIT_EXCEEDED',
                requestId: 'req_123456789',
                timestamp: '2025-01-11T10:00:00Z'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                requestId: 'req_123456789',
                timestamp: '2025-01-11T10:00:00Z'
              }
            }
          }
        }
      },
      
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number (starting from 1)',
          schema: { type: 'integer', minimum: 1, default: 1 }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        },
        ProjectIdParam: {
          name: 'projectId',
          in: 'path',
          required: true,
          description: 'Project UUID',
          schema: { type: 'string', format: 'uuid' }
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management'
      },
      {
        name: 'Users',
        description: 'User management and profiles'
      },
      {
        name: 'Projects',
        description: 'Construction project management'
      },
      {
        name: 'Media',
        description: 'Photo and video management with GPS metadata'
      },
      {
        name: 'Safety',
        description: 'Safety incidents and compliance tracking'
      },
      {
        name: 'Quality',
        description: 'Quality inspections and defect management'
      },
      {
        name: 'Dashboard',
        description: 'Analytics and project statistics'
      },
      {
        name: 'Real-time',
        description: 'WebSocket events and live collaboration'
      }
    ]
  },
  exposeRoute: true,
  hideUntagged: false,
  stripBasePath: true,
  openApiVersion: '3.0.0'
};

module.exports = swaggerConfig;