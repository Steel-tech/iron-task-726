const { z } = require('zod');

/**
 * Creates a validation middleware for Fastify
 * @param {Object} schema - Zod schema object with body, query, params
 * @returns {Function} Fastify preHandler hook
 */
function validate(schema) {
  return async (request, reply) => {
    try {
      // Validate body
      if (schema.body) {
        request.body = await schema.body.parseAsync(request.body);
      }
      
      // Validate query parameters
      if (schema.query) {
        request.query = await schema.query.parseAsync(request.query);
      }
      
      // Validate route parameters
      if (schema.params) {
        request.params = await schema.params.parseAsync(request.params);
      }
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Re-throw if not a validation error
      throw error;
    }
  };
}

/**
 * Common validation schemas
 */
const schemas = {
  // UUID validation
  uuid: z.string().uuid(),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // Common string validations
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/),
  
  // File upload
  file: z.object({
    filename: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    file: z.any() // Stream
  }),
  
  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, {
    message: 'Start date must be before end date'
  })
};

module.exports = {
  validate,
  schemas,
  z
};