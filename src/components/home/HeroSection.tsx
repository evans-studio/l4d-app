'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/primitives/Button'
import { Container } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToNextSection = () => {
    const nextSection = document.getElementById('what-we-do')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pb-16 lg:pb-20">{/* Background now handled by MainLayout */}

      {/* Parallax Content */}
      <Container className="relative flex-1 flex flex-col items-center justify-center text-center px-4">
        <div 
          className="space-y-8 max-w-4xl mx-auto"
          style={{
            transform: `translateY(${Math.max(-50, Math.min(50, scrollY * 0.2))}px)`,
          }}
        >
          {/* Logo - Dominant Visual Element */}
          <div className="relative mb-12">
            <div className="relative inline-block">
              <Image
                src="/logo1.png"
                alt="Love 4 Detailing"
                width={400}
                height={400}
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[448px] lg:h-[448px] xl:w-[512px] xl:h-[512px] object-contain drop-shadow-2xl"
                priority
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-brand-600/20 rounded-full blur-3xl scale-110 -z-10" />
            </div>
          </div>

          {/* Typography Hierarchy */}
          <div className="space-y-6">
            {/* H1 - Clear Value Proposition */}
            <Heading 
              as="h1" 
              size="h1" 
              color="white" 
              align="center" 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-tight"
            >
              Mobile Car Detailing,
              <span className="block text-brand-400">Done Right.</span>
            </Heading>

            {/* H2 - Supporting Statement */}
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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 px-4 sm:px-0">
            <Link href="/book" className="w-full sm:w-auto">
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto min-w-[200px] bg-brand-600 hover:bg-brand-700 shadow-purple-lg hover:shadow-purple-xl transition-all duration-300 sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
              >
                Book Service
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              fullWidth
              className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto min-w-[200px] border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 sm:w-auto"
              onClick={() => window.location.href = 'tel:+447908625581'}
            >
              Call
            </Button>
          </div>

        </div>
      </Container>

      {/* Animated Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <button
          onClick={scrollToNextSection}
          className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors duration-300 group"
          aria-label="Scroll to explore more"
        >
          <Text size="sm" weight="medium" className="tracking-wide hidden sm:block">Scroll to Explore</Text>
          <Text size="xs" weight="medium" className="tracking-wide sm:hidden">Explore</Text>
          <ChevronDown className={cn(
            "w-6 h-6 animate-bounce group-hover:animate-purple-bounce transition-all duration-300"
          )} />
        </button>
      </div>

      {/* Subtle animated particles (optional enhancement) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-brand-400/30 rounded-full animate-purple-pulse" />
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-brand-300/40 rounded-full animate-purple-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-brand-500/20 rounded-full animate-purple-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </section>
  )
}