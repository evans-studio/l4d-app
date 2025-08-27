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
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { calculateDistance as calculateDistanceKm } from '@/lib/services/distance'
import { logger } from '@/lib/utils/logger'

// Real postcode validation using postcodes.io (via our distance service)
const FREE_RADIUS_MILES = 17.5
const BUSINESS_POSTCODE = 'SW9'

const validatePostcode = async (postcode: string): Promise<{
  valid: boolean
  covered: boolean
  distance?: number
  location?: string
  surcharge?: number
}> => {
  const clean = postcode.trim().toUpperCase()
  const validFormat = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i.test(clean)
  if (!validFormat) return { valid: false, covered: false }

  // Calculate haversine/driving distance using our service (falls back to haversine with postcodes.io)
  const res = await calculateDistanceKm(BUSINESS_POSTCODE, clean)
  if (!res.success || res.distance <= 0) {
    return { valid: true, covered: false, distance: 0, location: 'Unknown', surcharge: 0 }
  }
  const distanceMiles = Math.round((res.distance * 0.621371) * 10) / 10
  const covered = distanceMiles <= FREE_RADIUS_MILES
  const surcharge = covered ? 0 : Math.max(0, Math.ceil((distanceMiles - FREE_RADIUS_MILES) * 0.5))
  return { valid: true, covered, distance: distanceMiles, location: 'From SW9', surcharge }
}

const faqs = [
  {
    id: 'booking',
    question: 'How far in advance should I book?',
    answer: 'We recommend booking 2-3 days in advance to secure your preferred time slot. Same-day availability is often possible - just call or check our online booking system.'
  },
  {
    id: 'utilities',
    question: 'Do you bring water and power?',
    answer: 'Yes, we bring our own water supply and power equipment. We just need access to your location and a safe parking spot for our mobile detailing unit.'
  },
  {
    id: 'payment',
    question: 'How does payment work?',
    answer: 'Payment is required upfront via secure PayPal link sent after booking confirmation. We accept all major payment methods through PayPal, with no additional fees.'
  }
]

export function ServiceAreaAndFAQ() {
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
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
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
      logger.error('Postcode validation error:', error)
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

  const toggleFAQ = (faqId: string) => {
    setOpenFAQ(openFAQ === faqId ? null : faqId)
  }

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden py-20 lg:py-28"
      data-ui={isNewUIEnabled() ? 'new' : 'old'}
    >
      <Container>
        <div className="max-w-4xl mx-auto">
          
          {/* Combined Section Header */}
          <div className={cn(
            "text-center mb-16 lg:mb-20",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700"
          )}>
            <Heading size="h2" align="center" className="mb-6 text-3xl md:text-4xl lg:text-5xl">
              Service Area & FAQ
            </Heading>
            <Text size="xl" color="secondary" align="center" className="max-w-2xl mx-auto text-lg md:text-xl">
              Check if we service your area and get answers to common questions
            </Text>
          </div>

          {/* Service Area Checker - Compact Version */}
          <Card className={cn(
            "border-border-secondary shadow-lg mb-16 lg:mb-20",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "transition-all duration-700 delay-200"
          )}>
            <CardContent className="p-6 lg:p-8">
              <div className="text-center mb-8">
                <Heading size="h3" align="center" className="mb-2">
                  Check Your Postcode
                </Heading>
                <Text color="secondary" align="center" className="text-sm">
                  SW9 base · 17.5 miles free radius · South London coverage
                </Text>
              </div>
              
              {!showResult ? (
                // Compact Input Layout
                <div className="max-w-md mx-auto">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Enter postcode"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-border-secondary rounded-lg text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all duration-200"
                        disabled={isChecking}
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleCheck}
                      disabled={!postcode.trim() || isChecking}
                      className="bg-brand-600 hover:bg-brand-700 py-3 px-6 min-h-[48px]"
                    >
                      {isChecking ? 'Checking…' : 'Check'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Compact Result Layout
                <div className="text-center space-y-6">
                  {result?.valid && result.covered && (
                    <div>
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-success-600/15 rounded-full mb-3">
                        <CheckCircle className="w-6 h-6 text-success-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-success-700 mb-1">
                        You're Covered
                      </h3>
                      <p className="text-text-secondary text-sm mb-5">
                        {postcode} · {result.distance} miles · {result.surcharge ? `£${result.surcharge} travel` : 'Free travel'}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Link href="/book">
                          <Button variant="primary" className="bg-brand-600 hover:bg-brand-700">
                            Book Now
                          </Button>
                        </Link>
                        <Button variant="outline" onClick={resetCheck}>
                          Check Another
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {result?.valid && !result.covered && (
                    <div>
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-error-600/15 rounded-full mb-3">
                        <XCircle className="w-6 h-6 text-error-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-error-700 mb-1">
                        Outside Service Area
                      </h3>
                      <p className="text-text-secondary text-sm mb-5">
                        {postcode} is approximately {typeof result.distance === 'number' ? result.distance : '—'} miles from our base
                      </p>
                      <Button variant="outline" onClick={resetCheck}>
                        Try Another Postcode
                      </Button>
                    </div>
                  )}
                  
                  {!result?.valid && (
                    <div>
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-warning-600/15 rounded-full mb-3">
                        <XCircle className="w-6 h-6 text-warning-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-warning-700 mb-1">
                        Invalid Postcode
                      </h3>
                      <p className="text-text-secondary text-sm mb-5">
                        Please check your postcode and try again
                      </p>
                      <Button variant="primary" onClick={resetCheck}>
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact FAQ Section */}
          <div>
            <div className="text-center mb-12">
              <Heading size="h3" align="center" className="mb-4">
                Common Questions
              </Heading>
              <Text color="secondary" align="center">
                Quick answers about our mobile detailing service
              </Text>
            </div>
            
            {/* FAQ List with Proper Spacing */}
            <div className="max-w-2xl mx-auto space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFAQ === faq.id
                return (
                  <div
                    key={faq.id}
                    className={cn(
                      "border border-border-secondary rounded-lg overflow-hidden",
                      isOpen && "border-brand-400",
                      inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                      "transition-all duration-500"
                    )}
                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                  >
                    {/* Question Button with 20-30px padding */}
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-hover transition-colors duration-200"
                    >
                      <Text size="lg" weight="semibold" className="pr-4">
                        {faq.question}
                      </Text>
                      <ChevronDown 
                        className={cn(
                          "w-5 h-5 text-brand-600 transition-transform duration-300 flex-shrink-0",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {/* Answer with Proper Spacing */}
                    <div className={cn(
                      "overflow-hidden transition-all duration-300",
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="p-6 pt-0 border-t border-border-secondary">
                        <Text color="secondary" leading="relaxed">
                          {faq.answer}
                        </Text>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}