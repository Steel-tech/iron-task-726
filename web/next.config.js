/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  
  // Build configuration
  eslint: {
    // Temporarily ignore during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Enable strict TypeScript checking in all environments
    ignoreBuildErrors: false,
  },
  
  // Performance optimizations  
  compress: true,
  
  // WSL development support
  allowedDevOrigins: [
    '172.18.129.73:3002',
    '172.18.129.73:3003',
    'localhost:3002',
    'localhost:3003'
  ],
  
  // Image optimization
  images: {
    domains: [
      'localhost', 
      '127.0.0.1',
      // Supabase storage domains
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname] 
        : []
      ),
      // Production domains
      ...(process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
          ? [new URL(process.env.NEXT_PUBLIC_APP_URL).hostname]
          : []
        : []
      )
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Security headers
  async headers() {
    const headers = [];
    
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          }
        ],
      });
    }
    
    return headers;
  },
  
  // Redirects for production
  async redirects() {
    return [
      // Redirect root to dashboard if authenticated
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'fsw_session',
          },
        ],
      },
    ];
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      if (process.env.NODE_ENV === 'development') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
}

module.exports = nextConfig