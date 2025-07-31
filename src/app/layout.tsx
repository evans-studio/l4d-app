import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { env } from '@/lib/config/environment'
import { AuthProvider } from '@/lib/auth-compat'
import { ZustandAuthInitializer } from '@/providers/AuthProvider'
import { OverlayProvider } from '@/lib/overlay/context'
import { OverlayManager } from '@/components/ui/overlays/OverlayManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: `${env.business.name} - Professional Mobile Car Detailing`,
    template: `%s | ${env.business.name}`,
  },
  description: 'Professional mobile car detailing services. Premium wash & wax, paint correction, interior cleaning, and ceramic protection. Fully insured and eco-friendly.',
  keywords: ['car detailing', 'mobile car wash', 'paint correction', 'ceramic coating', 'interior cleaning'],
  authors: [{ name: env.business.name }],
  creator: env.business.name,
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: env.app.url,
    title: `${env.business.name} - Professional Mobile Car Detailing`,
    description: 'Professional mobile car detailing services in your area.',
    siteName: env.business.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${env.business.name} - Professional Mobile Car Detailing`,
    description: 'Professional mobile car detailing services in your area.',
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
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ZustandAuthInitializer>
          <AuthProvider>
            <OverlayProvider>
              {children}
              <OverlayManager />
            </OverlayProvider>
          </AuthProvider>
        </ZustandAuthInitializer>
      </body>
    </html>
  )
}
