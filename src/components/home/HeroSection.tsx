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
    const nextSection = document.getElementById('services')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pb-32 lg:pb-40">{/* Background now handled by MainLayout */}

      {/* Parallax Content */}
      <Container className="relative flex-1 flex flex-col items-center justify-center text-center px-4">
        <div 
          className="max-w-4xl mx-auto pt-16 md:pt-20 lg:pt-24"
          style={{
            transform: `translateY(${Math.max(-50, Math.min(50, scrollY * 0.2))}px)`,
          }}
        >
          {/* Logo - Dominant Visual Element with proper top spacing */}
          <div className="relative mb-10 md:mb-12 lg:mb-16">
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
          <div className="space-y-5 mb-10 lg:mb-12">
            {/* H1 - Clear Value Proposition with 40px space from logo */}
            <Heading 
              as="h1" 
              size="h1" 
              color="white" 
              align="center" 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-tight mb-5"
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-0 mb-16 lg:mb-20">
            <Link href="/book" className="w-full sm:w-auto">
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto min-w-[200px] bg-brand-600 hover:bg-brand-700 shadow-purple-lg hover:shadow-purple-xl transition-all duration-300 sm:w-auto min-h-[50px]"
                rightIcon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
              >
                Book Service
              </Button>
            </Link>
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg"
                fullWidth
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto min-w-[200px] border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 sm:w-auto min-h-[50px]"
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

        </div>
      </Container>

    </section>
  )
}