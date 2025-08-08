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

const dashboardBenefits = [
  'Book and reschedule services instantly',
  'Track your complete service history', 
  'Manage multiple vehicles in one account'
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
      className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-surface-primary to-surface-secondary"
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
              Manage Everything in One Place
            </Heading>
            <Text size="xl" color="secondary" leading="relaxed" align="center" className="max-w-2xl mx-auto">
              Your personal car care dashboard - accessible 24/7
            </Text>
          </div>

          {/* Benefits as horizontal text list */}
          <div className={cn(
            "mb-16",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-500 delay-200"
          )}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 text-center md:text-left">
              {dashboardBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-600 rounded-full flex-shrink-0"></div>
                  <Text size="lg" color="primary" className="font-medium">
                    {benefit}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Mockup Placeholder */}
          <div className={cn(
            "mb-16",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-500 delay-400"
          )}>
            <div className="mockup-placeholder h-[500px] bg-gradient-to-br from-surface-tertiary to-surface-secondary rounded-xl border border-border-secondary flex items-center justify-center">
              <Text color="secondary" className="text-center">
                Dashboard Mockup
                <br />
                <span className="text-sm opacity-60">Screenshot placeholder - 500px height</span>
              </Text>
            </div>
          </div>

          {/* CTA */}
          <div className={cn(
            "text-center",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-500 delay-600"
          )}>
            <Link href="/auth/register">
              <Button 
                variant="primary" 
                size="lg"
                className="bg-brand-600 hover:bg-brand-700 shadow-purple-lg hover:shadow-purple-xl transition-all duration-300"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Sign Up & Book
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}