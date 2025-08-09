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
import { DashboardPreview } from '@/components/home/DashboardPreview'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { ServiceAreaAndFAQ } from '@/components/home/ServiceAreaAndFAQ'

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


      {/* Enhanced Services Section - Full Viewport */}
      <section id="services" className="relative z-10 min-h-screen flex flex-col justify-center py-24 md:py-32 lg:py-40">
        <Container>
          {/* Section Header with proper spacing */}
          <div className="text-center mb-20 lg:mb-24">
            <Heading size="h2" align="center" className="mb-6 text-3xl md:text-4xl lg:text-5xl">
              Our Services
            </Heading>
            <Text size="xl" color="secondary" align="center" className="max-w-2xl mx-auto text-lg md:text-xl">
              Professional car detailing services designed to keep your vehicle looking its absolute best
            </Text>
          </div>
          
          {/* Services Grid with breathing room */}
          <div className="flex-1 flex items-center justify-center">
            {servicesLoading ? (
              <GridLayout columns={{ default: 1, sm: 2, md: 3 }} gap="lg" className="lg:gap-12 w-full max-w-7xl">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="relative border-2 border-border-secondary min-h-[400px]">
                    <CardHeader className="pb-6">
                      <Skeleton className="w-12 h-12 rounded-lg mb-6" />
                      <Skeleton className="h-6 mb-3" />
                      <Skeleton className="h-4" />
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="space-y-4 mb-8">
                        <Skeleton className="h-4" />
                        <Skeleton className="h-4" />
                        <Skeleton className="h-4" />
                      </div>
                      <Skeleton className="h-12" />
                    </CardContent>
                  </Card>
                ))}
              </GridLayout>
            ) : (
              <GridLayout columns={{ default: 1, sm: 2, md: 3 }} gap="lg" className="lg:gap-12 w-full max-w-7xl">
                {services.slice(0, 3).map((service, index) => {
                  const isPopular = service.name.toLowerCase().includes('full valet') // Make Full Valet popular
                  const ServiceIcon = index === 0 ? Sparkles : index === 1 ? Palette : Shield
                  
                  return (
                    <Card 
                      key={service.id} 
                      className={cn(
                        "relative border-2 transition-all duration-300 min-h-[400px] hover:transform hover:scale-105",
                        isPopular 
                          ? "border-brand-500 bg-brand-600/5 shadow-purple-lg" 
                          : "border-border-secondary hover:border-brand-400 hover:shadow-lg"
                      )}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge variant="primary" size="sm" className="bg-brand-600 hover:bg-brand-700">
                            MOST POPULAR
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-6">
                        <div className="w-14 h-14 bg-brand-600/10 rounded-lg flex items-center justify-center mb-6">
                          <ServiceIcon className="w-7 h-7 text-brand-600" />
                        </div>
                        <Heading size="h4" className="text-xl mb-3">{service.name}</Heading>
                        <Text color="secondary" className="text-base leading-relaxed">{service.description}</Text>
                      </CardHeader>
                      <CardContent className="pb-6 flex-1">
                        <div className="mb-8">
                          <Text size="sm" color="secondary" className="mb-3">
                            Duration: ~{Math.round(service.duration / 60)} hours
                          </Text>
                          {service.pricing.length > 0 && (
                            <Text size="xs" color="muted">
                              Pricing varies by vehicle size
                            </Text>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                          <Text size="sm" color="secondary">
                            {service.basePrice === 0 ? 'Price:' : 'From'}
                          </Text>
                          <Text size="2xl" weight="bold" color="accent">
                            {service.basePrice === 0 ? (
                              // Check if this is a testing service or genuinely free
                              service.name.toLowerCase().includes('test') 
                                ? 'Test Service' 
                                : 'Free'
                            ) : `£${service.basePrice}`}
                          </Text>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Link href={`/book?service=${service.id}`} className="w-full">
                          <Button 
                            variant={isPopular ? "primary" : "outline"} 
                            fullWidth
                            className="min-h-[48px] text-base font-medium"
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
          </div>
        </Container>
      </section>

      {/* New Dashboard Preview Section */}
      <div className="relative z-10">
        <DashboardPreview />
      </div>

      {/* How It Works Section */}
      <div className="relative z-10">
        <HowItWorksSection />
      </div>

      {/* Combined Service Area + FAQ Section */}
      <div className="relative z-10">
        <ServiceAreaAndFAQ />
      </div>

      {/* Final CTA Section - Enhanced with Proper Spacing */}
      <section id="contact" className="relative z-10 py-32 lg:py-40 border-t border-border-secondary/30">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            {/* Strong Visual Separation */}
            <div className="mb-12 lg:mb-16">
              <div className="inline-flex items-center gap-3 bg-brand-600/10 rounded-full px-6 py-3 mb-8">
                <Heart className="w-5 h-5 text-brand-600" />
                <span className="text-brand-600 font-medium">Ready to Get Started?</span>
              </div>
              <Heading size="h2" align="center" className="mb-8 text-3xl md:text-4xl lg:text-5xl">
                Ready for Proper Car Care?
              </Heading>
              <Text size="xl" color="secondary" align="center" className="mb-12 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
                Join thousands of customers across South London who trust Love 4 Detailing for premium mobile car detailing
              </Text>
            </div>
            
            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-lg sm:max-w-none mx-auto mb-12">
              <Link href="/book" className="w-full sm:w-auto">
                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  className="bg-brand-600 hover:bg-brand-700 shadow-purple-lg hover:shadow-purple-xl hover:scale-105 sm:w-auto min-h-[56px] text-base sm:text-lg px-10 transition-all duration-300"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Book Your Service
                </Button>
              </Link>
              <div className="flex items-center gap-4 text-text-muted">
                <div className="hidden sm:block w-12 h-px bg-border-secondary"></div>
                <Text size="sm" className="whitespace-nowrap">or</Text>
                <div className="hidden sm:block w-12 h-px bg-border-secondary"></div>
              </div>
              <Button 
                variant="outline" 
                size="lg" 
                fullWidth 
                onClick={() => window.location.href = 'tel:+447908625581'} 
                className="hover:border-brand-400 hover:text-brand-400 hover:bg-brand-400/5 sm:w-auto min-h-[56px] text-base sm:text-lg px-10 transition-all duration-300"
              >
                Call 07908 625581
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-text-muted">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Text size="sm">5★ Average Rating</Text>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                <Text size="sm">1000+ Happy Customers</Text>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600" />
                <Text size="sm">SW9 Based & Trusted</Text>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </MainLayout>
  )
}