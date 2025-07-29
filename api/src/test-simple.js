// Simple test endpoint without environment validation

module.exports = (req, res) => {
  res.status(200).json({
    message: 'API is running on Vercel!',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      hasCookie: !!process.env.COOKIE_SECRET,
      hasSupabase: !!process.env.SUPABASE_URL,
      jwtLength: process.env.JWT_SECRET?.length || 0,
      cookieLength: process.env.COOKIE_SECRET?.length || 0
    }
  })
}
