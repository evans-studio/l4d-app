'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Container } from '@/components/layout/templates/PageLayout'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { 
  MapPin, 
  Search, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Map,
  Clock,
  Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock postcode validation - in real app this would call an API
const validatePostcode = (postcode: string): Promise<{
  valid: boolean
  covered: boolean
  distance?: number
  location?: string
  surcharge?: number
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
      
      // Mock validation logic
      const validFormat = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i.test(postcode)
      
      if (!validFormat) {
        resolve({ valid: false, covered: false })
        return
      }

      // Mock coverage based on postcode prefix - SW9 and surrounding London areas
      const coreAreas = ['SW9'] // Core service area
      const nearbyAreas = ['SW8', 'SW10', 'SW11', 'SW12', 'SW2', 'SW4', 'SE5', 'SE21', 'SE24', 'SE27']
      const extendedAreas = ['SW1', 'SW3', 'SW5', 'SW6', 'SW7', 'SW13', 'SW14', 'SW15', 'SE1', 'SE11', 'SE17', 'SE22']
      
      const prefix = cleanPostcode.substring(0, 3)
      const shortPrefix = cleanPostcode.substring(0, 2)
      
      let result = { valid: true, covered: false, distance: 0, location: '', surcharge: 0 }
      
      if (coreAreas.some(area => cleanPostcode.startsWith(area))) {
        result = {
          valid: true,
          covered: true,
          distance: Math.floor(Math.random() * 3) + 1, // 1-3 miles
          location: 'SW9 Core Area',
          surcharge: 0
        }
      } else if (nearbyAreas.some(area => cleanPostcode.startsWith(area))) {
        const distance = Math.floor(Math.random() * 8) + 4 // 4-12 miles
        result = {
          valid: true,
          covered: true,
          distance,
          location: 'South London',
          surcharge: distance > 5 ? Math.ceil((distance - 5) * 0.5) : 0
        }
      } else if (extendedAreas.some(area => cleanPostcode.startsWith(area))) {
        const distance = Math.floor(Math.random() * 10) + 12 // 12-22 miles
        result = {
          valid: true,
          covered: true,
          distance,
          location: 'Greater London',
          surcharge: Math.ceil((distance - 5) * 0.5)
        }
      } else {
        result = {
          valid: true,
          covered: false,
          distance: Math.floor(Math.random() * 20) + 25, // 25+ miles
          location: 'Outside Service Area',
          surcharge: 0
        }
      }
      
      resolve(result)
    }, 1000) // Simulate API delay
  })
}

