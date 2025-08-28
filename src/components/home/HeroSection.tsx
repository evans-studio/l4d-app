'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/primitives/Button'
import { Container } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { m, useScroll, useTransform } from 'framer-motion'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

// Generate subtle sparkle particles for the hero only
const generateSparkles = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const sizes = [0.5, 1, 1.5] as const
    const animations = ['animate-purple-pulse', 'animate-sparkle-float'] as const
    const opacities = [10, 12, 15, 18, 20] as const
    return {
      id: i,
      size: sizes[Math.floor(Math.random() * sizes.length)] as number,
      top: Math.random() * 90 + 5,
      left: Math.random() * 90 + 5,
      opacity: opacities[Math.floor(Math.random() * opacities.length)] as number,
      animation: animations[Math.floor(Math.random() * animations.length)] as string,
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 4,
    }
  })
}

export function HeroSection() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 50])
  const [sparkles, setSparkles] = useState<Array<ReturnType<typeof generateSparkles>[number]>>([])

  useEffect(() => {
    setSparkles(generateSparkles(14))
  }, [])

  const scrollToNextSection = () => {
    const nextSection = document.getElementById('services')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pb-12 sm:pb-16 lg:pb-20" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      {/* Hero-only sparkles layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
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

      {/* Parallax Content (Framer Motion) */}
      <Container className="relative flex-1 flex flex-col items-center justify-center text-center px-4">
        <m.div 
          className="max-w-7xl mx-auto pt-12 sm:pt-16 lg:pt-20"
          style={{ y }}
        >
          {/* Logo - Dominant Visual Element with proper top spacing */}
          <div className="relative mb-8 sm:mb-12 lg:mb-16">
            <div className="relative inline-block">
              <Image
                src="/logo1.png"
                alt="Love 4 Detailing"
                width={400}
                height={400}
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[400px] lg:h-[400px] xl:w-[448px] xl:h-[448px] object-contain drop-shadow-2xl"
                priority
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-brand-600/20 rounded-full blur-3xl scale-110 -z-10" />
            </div>
          </div>

          {/* Typography Hierarchy with proper spacing */}
          <div className="space-y-4 sm:space-y-5 mb-10 lg:mb-12">
            {/* H1 - Clear Value Proposition with 40px space from logo */}
            <Heading 
              as="h1" 
              size="h1" 
              color="white" 
              align="center" 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-tight mb-4 sm:mb-5"
            >
              Mobile Car Detailing,
              <span className="block text-brand-400">Done Right.</span>
            </Heading>

            {/* H2 - Supporting Statement with 20px space from heading */}
            <Heading 
              as="h2" 
              size="h3" 
              color="secondary" 
              weight="normal" 
              align="center" 
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 max-w-3xl mx-auto px-4 sm:px-0"
            >
              South London based. We pull up to you.
            </Heading>
          </div>

          {/* CTA Buttons with 40-50px space from subheading */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 sm:px-0 mb-12 sm:mb-16 lg:mb-20">
            <Link href="/book" className="w-full sm:w-auto">
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto min-w-[200px] bg-brand-600 hover:bg-brand-700 shadow-purple-lg hover:shadow-purple-xl transition-all duration-300 sm:w-auto min-h-[56px]"
              >
                Book Service
              </Button>
            </Link>
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg"
                fullWidth
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto min-w-[200px] border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 sm:w-auto min-h-[56px]"
              >
                Create an account
              </Button>
            </Link>
          </div>

          {/* Animated Scroll Indicator - Repositioned with proper spacing */}
          <div className="mt-8 lg:mt-12 mb-8">
            <button
              onClick={scrollToNextSection}
              className="flex flex-col items-center gap-2 text-white/60 hover:text-white/90 transition-colors duration-300 group mx-auto"
              aria-label="Scroll to explore more"
            >
              <Text size="sm" weight="medium" className="tracking-wide hidden sm:block">Scroll to Explore</Text>
              <Text size="xs" weight="medium" className="tracking-wide sm:hidden">Explore</Text>
              <ChevronDown className={cn(
                "w-5 h-5 animate-bounce group-hover:animate-purple-bounce transition-all duration-300"
              )} />
            </button>
          </div>

        </m.div>
      </Container>

    </section>
  )
}