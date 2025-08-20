'use client'

import { useEffect, useRef, useState } from 'react'
import { Container } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps: Array<{
  title: string
  description: string
  icon: 'calendar' | 'location' | 'check'
  number: string
}> = [
  {
    title: 'Book Online',
    description: 'Choose your service and book in under 3 minutes with real-time availability.',
    icon: 'calendar',
    number: '01',
  },
  {
    title: 'We Come to You',
    description: 'Professional team arrives at your location with all equipment and eco-friendly products.',
    icon: 'location', 
    number: '02',
  },
  {
    title: 'Expert Service',
    description: 'Certified detailers deliver exceptional results with our satisfaction guarantee.',
    icon: 'check',
    number: '03',
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
      className="relative overflow-hidden py-24 lg:py-32"
    >
      <Container>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={cn(
            "text-center mb-12 sm:mb-16 lg:mb-20",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700"
          )}>
            <Heading size="h2" align="center" className="mb-6 text-3xl md:text-4xl lg:text-5xl">
              Get started in 3 steps
            </Heading>
            <Text size="xl" color="secondary" align="center" className="max-w-2xl mx-auto text-lg md:text-xl">
              Clean, modern flow with visual previews from the app
            </Text>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon === 'calendar' ? Calendar : step.icon === 'location' ? MapPin : CheckCircle2
              const renderPreview = () => {
                if (index === 0) {
                  // Step 1: Mini booking UI
                  return (
                    <div className="w-full h-full flex items-center justify-center p-3 sm:p-4">
                      <div className="w-full max-w-[420px] bg-surface-primary/80 border border-border-secondary rounded-xl p-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="h-6 rounded bg-surface-tertiary" />
                          <div className="h-6 rounded bg-surface-tertiary" />
                        </div>
                        <div className="h-6 rounded bg-surface-tertiary mb-1" />
                        <p className="text-[10px] text-text-tertiary mb-2">Enter your postcode</p>
                        <div className="h-20 rounded-lg bg-surface-tertiary mb-3" />
                        <p className="text-[10px] text-text-tertiary mb-2">Pick a service</p>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 h-7 rounded-md bg-brand-600/80" />
                          <div className="w-16 h-7 rounded-md border border-border-secondary" />
                        </div>
                        <p className="text-[10px] text-text-tertiary mt-2">Start in minutes</p>
                      </div>
                    </div>
                  )
                }
                if (index === 1) {
                  // Step 2: Mini schedule/map UI
                  return (
                    <div className="w-full h-full flex items-center justify-center p-3 sm:p-4">
                      <div className="w-full max-w-[420px] bg-surface-primary/80 border border-border-secondary rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-5 w-24 rounded bg-surface-tertiary" />
                          <div className="h-5 w-16 rounded bg-surface-tertiary" />
                        </div>
                        <p className="text-[10px] text-text-tertiary mb-1">Available slots</p>
                        <div className="grid grid-cols-7 gap-1 mb-3">
                          {Array.from({ length: 21 }).map((_, i) => (
                            <div key={i} className={`h-4 rounded ${i % 5 === 0 ? 'bg-brand-600/60' : 'bg-surface-tertiary'}`} />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-brand-600" />
                          <div className="h-5 flex-1 rounded bg-surface-tertiary" />
                        </div>
                        <p className="text-[10px] text-text-tertiary mt-2">We come to your location</p>
                      </div>
                    </div>
                  )
                }
                // Step 3: Mini confirmation UI
                return (
                  <div className="w-full h-full flex items-center justify-center p-3 sm:p-4">
                    <div className="w-full max-w-[420px] bg-surface-primary/80 border border-border-secondary rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-success-500" />
                        <div className="h-5 w-40 rounded bg-surface-tertiary" />
                      </div>
                      <p className="text-[10px] text-text-tertiary mb-2">Booking reference: LFD-3980</p>
                      <div className="h-16 rounded-lg bg-surface-tertiary mb-3" />
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 h-7 rounded-md bg-brand-600/80" />
                        <div className="w-24 h-7 rounded-md border border-border-secondary" />
                      </div>
                      <p className="text-[10px] text-text-tertiary mt-2">You’ll receive email updates</p>
                    </div>
                  </div>
                )
              }
              return (
                <div
                  key={step.title}
                  className={cn(
                    "rounded-xl border border-border-secondary bg-surface-secondary overflow-hidden",
                    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
                    "transition-all duration-700"
                  )}
                  style={{ transitionDelay: `${200 + index * 150}ms` }}
                >
                  {/* Preview */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-brand-700/20 via-brand-600/15 to-brand-400/10">
                    {renderPreview()}
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6">
                    <div className="text-xs font-semibold tracking-wider text-text-tertiary mb-2">
                      STEP {index + 1}
                    </div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-brand-500" />
                      </div>
                      <Heading size="h4" className="text-base sm:text-lg">{step.title}</Heading>
                    </div>
                    <Text color="secondary" className="text-sm sm:text-[15px] leading-relaxed">
                      {step.description}
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}