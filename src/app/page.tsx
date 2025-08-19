'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/primitives/Button'
import { Container, Section, GridLayout } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { FadeIn } from '@/components/ui/primitives/FadeIn'
import { Badge } from '@/components/ui/primitives/Badge'
import { Skeleton } from '@/components/ui/primitives/Skeleton'
import { Star, CheckCircle, Award, Car, Sparkles, Palette, Shield, Heart, Users, ChevronDown } from 'lucide-react'
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


      {/* Enhanced Services Section - Mobile-first spacing (48/64/80) */}
      <FadeIn as="section" id="services" className="relative z-10 flex flex-col py-12 sm:py-16 lg:py-20">
        <Container>
          {/* Section Header with proper spacing */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Heading size="h2" align="center" className="mb-6 text-3xl md:text-4xl lg:text-5xl">
              Our Services
            </Heading>
            <Text size="xl" color="secondary" align="center" className="max-w-2xl mx-auto text-lg md:text-xl">
              Professional car detailing services designed to keep your vehicle looking its absolute best
            </Text>
          </div>
          
          {/* Services Grid with breathing room */}
          <div className="flex-1 flex items-start justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {servicesLoading ? (
              <GridLayout columns={{ default: 1, sm: 2, md: 3 }} gap="lg" className="gap-4 sm:gap-6 lg:gap-8 w-full max-w-7xl">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="relative border-2 border-border-secondary min-h-[400px]">
                    <CardHeader className="p-4 sm:p-6 pb-6">
                      <Skeleton className="w-12 h-12 rounded-lg mb-6" />
                      <Skeleton className="h-6 mb-3" />
                      <Skeleton className="h-4" />
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pb-6">
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
              <GridLayout columns={{ default: 1, sm: 2, md: 3 }} gap="lg" className="gap-4 sm:gap-6 lg:gap-8 w-full max-w-7xl">
                {services.slice(0, 3).map((service) => {
                  const nameLower = service.name.toLowerCase()
                  const isPopular = nameLower.includes('full valet') || nameLower.includes('full')
                  // Map to booking card visual language
                  const Icon = nameLower.includes('exterior') ? Sparkles : nameLower.includes('interior') ? Palette : Shield

                  const hasPricing = Array.isArray(service.pricing) && service.pricing.length > 0
                  const prices = hasPricing ? service.pricing.map(p => p.price).filter(p => p !== null && p !== undefined) : []
                  const minPrice = prices.length ? Math.min(...prices) : 0
                  const maxPrice = prices.length ? Math.max(...prices) : 0
                  const durationMinutes = service.duration || 0
                  const durationHours = Math.max(1, Math.round(Math.max(0, durationMinutes) / 60))

                  return (
                    <Card
                      key={service.id}
                      className={cn(
                        'relative transition-all duration-300 border-2',
                        isPopular ? 'border-brand-500 bg-brand-600/5' : 'border-border-secondary hover:border-brand-400'
                      )}
                    >
                      {isPopular && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                          POPULAR
                        </div>
                      )}

                      <CardHeader className="text-center pb-2">
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-brand-600/10 text-brand-400">
                          <Icon className="w-6 h-6" />
                        </div>
                        <Heading size="h4" className="text-lg font-bold text-brand-300 mb-1">{service.name}</Heading>
                        <Text color="secondary" className="text-sm line-clamp-2">{service.description}</Text>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="text-center space-y-2">
                          {prices.length > 0 ? (
                            minPrice !== maxPrice ? (
                              <div className="text-brand-400 font-bold">
                                From £{minPrice} - £{maxPrice}
                              </div>
                            ) : (
                              <div className="text-brand-400 font-bold">£{minPrice}</div>
                            )
                          ) : (
                            <div className="text-text-secondary">Contact for pricing</div>
                          )}
                          <div className="text-xs text-text-muted">Based on vehicle size</div>
                          <div className="flex items-center justify-center gap-1 text-xs text-text-muted">
                            <Car className="w-3 h-3" />
                            <span>~{durationHours} hours</span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter>
                        <Link href={`/book?service=${service.id}`} className="w-full">
                          <Button variant="outline" fullWidth className="min-h-[48px]">
                            Select Service
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
      </FadeIn>

      {/* New Dashboard Preview Section - unified section spacing */}
      <FadeIn className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <DashboardPreview />
      </FadeIn>

      {/* How It Works Section - unified section spacing */}
      <FadeIn className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <HowItWorksSection />
      </FadeIn>

      {/* Combined Service Area + FAQ Section - unified section spacing */}
      <FadeIn className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <ServiceAreaAndFAQ />
      </FadeIn>

      {/* Final CTA Section - Mobile-first spacing (48/64/80) */}
      <FadeIn as="section" id="contact" className="relative z-10 py-12 sm:py-16 lg:py-20 border-t border-border-secondary/30">
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
      </FadeIn>
    </MainLayout>
  )
}