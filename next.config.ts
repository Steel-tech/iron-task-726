import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const cspDirectives = [
  "default-src 'self'",
  // Scripts: relaxed in dev for HMR, stricter in prod
  isProd
    ? "script-src 'self'"
    : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  // Styles: allow inline styles unless you adopt nonces/hashes
  "style-src 'self' 'unsafe-inline'",
  // Images and fonts
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // Connections: include ws/wss for dev tooling and streaming
  "connect-src 'self' https: ws: wss:",
  // Framing and navigation
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  eslint: {
    dirs: ['src'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  headers: async () => {
    return [
      {
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
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
    ]
  },
}

export default nextConfig
