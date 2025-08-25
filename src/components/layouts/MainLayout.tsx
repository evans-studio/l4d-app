'use client'

import { ReactNode } from 'react'
import { MinimalHeader } from '@/components/navigation/MinimalHeader'
import { MainFooter } from '@/components/navigation/MainFooter'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      {/* Global Dark Gradient Background with Automotive Texture and Sparkles */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Subtle automotive-inspired pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,_rgba(151,71,255,0.3)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,_rgba(151,71,255,0.2)_0%,_transparent_50%)]" />
        </div>
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      <MinimalHeader />
      <main className="flex-1">
        {children}
      </main>
      <MainFooter />
    </div>
  )
}