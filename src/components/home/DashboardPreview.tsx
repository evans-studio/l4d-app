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
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

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
      className="relative overflow-hidden min-h-screen flex flex-col justify-center py-32 md:py-40 lg:py-48"
      data-ui={isNewUIEnabled() ? 'new' : 'old'}
    >
      
      <Container>
        <div className="max-w-6xl mx-auto">
          
          {/* Header with enhanced spacing */}
          <div className={cn(
            "text-center mb-20 lg:mb-24",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700"
          )}>
            <Heading size="h2" align="center" className="mb-8 text-3xl md:text-4xl lg:text-5xl">
              Manage Everything in One Place
            </Heading>
            <Text size="xl" color="secondary" leading="relaxed" align="center" className="max-w-3xl mx-auto text-lg md:text-xl">
              Your personal car care dashboard - accessible 24/7, designed for simplicity and control
            </Text>
          </div>

          {/* Benefits with proper spacing and mobile alignment */}
          <div className={cn(
            "mb-16 lg:mb-20",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-500 delay-200"
          )}>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-16">
              {dashboardBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4 w-full max-w-sm lg:max-w-none lg:w-auto">
                  <div className="w-3 h-3 bg-brand-600 rounded-full flex-shrink-0"></div>
                  <Text size="lg" color="primary" className="font-medium text-base md:text-lg text-left">
                    {benefit}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Dashboard Preview - Full Showcase */}
          <div className={cn(
            "mb-20 lg:mb-24 flex items-center justify-center",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-500 delay-400"
          )}>
            <div className="bg-gradient-to-br from-surface-primary to-surface-secondary rounded-2xl border border-border-secondary p-8 lg:p-12 shadow-2xl w-full max-w-5xl hover:transform hover:scale-[1.02] transition-all duration-500">
              {/* Dashboard Header with enhanced spacing */}
              <div className="flex items-center justify-between mb-10 lg:mb-12">
                <div>
                  <Heading size="h4" className="mb-3 text-xl lg:text-2xl">Your Dashboard</Heading>
                  <Text color="secondary" className="text-base lg:text-lg">Welcome back, manage your bookings and vehicles</Text>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <Text size="sm" color="secondary">All systems operational</Text>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                {/* Quick Actions Card */}
                <div className="bg-surface-secondary rounded-xl p-6 lg:p-7 border border-border-secondary hover:border-brand-400 transition-colors duration-300 min-h-[200px]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <Text size="sm" weight="medium" className="mb-1">Quick Booking</Text>
                      <Text size="xs" color="secondary">Book your next service</Text>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button size="sm" variant="primary" className="w-full justify-start min-h-[40px]">Book New Service</Button>
                  </div>
                </div>

                {/* Recent Bookings Card */}
                <div className="bg-surface-secondary rounded-xl p-6 lg:p-7 border border-border-secondary hover:border-brand-400 transition-colors duration-300 min-h-[200px]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <Text size="sm" weight="medium" className="mb-1">Recent Activity</Text>
                      <Text size="xs" color="secondary">Your booking history</Text>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text size="sm" className="mb-1">Full Detail</Text>
                        <Text size="xs" color="secondary">Nov 15, 2024</Text>
                      </div>
                      <div className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                        Completed
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Text size="sm" className="mb-1">Exterior Wash</Text>
                        <Text size="xs" color="secondary">Oct 28, 2024</Text>
                      </div>
                      <div className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                        Completed
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Management Card */}
                <div className="bg-surface-secondary rounded-xl p-6 lg:p-7 border border-border-secondary hover:border-brand-400 transition-colors duration-300 min-h-[200px]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <Text size="sm" weight="medium" className="mb-1">Your Vehicles</Text>
                      <Text size="xs" color="secondary">Manage vehicle details</Text>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-surface-tertiary rounded-lg">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <Text size="sm" className="mb-1">BMW 3 Series</Text>
                        <Text size="xs" color="secondary">2019 · Black</Text>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs min-h-[36px]">
                      + Add Vehicle
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Stats Row with enhanced spacing */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-10 lg:mt-12 pt-8 lg:pt-10 border-t border-border-secondary">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-brand-600" />
                  </div>
                  <Text size="sm" weight="medium" className="mb-1">12</Text>
                  <Text size="xs" color="secondary">Total Services</Text>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <CreditCard className="w-6 h-6 text-brand-600" />
                  </div>
                  <Text size="sm" weight="medium" className="mb-1">£340</Text>
                  <Text size="xs" color="secondary">Total Spent</Text>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 text-brand-600" />
                  </div>
                  <Text size="sm" weight="medium" className="mb-1">2</Text>
                  <Text size="xs" color="secondary">Locations</Text>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-brand-600" />
                  </div>
                  <Text size="sm" weight="medium" className="mb-1">24h</Text>
                  <Text size="xs" color="secondary">Avg Response</Text>
                </div>
              </div>
            </div>
          </div>

          {/* CTA with proper spacing */}
          <div className={cn(
            "text-center",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-500 delay-600"
          )}>
            <Link href="/auth/register">
              <Button 
                variant="primary" 
                size="lg"
                className="bg-brand-600 hover:bg-brand-700 shadow-purple-lg hover:shadow-purple-xl transition-all duration-300 min-h-[50px] px-8 text-base lg:text-lg"
              >
                Create Your Account
              </Button>
            </Link>
            <Text size="sm" color="secondary" align="center" className="mt-4 max-w-md mx-auto">
              Join thousands of satisfied customers and experience premium car care
            </Text>
          </div>
        </div>
      </Container>
    </section>
  )
}