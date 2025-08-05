import type { Metadata, Viewport } from 'next'
import { Inter, Shojumaru } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import Script from 'next/script'

// Using Shojumaru for headings (Japanese-style decorative font)
const shojumaru = Shojumaru({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-shojumaru',
  display: 'swap',
})

// Keep Inter for body text for readability
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FSW Iron Task',
  description: 'Professional Construction Documentation System built by ironworkers, for ironworkers. Document your projects, ensure safety compliance, and track progress with the most trusted platform in steel construction.',
  generator: 'Next.js',
  applicationName: 'FSW Iron Task',
  referrer: 'origin-when-cross-origin',
  keywords: ['construction', 'ironworker', 'documentation', 'safety', 'steel construction', 'project management'],
  authors: [{ name: 'FSW Iron Task Team' }],
  creator: 'FSW Iron Task',
  publisher: 'FSW Iron Task',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'FSW Iron Task',
    description: 'Professional Construction Documentation System for Ironworkers',
    siteName: 'FSW Iron Task',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FSW Iron Task',
    description: 'Professional Construction Documentation System for Ironworkers',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FSW Iron Task',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1f2937' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FSW Iron Task" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/service-worker.js" as="script" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${shojumaru.variable} font-sans`}>
        <Providers>
          {children}
          <PWAInstallPrompt />
        </Providers>
        
        {/* Service Worker Registration */}
        <Script
          id="sw-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      
                      // Check for updates
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              // New version available
                              if (confirm('New version available! Reload to update?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                              }
                            }
                          });
                        }
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                    
                  // Handle service worker updates
                  navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}