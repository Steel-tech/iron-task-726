const { z } = require('zod')

// Define environment schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  COOKIE_SECRET: z
    .string()
    .min(32, 'COOKIE_SECRET must be at least 32 characters'),

  // CORS and URLs
  CORS_ORIGIN: z.string().optional(),
  APP_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),

  // Email Configuration
  EMAIL_PROVIDER: z.enum(['smtp', 'sendgrid']).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  SENDGRID_API_KEY: z.string().optional(),

  // Push Notifications
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().email().optional(),

  // Storage (for migration period)
  S3_ENDPOINT: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Server
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
})

// Validate and parse environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env)

    // Additional validation for production
    if (env.NODE_ENV === 'production') {
      // Required services
      if (
        !env.SUPABASE_URL ||
        !env.SUPABASE_SERVICE_ROLE_KEY ||
        !env.SUPABASE_ANON_KEY
      ) {
        throw new Error(
          'Complete Supabase configuration (URL, SERVICE_ROLE_KEY, ANON_KEY) is required in production'
        )
      }

      // Security requirements
      if (
        env.JWT_SECRET.includes('your-secret-key') ||
        env.JWT_SECRET.includes('dev-') ||
        env.JWT_SECRET.length < 64
      ) {
        throw new Error(
          'JWT_SECRET must be a strong, unique value (64+ chars) in production'
        )
      }
      if (env.COOKIE_SECRET.includes('dev-') || env.COOKIE_SECRET.length < 32) {
        throw new Error(
          'COOKIE_SECRET must be a strong, unique value (32+ chars) in production'
        )
      }

      // CORS validation
      if (
        !env.CORS_ORIGIN ||
        env.CORS_ORIGIN === 'true' ||
        env.CORS_ORIGIN.includes('localhost')
      ) {
        throw new Error(
          'CORS_ORIGIN must be explicitly set to production domain(s)'
        )
      }

      // HTTPS enforcement for URLs
      if (env.APP_URL && !env.APP_URL.startsWith('https://')) {
        throw new Error('APP_URL must use HTTPS in production')
      }
      if (env.FRONTEND_URL && !env.FRONTEND_URL.startsWith('https://')) {
        throw new Error('FRONTEND_URL must use HTTPS in production')
      }

      // Email configuration validation
      if (env.EMAIL_PROVIDER === 'smtp') {
        if (
          !env.SMTP_HOST ||
          !env.SMTP_USER ||
          !env.SMTP_PASSWORD ||
          !env.SMTP_FROM
        ) {
          throw new Error(
            'Complete SMTP configuration required when EMAIL_PROVIDER is smtp'
          )
        }
      } else if (env.EMAIL_PROVIDER === 'sendgrid') {
        if (!env.SENDGRID_API_KEY || !env.SMTP_FROM) {
          throw new Error(
            'SENDGRID_API_KEY and SMTP_FROM required when EMAIL_PROVIDER is sendgrid'
          )
        }
      }

      // Push notification validation
      if (
        env.VAPID_PUBLIC_KEY &&
        (!env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT)
      ) {
        throw new Error(
          'Complete VAPID configuration (PUBLIC_KEY, PRIVATE_KEY, SUBJECT) required for push notifications'
        )
      }

      // Database security
      if (
        env.DATABASE_URL.includes('localhost') ||
        env.DATABASE_URL.includes('127.0.0.1')
      ) {
        throw new Error('DATABASE_URL should not use localhost in production')
      }
    }

    return env
  } catch (error) {
    console.error('❌ Environment validation failed:')
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error(` - ${error.message}`)
    }
    process.exit(1)
  }
}

// Export validated environment
const env = validateEnv()

module.exports = env
