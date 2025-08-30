// Debug version to identify environment validation issues

console.log('=== Environment Debug ===')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length)
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length)
console.log('COOKIE_SECRET exists:', !!process.env.COOKIE_SECRET)
console.log('COOKIE_SECRET length:', process.env.COOKIE_SECRET?.length)
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL)
console.log(
  'SUPABASE_SERVICE_ROLE_KEY exists:',
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
)
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY)
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN)
console.log('=========================')

// Now try to load the actual env config
try {
  const _env = require('./config/env')
  console.log('✅ Environment validation passed!')
} catch (error) {
  console.error('❌ Environment validation failed:', error.message)
  console.error('Full error:', error)
  process.exit(1)
}

module.exports = {}
