'use client'

import { useEffect, useRef, useState } from 'react'
import { Container } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  {
    title: 'Schedule Service',
    description: 'Book online in minutes with flexible time slots that work for your schedule',
    icon: 'calendar'
  },
  {
    title: 'Professional Arrival',
    description: 'Our certified detailers arrive on time with premium equipment and eco-friendly products',
    icon: 'location'
  },
  {
    title: 'Quality Completion',
    description: 'Receive professional-grade detailing with real-time updates and satisfaction guarantee',
    icon: 'check'
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
      className="relative overflow-hidden py-16 lg:py-24"
    >
      <Container>
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className={cn(
            "text-center mb-20",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700"
          )}>
            <Heading size="h2" align="center" className="mb-6 text-white">
              How We Work
            </Heading>
            <Text size="xl" color="secondary" align="center" className="text-gray-300 max-w-2xl mx-auto">
              Professional mobile detailing delivered with precision, expertise, and care
            </Text>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connection line - elegant and subtle */}
            <div className="hidden lg:block absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <div className="h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
              {steps.map((step, index) => {
                const IconComponent = step.icon === 'calendar' ? Calendar : 
                                   step.icon === 'location' ? MapPin : CheckCircle2
                
                return (
                  <div 
                    key={step.title}
                    className={cn(
                      "text-center relative",
                      inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                      "transition-all duration-700"
                    )}
                    style={{ transitionDelay: `${300 + index * 200}ms` }}
                  >
                    {/* Professional Icon */}
                    <div className="relative z-10 w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-brand-500/20 to-brand-700/20 backdrop-blur-sm border border-brand-400/30 rounded-2xl flex items-center justify-center shadow-lg">
                      <IconComponent className="w-9 h-9 text-brand-400" />
                    </div>
                    
                    {/* Content */}
                    <Heading size="h4" weight="semibold" className="mb-4 text-white">
                      {step.title}
                    </Heading>
                    <Text color="secondary" className="max-w-sm mx-auto text-gray-300 leading-relaxed">
                      {step.description}
                    </Text>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}