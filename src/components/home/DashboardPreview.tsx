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

          {/* Interactive Dashboard Preview */}
          <div className={cn(
            "mb-16",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-500 delay-400"
          )}>
            <div className="bg-gradient-to-br from-surface-primary to-surface-secondary rounded-xl border border-border-secondary p-6 shadow-lg">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <Heading size="h4" className="mb-2">Your Dashboard</Heading>
                  <Text color="secondary">Welcome back, manage your bookings and vehicles</Text>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <Text size="sm" color="secondary">All systems operational</Text>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions Card */}
                <div className="bg-surface-secondary rounded-lg p-5 border border-border-secondary">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <Text size="sm" weight="medium">Quick Booking</Text>
                      <Text size="xs" color="secondary">Book your next service</Text>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button size="sm" variant="primary" className="w-full justify-start">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Book New Service
                    </Button>
                  </div>
                </div>

                {/* Recent Bookings Card */}
                <div className="bg-surface-secondary rounded-lg p-5 border border-border-secondary">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <Text size="sm" weight="medium">Recent Activity</Text>
                      <Text size="xs" color="secondary">Your booking history</Text>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text size="sm">Full Detail</Text>
                        <Text size="xs" color="secondary">Nov 15, 2024</Text>
                      </div>
                      <div className="px-2 py-1 bg-success-100 text-success-700 rounded text-xs">
                        Completed
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Text size="sm">Exterior Wash</Text>
                        <Text size="xs" color="secondary">Oct 28, 2024</Text>
                      </div>
                      <div className="px-2 py-1 bg-success-100 text-success-700 rounded text-xs">
                        Completed
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Management Card */}
                <div className="bg-surface-secondary rounded-lg p-5 border border-border-secondary">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <Text size="sm" weight="medium">Your Vehicles</Text>
                      <Text size="xs" color="secondary">Manage vehicle details</Text>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-surface-tertiary rounded">
                      <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                        <Car className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <Text size="sm">BMW 3 Series</Text>
                        <Text size="xs" color="secondary">2019 · Black</Text>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      + Add Vehicle
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-secondary">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="w-5 h-5 text-brand-600" />
                  </div>
                  <Text size="sm" weight="medium">12</Text>
                  <Text size="xs" color="secondary">Total Services</Text>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CreditCard className="w-5 h-5 text-brand-600" />
                  </div>
                  <Text size="sm" weight="medium">£340</Text>
                  <Text size="xs" color="secondary">Total Spent</Text>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MapPin className="w-5 h-5 text-brand-600" />
                  </div>
                  <Text size="sm" weight="medium">2</Text>
                  <Text size="xs" color="secondary">Locations</Text>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-brand-600" />
                  </div>
                  <Text size="sm" weight="medium">24h</Text>
                  <Text size="xs" color="secondary">Avg Response</Text>
                </div>
              </div>
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
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}