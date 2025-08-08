'use client'

import { useEffect, useRef, useState } from 'react'
import { Container } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  {
    title: 'Book Online',
    description: 'Choose your service, select a time slot, and book in under 3 minutes. Our smart booking system shows real-time availability.',
    details: [
      'Instant online booking',
      'Real-time availability',
      'Flexible scheduling',
      'Service customization'
    ],
    icon: 'calendar',
    color: 'from-blue-500/20 to-blue-700/20',
    iconColor: 'text-blue-400'
  },
  {
    title: 'We Come to You',
    description: 'Our professional team arrives at your location with all equipment, water, and premium eco-friendly products.',
    details: [
      'Fully mobile service',
      'Professional equipment',
      'Eco-friendly products',
      'On-time guarantee'
    ],
    icon: 'location',
    color: 'from-green-500/20 to-green-700/20',
    iconColor: 'text-green-400'
  },
  {
    title: 'Expert Service',
    description: 'Certified detailers deliver exceptional results with attention to detail and satisfaction guarantee.',
    details: [
      'Certified professionals',
      'Quality guarantee',
      'Progress updates',
      'Final inspection'
    ],
    icon: 'check',
    color: 'from-purple-500/20 to-purple-700/20',
    iconColor: 'text-purple-400'
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
            {/* Enhanced Connection line with step numbers */}
            <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-5xl">
              <div className="h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent"></div>
              {/* Step connectors */}
              <div className="absolute top-0 left-1/6 w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full transform -translate-x-2 -translate-y-2 flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div className="absolute top-0 left-1/2 w-4 h-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full transform -translate-x-2 -translate-y-2 flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div className="absolute top-0 right-1/6 w-4 h-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full transform translate-x-2 -translate-y-2 flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
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
                    {/* Enhanced Icon with step-specific colors */}
                    <div className={cn(
                      "relative z-10 w-24 h-24 mx-auto mb-8 bg-gradient-to-br backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center shadow-xl",
                      step.color
                    )}>
                      <IconComponent className={cn("w-10 h-10", step.iconColor)} />
                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-gray-800 text-sm font-bold">{index + 1}</span>
                      </div>
                    </div>
                    
                    {/* Enhanced Content */}
                    <div className="space-y-4">
                      <Heading size="h4" weight="semibold" className="mb-3 text-white">
                        {step.title}
                      </Heading>
                      <Text color="secondary" className="max-w-sm mx-auto text-gray-300 leading-relaxed mb-4">
                        {step.description}
                      </Text>
                      
                      {/* Feature highlights */}
                      <div className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center justify-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", step.iconColor.replace('text-', 'bg-'))}></div>
                            <Text size="sm" className="text-gray-400">
                              {detail}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom highlight section */}
            <div className={cn(
              "mt-16 p-8 bg-gradient-to-r from-brand-600/10 via-brand-500/10 to-brand-600/10 rounded-2xl border border-brand-400/20",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              "transition-all duration-700 delay-1000"
            )}>
              <div className="text-center">
                <Heading size="h4" className="mb-4 text-white">
                  Why Choose Love4Detailing?
                </Heading>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-400 mb-2">100%</div>
                    <Text size="sm" color="secondary" className="text-gray-300">Satisfaction</Text>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-400 mb-2">5★</div>
                    <Text size="sm" color="secondary" className="text-gray-300">Average Rating</Text>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-400 mb-2">24h</div>
                    <Text size="sm" color="secondary" className="text-gray-300">Response Time</Text>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-400 mb-2">SW9</div>
                    <Text size="sm" color="secondary" className="text-gray-300">Based Location</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}