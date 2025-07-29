/**
 * Custom error classes for better error handling
 */

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = null) {
    super('Too many requests', 429, 'RATE_LIMIT');
    this.retryAfter = retryAfter;
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * Error handler for Fastify
 */
function errorHandler(error, request, reply) {
  // Log error details
  request.log.error({
    err: error,
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      params: request.params,
      query: request.query
    }
  });

  // Handle Prisma errors
  if (error.code === 'P2002') {
    return reply.code(409).send({
      error: 'Conflict',
      message: 'A record with this value already exists',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (error.code === 'P2025') {
    return reply.code(404).send({
      error: 'Not Found',
      message: 'Record not found',
      code: 'NOT_FOUND'
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.code(401).send({
      error: 'Authentication Error',
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.code(401).send({
      error: 'Authentication Error',
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle operational errors
  if (error.isOperational) {
    const response = {
      error: error.message,
      code: error.code
    };

    if (error.details) {
      response.details = error.details;
    }

    if (error.retryAfter) {
      reply.header('Retry-After', error.retryAfter);
    }

    return reply.code(error.statusCode).send(response);
  }

  // Handle unexpected errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return reply.code(500).send({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: error.stack })
  });
}

/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
  return async (request, reply) => {
    try {
      await fn(request, reply);
    } catch (error) {
      throw error; // Let Fastify's error handler deal with it
    }
  };
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  errorHandler,
  asyncHandler
};