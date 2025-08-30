// Security constants
module.exports = {
  // Token expiration times
  ACCESS_TOKEN_EXPIRES: '15m',
  REFRESH_TOKEN_EXPIRES: '7d',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  AUTH_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: 5,

  // User-specific rate limits
  USER_RATE_LIMIT_MAX_REQUESTS: 500, // Higher limit for authenticated users

  // Feature-specific rate limits
  UPLOAD_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  UPLOAD_RATE_LIMIT_MAX_REQUESTS: 20,

  REPORT_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  REPORT_RATE_LIMIT_MAX_REQUESTS: 10,

  NOTIFICATION_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  NOTIFICATION_RATE_LIMIT_MAX_REQUESTS: 5,

  SEARCH_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  SEARCH_RATE_LIMIT_MAX_REQUESTS: 50,

  ADMIN_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  ADMIN_RATE_LIMIT_MAX_REQUESTS: 200,

  // Bcrypt rounds
  BCRYPT_ROUNDS: 12,

  // File upload limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_REQUEST: 10,

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX:
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,

  // Session
  SESSION_COOKIE_NAME: 'fsw_session',

  // API versioning
  API_VERSION: 'v1',

  // Default company ID - should be overridden by environment variable
  DEFAULT_COMPANY_ID: process.env.DEFAULT_COMPANY_ID || 'fsw-default-company',
}
