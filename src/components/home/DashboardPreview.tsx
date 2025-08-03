'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Container, GridLayout } from '@/components/layout/templates/PageLayout'
import { Button } from '@/components/ui/primitives/Button'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { 
  Calendar, 
  Clock, 
  Car, 
  MapPin, 
  CreditCard,
  BarChart3,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const dashboardFeatures = [
  {
    icon: Calendar,
    title: 'Easy Online Booking',
    description: 'Book your service in minutes. Choose your service, preferred date, and location across SW9 and surrounding areas.'
  },
  {
    icon: BarChart3,
    title: 'Service Management',
    description: 'Track your bookings, view service history, and manage multiple vehicles all in one convenient dashboard.'
  },
  {
    icon: CreditCard,
    title: 'Transparent Pricing',
    description: 'See exact pricing upfront with no hidden fees. Secure online payment with location-based pricing for South London.'
  }
]


export function DashboardPreview() {
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
            "text-center mb-16",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700"
          )}>
            <Heading size="h2" align="center" className="mb-6">
              Modern Booking Experience
            </Heading>
            <Text size="xl" color="secondary" leading="relaxed" align="center" className="max-w-2xl mx-auto">
              Manage your car detailing services across SW9 and South London with ease. Everything you need in one place.
            </Text>
          </div>

          {/* Feature Grid */}
          <GridLayout columns={{ default: 1, md: 2, lg: 3 }} gap="lg">
            {dashboardFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={feature.title}
                  className={cn(
                    "text-center p-4",
                    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                    "transition-all duration-500"
                  )}
                  style={{ transitionDelay: `${200 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-brand-600/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <Heading size="h4" weight="semibold" className="mb-2">
                    {feature.title}
                  </Heading>
                  <Text size="sm" color="secondary">
                    {feature.description}
                  </Text>
                </div>
              )
            })}
          </GridLayout>

          {/* CTA */}
          <div className={cn(
            "text-center mt-16",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-500 delay-800"
          )}>
            <Link href="/book">
              <Button 
                variant="primary" 
                size="lg"
                className="bg-brand-600 hover:bg-brand-700 shadow-purple-lg hover:shadow-purple-xl transition-all duration-300"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Start Booking Today
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}