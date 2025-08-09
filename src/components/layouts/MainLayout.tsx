'use client'

import { ReactNode } from 'react'
import { MinimalHeader } from '@/components/navigation/MinimalHeader'
import { MainFooter } from '@/components/navigation/MainFooter'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
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
        
        {/* Animated Sparkle Particles Throughout */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top section sparkles */}
          <div className="absolute top-1/6 left-1/5 w-2 h-2 bg-brand-400/30 rounded-full animate-purple-pulse" />
          <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-brand-300/40 rounded-full animate-purple-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/8 left-3/4 w-1.5 h-1.5 bg-brand-500/20 rounded-full animate-purple-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Middle section sparkles */}
          <div className="absolute top-2/5 left-1/6 w-1.5 h-1.5 bg-brand-400/25 rounded-full animate-purple-pulse" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 right-1/5 w-2 h-2 bg-brand-300/30 rounded-full animate-purple-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-3/5 left-1/3 w-1 h-1 bg-brand-500/35 rounded-full animate-purple-pulse" style={{ animationDelay: '4s' }} />
          
          {/* Lower section sparkles */}
          <div className="absolute top-3/4 right-1/6 w-1.5 h-1.5 bg-brand-400/20 rounded-full animate-purple-pulse" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-4/5 left-2/3 w-1 h-1 bg-brand-300/25 rounded-full animate-purple-pulse" style={{ animationDelay: '3.5s' }} />
          <div className="absolute top-5/6 right-1/3 w-2 h-2 bg-brand-500/25 rounded-full animate-purple-pulse" style={{ animationDelay: '0.5s' }} />
          
          {/* Additional scattered sparkles for fuller effect */}
          <div className="absolute top-1/3 left-1/8 w-1 h-1 bg-brand-400/20 rounded-full animate-purple-pulse" style={{ animationDelay: '4.5s' }} />
          <div className="absolute top-2/3 right-1/8 w-1.5 h-1.5 bg-brand-300/25 rounded-full animate-purple-pulse" style={{ animationDelay: '5s' }} />
          <div className="absolute top-7/8 left-1/2 w-1 h-1 bg-brand-500/30 rounded-full animate-purple-pulse" style={{ animationDelay: '1.2s' }} />
        </div>
      </div>
      
      <MinimalHeader />
      <main className="flex-1">
        {children}
      </main>
      <MainFooter />
    </div>
  )
}