export function ServiceAreaCheck() {
  const [postcode, setPostcode] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<{
    valid: boolean
    covered: boolean
    distance?: number
    location?: string
    surcharge?: number
  } | null>(null)
  const [showResult, setShowResult] = useState(false)
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

  const handleCheck = async () => {
    if (!postcode.trim()) return
    
    setIsChecking(true)
    setShowResult(false)
    
    try {
      const validationResult = await validatePostcode(postcode)
      setResult(validationResult)
      setShowResult(true)
    } catch (error) {
      console.error('Postcode validation error:', error)
      setResult({ valid: false, covered: false })
      setShowResult(true)
    } finally {
      setIsChecking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheck()
    }
  }

  const resetCheck = () => {
    setPostcode('')
    setResult(null)
    setShowResult(false)
  }

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden py-12 lg:py-16"
    >
      
      <Container>
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className={cn(
            "text-center mb-12",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700"
          )}>
            <div className="inline-flex items-center gap-3 bg-brand-600/10 rounded-full px-6 py-3 mb-6">
              <MapPin className="w-5 h-5 text-brand-600" />
              <span className="text-brand-600 font-medium">Service Area Checker</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Do We Service Your Area?
            </h2>
            <p className="text-xl text-text-secondary leading-relaxed">
              Enter your postcode to check if we service your area. 
              We're based in SW9 and serve South London and surrounding areas.
            </p>
          </div>

          {/* Main Card */}
          <Card className={cn(
            "border-border-secondary shadow-lg",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700 delay-200"
          )}>
            <CardContent className="p-4 sm:p-8">
              
              {!showResult ? (
                // Input State - Inline Layout
                <div className="max-w-lg mx-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Enter postcode (SW9 1AA)"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-border-secondary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all duration-200 text-base touch-manipulation"
                        disabled={isChecking}
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleCheck}
                      disabled={!postcode.trim() || isChecking}
                      className="bg-brand-600 hover:bg-brand-700 py-4 px-6 whitespace-nowrap touch-manipulation"
                      rightIcon={
                        isChecking ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )
                      }
                    >
                      {isChecking ? 'Checking...' : 'Check'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Result State
                <div className="space-y-6">
                  
                  {result?.valid ? (
                    result.covered ? (
                      // Covered Area
                      <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-success-600/20 rounded-full">
                          <CheckCircle className="w-10 h-10 text-success-600" />
                        </div>
                        
                        <div>
                          <h3 className="text-2xl font-bold text-success-600 mb-2">
                            Great News! We Service Your Area
                          </h3>
                          <p className="text-text-secondary text-lg">
                            {postcode} is within our service area
                          </p>
                        </div>

                        {/* Service Details - Mobile Optimized */}
                        <div className="bg-surface-secondary rounded-lg p-4 sm:p-6 space-y-4">
                          {/* Mobile: Stack vertically, Desktop: 3 columns */}
                          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
                            <div className="flex items-center gap-4 sm:flex-col sm:text-center p-3 sm:p-0 bg-surface-primary/50 sm:bg-transparent rounded-lg sm:rounded-none">
                              <div className="flex-shrink-0">
                                <MapPin className="w-6 h-6 text-brand-600" />
                              </div>
                              <div className="flex-1 sm:flex-initial">
                                <div className="text-sm text-text-secondary mb-1">Distance</div>
                                <div className="font-semibold text-text-primary text-lg">{result.distance} miles</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 sm:flex-col sm:text-center p-3 sm:p-0 bg-surface-primary/50 sm:bg-transparent rounded-lg sm:rounded-none">
                              <div className="flex-shrink-0">
                                <Clock className="w-6 h-6 text-brand-600" />
                              </div>
                              <div className="flex-1 sm:flex-initial">
                                <div className="text-sm text-text-secondary mb-1">Location</div>
                                <div className="font-semibold text-text-primary text-lg">{result.location}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 sm:flex-col sm:text-center p-3 sm:p-0 bg-surface-primary/50 sm:bg-transparent rounded-lg sm:rounded-none">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 flex items-center justify-center">
                                  {result.surcharge ? '💷' : '✅'}
                                </div>
                              </div>
                              <div className="flex-1 sm:flex-initial">
                                <div className="text-sm text-text-secondary mb-1">Travel Charge</div>
                                <div className="font-semibold text-text-primary text-lg">
                                  {result.surcharge ? `£${result.surcharge}` : 'FREE'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {result.surcharge && result.surcharge > 0 && (
                            <div className="text-center text-sm text-text-muted pt-3 border-t border-border-secondary">
                              £0.50 per mile beyond our 5-mile free radius from SW9
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center max-w-md sm:max-w-none mx-auto">
                          <Link href="/book" className="w-full sm:w-auto">
                            <Button
                              variant="primary"
                              size="lg"
                              className="w-full bg-brand-600 hover:bg-brand-700 min-h-[56px] touch-manipulation"
                              rightIcon={<ArrowRight className="w-5 h-5" />}
                            >
                              Book Your Service
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={resetCheck}
                            className="w-full sm:w-auto hover:border-brand-400 hover:text-brand-400 min-h-[56px] touch-manipulation"
                          >
                            Check Another Postcode
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Not Covered
                      <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-error-600/20 rounded-full">
                          <XCircle className="w-10 h-10 text-error-600" />
                        </div>
                        
                        <div>
                          <h3 className="text-2xl font-bold text-error-600 mb-2">
                            Currently Outside Our Service Area
                          </h3>
                          <p className="text-text-secondary text-lg">
                            {postcode} is approximately {result.distance} miles from our base
                          </p>
                        </div>

                        <div className="bg-surface-secondary rounded-lg p-6">
                          <div className="flex items-center gap-3 justify-center mb-4">
                            <Bell className="w-5 h-5 text-brand-600" />
                            <h4 className="font-semibold text-text-primary">Join Our Expansion List</h4>
                          </div>
                          <p className="text-text-secondary text-center mb-4">
                            We're constantly expanding our service area. Get notified when we start serving your location.
                          </p>
                          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 sm:justify-center max-w-md sm:max-w-none mx-auto">
                            <Button
                              variant="primary"
                              size="lg"
                              onClick={() => window.location.href = `mailto:expansion@love4detailing.com?subject=Service Area Request - ${postcode}`}
                              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 min-h-[56px] touch-manipulation"
                            >
                              Request Service Area
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={resetCheck}
                              className="w-full sm:w-auto hover:border-brand-400 hover:text-brand-400 min-h-[56px] touch-manipulation"
                            >
                              Try Another Postcode
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    // Invalid Postcode
                    <div className="text-center space-y-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-warning-600/20 rounded-full">
                        <XCircle className="w-10 h-10 text-warning-600" />
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold text-warning-600 mb-2">
                          Invalid Postcode
                        </h3>
                        <p className="text-text-secondary text-lg">
                          Please check your postcode and try again
                        </p>
                      </div>

                      <div className="max-w-md mx-auto">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={resetCheck}
                          className="w-full bg-brand-600 hover:bg-brand-700 min-h-[56px] touch-manipulation"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Info Line */}
          <div className={cn(
            "text-center mt-8",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700 delay-400"
          )}>
            <Text color="secondary" className="text-lg">
              Based in SW9 · 5 miles free · Covering South London
            </Text>
          </div>
        </div>
      </Container>
    </section>
  )
}