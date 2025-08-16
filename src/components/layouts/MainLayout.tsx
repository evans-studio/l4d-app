'use client'

import { ReactNode, useMemo, useEffect, useState } from 'react'
import { MinimalHeader } from '@/components/navigation/MinimalHeader'
import { MainFooter } from '@/components/navigation/MainFooter'

interface MainLayoutProps {
  children: ReactNode
}

// Generate subtle sparkle particles for ambient background effect
const generateSparkles = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const sizes = [0.5, 1, 1.5] as const // Smaller, more subtle sizes
    const animations = ['animate-purple-pulse', 'animate-sparkle-float'] as const // Removed rotating drift animation
    const opacities = [10, 12, 15, 18, 20] as const // Much lower opacity for subtlety
    
    return {
      id: i,
      size: sizes[Math.floor(Math.random() * sizes.length)] as number,
      top: Math.random() * 90 + 5, // 5% to 95% of viewport height
      left: Math.random() * 90 + 5, // 5% to 95% of viewport width
      opacity: opacities[Math.floor(Math.random() * opacities.length)] as number,
      animation: animations[Math.floor(Math.random() * animations.length)] as string,
      delay: Math.random() * 8, // 0-8 second delay for more spacing
      duration: 4 + Math.random() * 4, // 4-8 second duration for slower movement
    }
  })
}

export function MainLayout({ children }: MainLayoutProps) {
  // Generate sparkles on client only to avoid SSR hydration mismatches
  const [sparkles, setSparkles] = useState<Array<ReturnType<typeof generateSparkles>[number]>>([])
  useEffect(() => {
    setSparkles(generateSparkles(14))
  }, [])
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
        
        {/* Dynamic Animated Sparkle Particles Throughout */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" suppressHydrationWarning>
          {sparkles.map((sparkle) => (
            <div
              key={sparkle.id}
              className={`absolute rounded-full bg-brand-400 ${sparkle.animation}`}
              style={{
                width: `${sparkle.size * 0.25}rem`,
                height: `${sparkle.size * 0.25}rem`,
                top: `${sparkle.top}%`,
                left: `${sparkle.left}%`,
                opacity: sparkle.opacity / 100,
                animationDelay: `${sparkle.delay}s`,
                animationDuration: `${sparkle.duration}s`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
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