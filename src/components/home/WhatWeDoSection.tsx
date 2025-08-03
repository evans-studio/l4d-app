'use client'

import { useEffect, useRef, useState } from 'react'
import { Container, GridLayout } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { Badge } from '@/components/ui/primitives/Badge'
import { 
  Car, 
  MapPin, 
  Shield, 
  Leaf, 
  Award, 
  Calendar,
  ArrowRight,
  Clock,
  Star,
  CheckCircle,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const benefits = [
  {
    icon: Car,
    title: 'Mobile Service',
    subtitle: 'We Come to You',
    description: 'Professional mobile car detailing at your home, office, or preferred location across SW9 and surrounding South London areas.',
    features: ['Home & Office Service', 'Equipment Provided', 'Flexible Scheduling'],
    badge: 'Most Popular',
    isPopular: true
  },
  {
    icon: Shield,
    title: 'Professional & Insured',
    subtitle: 'Licensed & Certified',
    description: 'Fully insured with commercial-grade equipment and certified detailing professionals you can trust for exceptional results.',
    features: ['Public Liability Insurance', 'Certified Professionals', 'Commercial Equipment'],
    badge: 'Trusted',
    isPopular: false
  },
  {
    icon: MapPin,
    title: 'Wide Coverage Area',
    subtitle: 'SW9 & Beyond',
    description: 'Serving SW9 and up to 17.5 miles radius including Clapham, Battersea, Wandsworth, and surrounding areas.',
    features: ['17.5 Mile Radius', 'SW9 Core Area', 'South London Coverage'],
    badge: 'Extended',
    isPopular: false
  }
]

interface BenefitCardProps {
  benefit: typeof benefits[0]
  index: number
  inView: boolean
}

function BenefitCard({ benefit, index, inView }: BenefitCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = benefit.icon

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border-2 transition-all duration-500 h-full",
        "hover:shadow-2xl hover:shadow-brand-500/20",
        benefit.isPopular 
          ? "bg-gradient-to-br from-brand-600/10 to-brand-500/20 border-brand-400/50 shadow-lg shadow-brand-500/10" 
          : "bg-gradient-to-br from-gray-800/50 to-gray-700/30 border-border-secondary hover:border-brand-400/30",
        inView 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8",
        isHovered && "scale-[1.02] -translate-y-1"
      )}
      style={{
        transitionDelay: `${index * 150}ms`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background decoration */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transform translate-x-16 -translate-y-16",
        benefit.isPopular 
          ? "bg-gradient-to-br from-brand-400/20 to-transparent" 
          : "bg-gradient-to-br from-white/5 to-transparent"
      )} />
      
      {/* Badge */}
      <div className="absolute top-4 right-4">
        <Badge 
          variant={benefit.isPopular ? "primary" : "secondary"}
          size="sm" 
          className={cn(
            "backdrop-blur-sm transition-all duration-300",
            benefit.isPopular 
              ? "bg-brand-600 hover:bg-brand-700 text-white" 
              : "bg-gray-700/80 hover:bg-gray-600 text-gray-200"
          )}
        >
          {benefit.badge}
        </Badge>
      </div>

      <CardContent className="p-8 flex flex-col h-full justify-between">
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto transition-all duration-300",
          "backdrop-blur-sm border transition-all duration-300",
          "group-hover:scale-110 group-hover:rotate-2",
          benefit.isPopular 
            ? "bg-gradient-to-br from-brand-500/20 to-brand-600/30 border-brand-400/30" 
            : "bg-gradient-to-br from-white/10 to-white/5 border-white/10"
        )}>
          <Icon className={cn(
            "w-8 h-8 transition-colors duration-300",
            benefit.isPopular ? "text-brand-400" : "text-gray-300"
          )} />
        </div>

        {/* Content */}
        <div className="text-center space-y-4 flex-grow">
          <div>
            <Text size="sm" color="accent" weight="medium" className="uppercase tracking-wider mb-2">
              {benefit.subtitle}
            </Text>
            <Heading size="h4" weight="bold" className="mb-3">
              {benefit.title}
            </Heading>
          </div>

          <Text color="secondary" leading="relaxed" className="mb-6">
            {benefit.description}
          </Text>
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-6">
          {benefit.features.map((feature, featureIndex) => (
            <div 
              key={feature}
              className={cn(
                "flex items-center gap-3 transition-all duration-300",
                inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              )}
              style={{
                transitionDelay: `${(index * 150) + (featureIndex * 100) + 300}ms`
              }}
            >
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                benefit.isPopular ? "bg-brand-400" : "bg-gray-400"
              )} />
              <Text size="sm" color="secondary" weight="medium">
                {feature}
              </Text>
            </div>
          ))}
        </div>

        {/* Hover indicator - only show on non-touch devices */}
        <div className={cn(
          "hidden md:flex items-center justify-center gap-2 text-gray-400 transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          <Sparkles className="w-4 h-4" />
          <Text size="xs" weight="medium" color="muted">Interactive</Text>
        </div>
      </CardContent>
    </Card>
  )
}

export function WhatWeDoSection() {
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
      id="what-we-do"
      ref={sectionRef}
      className="relative overflow-hidden py-16 lg:py-24 z-10"
    >
      
      <Container>
        {/* Section Header */}
        <div className={cn(
          "text-center mb-16 max-w-4xl mx-auto",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          "transition-all duration-700"
        )}>
          {/* Badge */}
          <div className="inline-flex items-center gap-3 bg-brand-600/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-brand-400/20">
            <Star className="w-5 h-5 text-brand-400" />
            <Text color="accent" weight="medium" className="tracking-wide">
              Why Choose Love 4 Detailing
            </Text>
          </div>

          <Heading size="h2" align="center" className="mb-6 bg-gradient-to-r from-text-primary to-brand-400 bg-clip-text">
            What We Do
          </Heading>
          
          <Text size="xl" color="secondary" leading="relaxed" align="center">
            Professional mobile car detailing serving SW9 and surrounding South London areas. 
            Here's why customers across Clapham, Brixton, and beyond choose Love 4 Detailing.
          </Text>
        </div>

        {/* Benefits Grid */}
        <GridLayout columns={{ default: 1, md: 2, lg: 3 }} gap="lg" className="items-stretch">
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={benefit.title}
              benefit={benefit}
              index={index}
              inView={inView}
            />
          ))}
        </GridLayout>

      </Container>
    </section>
  )
}