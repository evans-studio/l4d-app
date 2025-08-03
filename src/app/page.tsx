'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/primitives/Button'
import { Container, Section, GridLayout } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { Badge } from '@/components/ui/primitives/Badge'
import { Skeleton } from '@/components/ui/primitives/Skeleton'
import { ArrowRight, Star, CheckCircle, Award, Car, Sparkles, Palette, Shield, Heart, Users, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { MainLayout } from '@/components/layouts/MainLayout'

// Import new homepage components
import { HeroSection } from '@/components/home/HeroSection'
import { WhatWeDoSection } from '@/components/home/WhatWeDoSection'
import { DashboardPreview } from '@/components/home/DashboardPreview'
import { FAQSection } from '@/components/home/FAQSection'
import { ServiceAreaCheck } from '@/components/home/ServiceAreaCheck'

interface ServiceData {
  id: string
  name: string
  description: string
  duration: number
  basePrice: number
  pricing: Array<{
    vehicleSize: string
    price: number
    sizeOrder: number
  }>
}

export default function HomePage() {
  const [services, setServices] = React.useState<ServiceData[]>([])
  const [servicesLoading, setServicesLoading] = React.useState(true)

  // Fetch services data
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services/homepage')
        const data = await response.json()
        
        if (data.success) {
          setServices(data.data || [])
        } else {
          console.error('Failed to fetch services:', data.error)
        }
      } catch (error) {
        console.error('Services fetch error:', error)
      } finally {
        setServicesLoading(false)
      }
    }

    fetchServices()
  }, [])

  return (
    <MainLayout>
      {/* New Full-Screen Hero Section */}
      <div className="relative z-0">
        <HeroSection />
      </div>

      {/* New What We Do Section */}
      <div className="relative z-10 bg-surface-primary">
        <WhatWeDoSection />
      </div>

      {/* Enhanced Services Section */}
      <div id="services" className="relative z-10 bg-surface-primary">
        <Section background="transparent" padding="xl">
        <Container>
          <div className="text-center mb-16">
            <Heading size="h2" align="center" className="mb-4">
              Our Services
            </Heading>
            <Text size="xl" color="secondary" align="center" className="max-w-2xl mx-auto">
              Professional car detailing services designed to keep your vehicle looking its absolute best
            </Text>
          </div>
          
          {servicesLoading ? (
            <GridLayout columns={{ default: 1, md: 3 }} gap="lg">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="relative border-2 border-border-secondary">
                  <CardHeader>
                    <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                    <Skeleton className="h-6 mb-2" />
                    <Skeleton className="h-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                    </div>
                    <Skeleton className="h-8" />
                  </CardContent>
                </Card>
              ))}
            </GridLayout>
          ) : (
            <GridLayout columns={{ default: 1, md: 3 }} gap="lg">
              {services.slice(0, 3).map((service, index) => {
                const isPopular = service.name.toLowerCase().includes('full valet') // Make Full Valet popular
                const ServiceIcon = index === 0 ? Sparkles : index === 1 ? Palette : Shield
                
                return (
                  <Card 
                    key={service.id} 
                    className={cn(
                      "relative border-2 transition-all duration-300",
                      isPopular 
                        ? "border-brand-500 bg-brand-600/5 shadow-purple-lg" 
                        : "border-border-secondary hover:border-brand-400"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="primary" size="sm" className="bg-brand-600 hover:bg-brand-700">
                          MOST POPULAR
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="w-12 h-12 bg-brand-600/10 rounded-lg flex items-center justify-center mb-4">
                        <ServiceIcon className="w-6 h-6 text-brand-600" />
                      </div>
                      <Heading size="h4" className="text-xl">{service.name}</Heading>
                      <Text color="secondary">{service.description}</Text>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <Text size="sm" color="secondary" className="mb-2">
                          Duration: ~{Math.round(service.duration / 60)} hours
                        </Text>
                        {service.pricing.length > 0 && (
                          <Text size="xs" color="muted">
                            Pricing varies by vehicle size
                          </Text>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Text size="sm" color="secondary">From</Text>
                        <Text size="2xl" weight="bold" color="accent">£{service.basePrice}</Text>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/book?service=${service.id}`} className="w-full">
                        <Button 
                          variant={isPopular ? "primary" : "outline"} 
                          fullWidth
                        >
                          Choose {service.name}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
            </GridLayout>
          )}
        </Container>
        </Section>
      </div>

      {/* New Dashboard Preview Section */}
      <div className="relative z-10 bg-surface-primary">
        <DashboardPreview />
      </div>

      {/* New Service Area Check */}
      <div className="relative z-10 bg-surface-primary">
        <ServiceAreaCheck />
      </div>

      {/* New FAQ Section */}
      <div className="relative z-10 bg-surface-primary">
        <FAQSection />
      </div>

      {/* Final CTA Section */}
      <div id="contact" className="relative z-10 bg-surface-primary">
        <Section background="transparent" padding="xl">
        <Container>
          <div className="text-center">
            <Heading size="h2" align="center" className="mb-4">Ready to Transform Your Car?</Heading>
            <Text size="xl" color="secondary" align="center" className="mb-8">Book your professional mobile detailing service today</Text>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Link href="/book" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" fullWidth className="bg-brand-600 hover:bg-brand-700 shadow-purple-lg hover:shadow-purple-xl sm:w-auto">
                  Book Now
                </Button>
              </Link>
              <Button variant="outline" size="lg" fullWidth onClick={() => window.location.href = 'tel:+447908625581'} className="hover:border-brand-400 hover:text-brand-400 sm:w-auto">
                Call 07908 625581
              </Button>
            </div>
          </div>
        </Container>
        </Section>
      </div>
    </MainLayout>
  )
}