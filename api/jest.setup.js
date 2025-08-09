// Load test environment variables early
require('dotenv').config({ path: '.env.test' })

// Suppress console logs during tests
/* global jest */
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}