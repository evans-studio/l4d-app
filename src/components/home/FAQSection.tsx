'use client'

import { useState, useEffect, useRef } from 'react'
import { Container } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    id: 'booking',
    question: 'How far in advance should I book?',
    answer: 'We recommend booking 2-3 days in advance to secure your preferred time slot. Same-day availability is often possible - just call or check our online booking system.'
  },
  {
    id: 'areas',
    question: 'What areas do you cover?',
    answer: 'We cover SW9 and surrounding South London areas up to 17.5 miles radius, including Clapham, Battersea, Wandsworth, Brixton, and surrounding areas.'
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

export function FAQSection() {
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

  const toggleFAQ = (faqId: string) => {
    setOpenFAQ(openFAQ === faqId ? null : faqId)
  }

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden py-16 lg:py-24"
    >
      
      <Container>
        {/* Section Header */}
        <div className={cn(
          "text-center mb-12 max-w-3xl mx-auto",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          "transition-all duration-700"
        )}>
          <Heading size="h2" align="center" className="mb-6">
            Frequently Asked Questions
          </Heading>
          <Text size="xl" color="secondary" leading="relaxed" align="center">
            Quick answers to common questions about our mobile car detailing services in SW9 and South London.
          </Text>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-4">
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
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-hover transition-colors duration-200"
                >
                  <Heading size="h4" weight="semibold" className="pr-4">
                    {faq.question}
                  </Heading>
                  <ChevronDown 
                    className={cn(
                      "w-5 h-5 text-brand-600 transition-transform duration-300 flex-shrink-0",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Answer */}
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
      </Container>
    </section>
  )
}