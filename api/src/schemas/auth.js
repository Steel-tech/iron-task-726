/**
 * Authentication API Schemas for OpenAPI Documentation
 * Defines request/response schemas for auth endpoints with comprehensive validation
 */

const authSchemas = {
  // POST /api/auth/register
  register: {
    tags: ['Authentication'],
    summary: 'Register new user',
    description: `Register a new user in the construction documentation system.
    
    **Requirements:**
    - Email must be unique across the system
    - Password must contain uppercase, lowercase, number, and special character
    - Role must be one of the 8 defined construction roles
    - Company must exist and user must have permission to add users`,
    body: {
      type: 'object',
      required: ['name', 'email', 'password', 'role'],
      properties: {
        name: {
          type: 'string',
          minLength: 2,
          maxLength: 100,
          example: 'John Doe',
          description: 'Full name of the user'
        },
        email: {
          type: 'string',
          format: 'email',
          maxLength: 254,
          example: 'john.doe@construction.com',
          description: 'Unique email address'
        },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 128,
          example: 'SecurePass123!',
          description: 'Strong password with mixed case, numbers, and special characters'
        },
        role: {
          type: 'string',
          enum: ['ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'WORKER', 'CLIENT', 'INSPECTOR', 'SUBCONTRACTOR', 'VIEWER'],
          description: 'User role in the construction organization'
        },
        companyId: {
          type: 'string',
          format: 'uuid',
          description: 'Company ID to associate the user with (optional for invited users)'
        }
      }
    },
    response: {
      201: {
        description: 'User registered successfully',
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          message: { type: 'string', example: 'User registered successfully' }
        }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      409: {
        description: 'Email already exists',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Email already registered' },
          code: { type: 'string', example: 'EMAIL_EXISTS' }
        }
      },
      429: { $ref: '#/components/responses/RateLimitError' }
    }
  },

  // POST /api/auth/login
  login: {
    tags: ['Authentication'],
    summary: 'User login',
    description: `Authenticate user and return access token with refresh token cookie.
    
    **Security Features:**
    - Rate limiting: 5 attempts per 15 minutes per IP/email
    - Refresh token rotation with family tracking
    - HttpOnly secure cookies for refresh tokens
    - JWT access tokens with 15-minute expiration`,
    body: {
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
          example: 'SecurePass123!',
          description: 'User password'
        },
        rememberMe: {
          type: 'boolean',
          default: false,
          description: 'Extend refresh token expiration to 30 days'
        }
      }
    },
    response: {
      200: {
        description: 'Login successful',
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token (15-minute expiration)'
          },
          user: { $ref: '#/components/schemas/User' },
          companies: {
            type: 'array',
            items: { $ref: '#/components/schemas/Company' },
            description: 'Companies the user belongs to'
          },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            description: 'User permissions across all companies'
          },
          lastLoginAt: {
            type: 'string',
            format: 'date-time',
            description: 'Previous login timestamp'
          }
        },
        headers: {
          'Set-Cookie': {
            description: 'HttpOnly refresh token cookie',
            schema: { type: 'string' }
          }
        }
      },
      401: {
        description: 'Invalid credentials',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid email or password' },
          code: { type: 'string', example: 'INVALID_CREDENTIALS' },
          remainingAttempts: { type: 'integer', description: 'Remaining login attempts' }
        }
      },
      423: {
        description: 'Account temporarily locked',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Account temporarily locked due to multiple failed attempts' },
          code: { type: 'string', example: 'ACCOUNT_LOCKED' },
          lockoutExpiresAt: { type: 'string', format: 'date-time' }
        }
      },
      429: { $ref: '#/components/responses/RateLimitError' }
    }
  },

  // POST /api/auth/refresh
  refresh: {
    tags: ['Authentication'],
    summary: 'Refresh access token',
    description: `Refresh an expired access token using the refresh token cookie.
    
    **Security Features:**
    - Automatic token family rotation
    - Detection and prevention of token reuse attacks
    - Refresh token invalidation on suspicious activity`,
    security: [{ cookieAuth: [] }],
    response: {
      200: {
        description: 'Token refreshed successfully',
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'New JWT access token'
          },
          user: { $ref: '#/components/schemas/User' },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Access token expiration time'
          }
        },
        headers: {
          'Set-Cookie': {
            description: 'New HttpOnly refresh token cookie',
            schema: { type: 'string' }
          }
        }
      },
      401: {
        description: 'Invalid or expired refresh token',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Refresh token expired or invalid' },
          code: { type: 'string', example: 'INVALID_REFRESH_TOKEN' },
          action: { type: 'string', example: 'Please login again' }
        }
      },
      403: {
        description: 'Token reuse detected - security breach',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Token reuse detected. All sessions have been revoked.' },
          code: { type: 'string', example: 'TOKEN_REUSE_DETECTED' },
          action: { type: 'string', example: 'Please login again from all devices' }
        }
      }
    }
  },

  // POST /api/auth/logout
  logout: {
    tags: ['Authentication'],
    summary: 'User logout',
    description: `Logout user and revoke all refresh tokens.
    
    **Security:**
    - Revokes current refresh token family
    - Clears HttpOnly cookies
    - Logs security event for audit trail`,
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    response: {
      200: {
        description: 'Logout successful',
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logged out successfully' },
          revokedTokens: { type: 'integer', description: 'Number of refresh tokens revoked' }
        },
        headers: {
          'Set-Cookie': {
            description: 'Cleared refresh token cookie',
            schema: { type: 'string' }
          }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },

  // GET /api/auth/me
  me: {
    tags: ['Authentication'],
    summary: 'Get current user profile',
    description: `Get the currently authenticated user's profile information.
    
    **Returns:**
    - Complete user profile
    - Company memberships and roles
    - Recent activity summary
    - Account security status`,
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'Current user information',
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          companies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                company: { $ref: '#/components/schemas/Company' },
                role: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } },
                joinedAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          stats: {
            type: 'object',
            properties: {
              mediaUploaded: { type: 'integer' },
              projectsActive: { type: 'integer' },
              recentActivity: { type: 'integer' },
              lastLoginAt: { type: 'string', format: 'date-time' }
            }
          },
          security: {
            type: 'object',
            properties: {
              activeSessions: { type: 'integer' },
              lastPasswordChange: { type: 'string', format: 'date-time' },
              mfaEnabled: { type: 'boolean' }
            }
          }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },

  // POST /api/auth/change-password
  changePassword: {
    tags: ['Authentication'],
    summary: 'Change user password',
    description: `Change the current user's password.
    
    **Security Requirements:**
    - Must provide current password for verification
    - New password must meet strength requirements
    - Revokes all existing refresh tokens except current session`,
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: {
          type: 'string',
          description: 'Current password for verification'
        },
        newPassword: {
          type: 'string',
          minLength: 8,
          maxLength: 128,
          description: 'New password meeting strength requirements'
        },
        confirmPassword: {
          type: 'string',
          description: 'Confirmation of new password (must match newPassword)'
        },
        revokeOtherSessions: {
          type: 'boolean',
          default: true,
          description: 'Revoke all other active sessions'
        }
      }
    },
    response: {
      200: {
        description: 'Password changed successfully',
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Password changed successfully' },
          revokedSessions: { type: 'integer', description: 'Number of other sessions revoked' },
          securityEvent: { type: 'string', example: 'Password change logged for audit' }
        }
      },
      400: {
        description: 'Invalid password or validation failed',
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string', enum: ['WEAK_PASSWORD', 'PASSWORD_MISMATCH', 'CURRENT_PASSWORD_INCORRECT'] },
          requirements: {
            type: 'array',
            items: { type: 'string' },
            description: 'Password requirements not met'
          }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },

  // GET /api/auth/sessions
  sessions: {
    tags: ['Authentication'],
    summary: 'List active user sessions',
    description: `Get all active sessions for the current user.
    
    **Session Information:**
    - Device and browser details
    - IP address and location (approximate)
    - Last activity timestamp
    - Current session indicator`,
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'List of active sessions',
        type: 'object',
        properties: {
          sessions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Session ID' },
                deviceInfo: {
                  type: 'object',
                  properties: {
                    userAgent: { type: 'string' },
                    browser: { type: 'string' },
                    os: { type: 'string' },
                    device: { type: 'string' }
                  }
                },
                ipAddress: { type: 'string' },
                location: {
                  type: 'object',
                  properties: {
                    city: { type: 'string' },
                    country: { type: 'string' },
                    region: { type: 'string' }
                  }
                },
                createdAt: { type: 'string', format: 'date-time' },
                lastUsedAt: { type: 'string', format: 'date-time' },
                expiresAt: { type: 'string', format: 'date-time' },
                isCurrent: { type: 'boolean', description: 'True if this is the current session' }
              }
            }
          },
          totalSessions: { type: 'integer' }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },

  // DELETE /api/auth/sessions/:sessionId
  revokeSession: {
    tags: ['Authentication'],
    summary: 'Revoke specific session',
    description: `Revoke a specific user session by ID.
    
    **Security:**
    - Users can only revoke their own sessions
    - Cannot revoke current session (use logout instead)
    - Logs security event for audit trail`,
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['sessionId'],
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID to revoke'
        }
      }
    },
    response: {
      200: {
        description: 'Session revoked successfully',
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Session revoked successfully' },
          sessionId: { type: 'string' },
          revokedAt: { type: 'string', format: 'date-time' }
        }
      },
      400: {
        description: 'Cannot revoke current session',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Cannot revoke current session. Use logout instead.' },
          code: { type: 'string', example: 'CURRENT_SESSION' }
        }
      },
      404: {
        description: 'Session not found',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Session not found' },
          code: { type: 'string', example: 'SESSION_NOT_FOUND' }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },

  // POST /api/auth/revoke-all-sessions
  revokeAllSessions: {
    tags: ['Authentication'],
    summary: 'Revoke all user sessions',
    description: `Security feature to revoke all active sessions except the current one.
    
    **Use Cases:**
    - Suspected account compromise
    - Lost device security
    - Periodic security maintenance`,
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['SECURITY_BREACH', 'LOST_DEVICE', 'PERIODIC_CLEANUP', 'OTHER'],
          description: 'Reason for revoking all sessions'
        },
        includeCurrentSession: {
          type: 'boolean',
          default: false,
          description: 'Also revoke the current session (forces logout)'
        }
      }
    },
    response: {
      200: {
        description: 'All sessions revoked successfully',
        type: 'object',
        properties: {
          message: { type: 'string', example: 'All sessions revoked successfully' },
          revokedCount: { type: 'integer', description: 'Number of sessions revoked' },
          revokedAt: { type: 'string', format: 'date-time' },
          securityEvent: { type: 'string', description: 'Security audit event ID' }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  }
};

module.exports = authSchemas;