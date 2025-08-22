import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/../instrumentation-client'
import { env } from '@/lib/config/environment'
import { AuthProvider } from '@/lib/auth-compat'
import { ZustandAuthInitializer } from '@/providers/AuthProvider'
import { OverlayProvider } from '@/lib/overlay/context'
import { OverlayManager } from '@/components/ui/overlays/OverlayManager'
import { CookieConsentBanner } from '@/components/ui/patterns/CookieConsentBanner'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7c3aed',
}

export const metadata: Metadata = {
  metadataBase: new URL(env.app.url),
  title: {
    default: `${env.business.name} - Professional Mobile Car Detailing`,
    template: `%s | ${env.business.name}`,
  },
  description: 'Professional mobile car detailing services. Premium wash & wax, paint correction, interior cleaning, and ceramic protection. Fully insured and eco-friendly.',
  keywords: ['car detailing', 'mobile car wash', 'paint correction', 'ceramic coating', 'interior cleaning'],
  authors: [{ name: env.business.name }],
  creator: env.business.name,
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: env.business.name,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: env.app.url,
    title: `${env.business.name} - Professional Mobile Car Detailing`,
    description: 'Professional mobile car detailing services in your area.',
    siteName: env.business.name,
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${env.business.name} - Professional Mobile Car Detailing`,
    description: 'Professional mobile car detailing services in your area.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <ZustandAuthInitializer>
          <AuthProvider>
            <OverlayProvider>
              {children}
              <OverlayManager />
              <CookieConsentBanner />
            </OverlayProvider>
          </AuthProvider>
        </ZustandAuthInitializer>
      </body>
    </html>
  )
}
