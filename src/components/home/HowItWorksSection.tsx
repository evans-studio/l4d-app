'use client'

import { useEffect, useRef, useState } from 'react'
import { Container } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  {
    title: 'Book Online',
    description: 'Choose your service and book in under 3 minutes with real-time availability.',
    icon: 'calendar',
    number: '01'
  },
  {
    title: 'We Come to You',
    description: 'Professional team arrives at your location with all equipment and eco-friendly products.',
    icon: 'location', 
    number: '02'
  },
  {
    title: 'Expert Service',
    description: 'Certified detailers deliver exceptional results with our satisfaction guarantee.',
    icon: 'check',
    number: '03'
  }
]

export function HowItWorksSection() {
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setInView(true)
        }
      },
      {
        threshold: 0.2,
        rootMargin: '-50px'
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden py-32 lg:py-40"
    >
      <Container>
        <div className="max-w-7xl mx-auto">
          
          {/* Header with clean spacing */}
          <div className={cn(
            "text-center mb-24 lg:mb-32",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700"
          )}>
            <Heading size="h2" align="center" className="mb-8 text-3xl md:text-4xl lg:text-5xl text-white">
              How It Works
            </Heading>
            <Text size="xl" color="secondary" align="center" className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl">
              Simple, professional, and reliable car detailing in 3 easy steps
            </Text>
          </div>

          {/* Clean 3-Step Process - Horizontal Layout with Proper Spacing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">
            {steps.map((step, index) => {
              const IconComponent = step.icon === 'calendar' ? Calendar : 
                                 step.icon === 'location' ? MapPin : CheckCircle2
              
              return (
                <div 
                  key={step.title}
                  className={cn(
                    "text-center group",
                    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                    "transition-all duration-700 hover:transform hover:scale-105"
                  )}
                  style={{ transitionDelay: `${300 + index * 200}ms` }}
                >
                  {/* Clean Step Number */}
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto bg-brand-600/20 border border-brand-400/30 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:bg-brand-600/30 transition-colors duration-300">
                      <IconComponent className="w-8 h-8 text-brand-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-brand-600 text-sm font-bold">{step.number}</span>
                    </div>
                  </div>
                  
                  {/* Clean Content with Breathing Room */}
                  <div className="space-y-6">
                    <Heading size="h4" weight="semibold" className="text-xl lg:text-2xl text-white">
                      {step.title}
                    </Heading>
                    <Text color="secondary" className="max-w-sm mx-auto text-gray-300 leading-relaxed text-base lg:text-lg">
                      {step.description}
                    </Text>
                  </div>

                  {/* Connection Line (Desktop Only) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-24 h-px bg-gradient-to-r from-brand-400/50 to-transparent transform translate-x-0"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}