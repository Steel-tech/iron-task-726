/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Production optimizations - Enable standalone for production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  poweredByHeader: false,

  // Experimental performance features
  experimental: {
    // Optimize imports for common packages
    optimizePackageImports: ['@radix-ui/react-dialog', 'lucide-react', '@radix-ui/react-dropdown-menu'],
    // Optimize CSS loading
    optimizeCss: true,
  },

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

  // Image optimization
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      // Supabase storage domains
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname]
        : []),
      // Production domains
      ...(process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_APP_URL
          ? [new URL(process.env.NEXT_PUBLIC_APP_URL).hostname]
          : []
        : []),
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers and cache optimization
  async headers() {
    const headers = []

    // Static asset caching for performance
    headers.push({
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    })

    // Image optimization caching
    headers.push({
      source: '/_next/image(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400',
        },
      ],
    })

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
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
          },
        ],
      })
    }

    return headers
  },

  // Redirects for production - DISABLE FOR DEV DEBUGGING
  async redirects() {
    return []
    // return [
    //   // Redirect root to dashboard if authenticated
    //   {
    //     source: '/',
    //     destination: '/dashboard',
    //     permanent: false,
    //     has: [
    //       {
    //         type: 'cookie',
    //         key: 'fsw_session',
    //       },
    //     ],
    //   },
    // ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: config => {
      if (process.env.NODE_ENV === 'development') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        )
      }
      return config
    },
  }),
}

module.exports = nextConfig
