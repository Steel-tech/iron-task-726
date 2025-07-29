import type { Metadata } from 'next'
import { Inter, Shojumaru } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

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
  title: 'Iron Task',
  description: 'Construction Documentation System by Iron Task',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${shojumaru.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}