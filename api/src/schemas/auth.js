const { z } = require('zod');
const { schemas } = require('../middleware/validation');
const constants = require('../config/constants');

const authSchemas = {
  register: {
    body: z.object({
      email: schemas.email,
      password: schemas.password,
      name: z.string().min(1).max(100),
      role: z.enum([
        'ADMIN',
        'PROJECT_MANAGER',
        'FOREMAN',
        'WORKER',
        'STEEL_ERECTOR',
        'WELDER',
        'SAFETY_INSPECTOR',
        'VIEWER'
      ]).default('WORKER'),
      companyId: z.string().uuid().optional(),
      unionMember: z.boolean().default(false),
      phoneNumber: z.string()
        .regex(/^\+?[\d\s\-\(\)]+$/)
        .min(10)
        .max(20)
        .optional()
    })
  },
  
  login: {
    body: z.object({
      email: schemas.email,
      password: z.string().min(1)
    })
  },
  
  refreshToken: {
    body: z.object({
      refreshToken: z.string().optional()
    })
  },
  
  forgotPassword: {
    body: z.object({
      email: schemas.email
    })
  },
  
  resetPassword: {
    body: z.object({
      token: z.string().min(1),
      password: schemas.password
    })
  },
  
  changePassword: {
    body: z.object({
      currentPassword: z.string().min(1),
      newPassword: schemas.password
    })
  },
  
  updateProfile: {
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      phoneNumber: z.string()
        .regex(/^\+?[\d\s\-\(\)]+$/)
        .min(10)
        .max(20)
        .optional(),
      unionMember: z.boolean().optional()
    })
  }
};

module.exports = authSchemas;