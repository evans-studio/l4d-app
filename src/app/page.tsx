'use client';

import React from 'react';
import { Button } from '@/components/ui/primitives/Button';
import { ResponsiveLogo } from '@/components/ui/primitives/Logo';
import { Container, Section } from '@/components/layout/templates/PageLayout';
import { Phone, ArrowRight, Star, CheckCircle, Award, Car, Sparkles, Palette, Shield, Heart, Users, ChevronDown, LogIn, LogOut, User } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function HomePage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isAuthenticated, isLoading, profile, logout } = useAuth();

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-primary/95 backdrop-blur-sm border-b border-border-secondary">
        <Container>
          <div className="flex items-center justify-between py-4">
            <ResponsiveLogo href="/" />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-text-secondary hover:text-brand-400 transition-colors">Services</a>
              <a href="#about" className="text-text-secondary hover:text-brand-400 transition-colors">About</a>
              <a href="#contact" className="text-text-secondary hover:text-brand-400 transition-colors">Contact</a>
              <div className="flex items-center gap-4">
                <a href="tel:+447123456789" className="text-text-secondary hover:text-brand-400 transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
                
                {!isLoading && (
                  <>
                    {isAuthenticated ? (
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => window.location.href = '/dashboard'}
                          leftIcon={<User className="w-4 h-4" />}
                        >
                          {profile?.first_name ? `Hi, ${profile.first_name}` : 'Dashboard'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={logout}
                          leftIcon={<LogOut className="w-4 h-4" />}
                        >
                          Logout
                        </Button>
                        <Button variant="primary" onClick={() => window.location.href = '/book'}>Book Now</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          onClick={() => window.location.href = '/auth/login'}
                          leftIcon={<LogIn className="w-4 h-4" />}
                        >
                          Login
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => window.location.href = '/auth/register'}
                          leftIcon={<User className="w-4 h-4" />}
                        >
                          Sign Up
                        </Button>
                        <Button variant="primary" onClick={() => window.location.href = '/book'}>Book Now</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="text-brand-400">☰</span>
            </Button>
          </div>
        </Container>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-secondary border-b border-border-secondary">
          <Container>
            <div className="py-4 space-y-4">
              <a 
                href="#services" 
                className="block py-2 text-text-secondary hover:text-brand-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </a>
              <a 
                href="#about" 
                className="block py-2 text-text-secondary hover:text-brand-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#contact" 
                className="block py-2 text-text-secondary hover:text-brand-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <a 
                href="tel:+447123456789" 
                className="block py-2 text-text-secondary hover:text-brand-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                📞 Call: 07123 456789
              </a>
              
              <div className="pt-4 border-t border-border-secondary space-y-3">
                {!isLoading && (
                  <>
                    {isAuthenticated ? (
                      <>
                        <Button 
                          variant="outline" 
                          fullWidth
                          onClick={() => {
                            window.location.href = '/dashboard'
                            setMobileMenuOpen(false)
                          }}
                          leftIcon={<User className="w-4 h-4" />}
                        >
                          {profile?.first_name ? `Hi, ${profile.first_name}` : 'Dashboard'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          fullWidth
                          onClick={() => {
                            logout()
                            setMobileMenuOpen(false)
                          }}
                          leftIcon={<LogOut className="w-4 h-4" />}
                        >
                          Logout
                        </Button>
                        <Button 
                          variant="primary" 
                          fullWidth
                          onClick={() => {
                            window.location.href = '/book'
                            setMobileMenuOpen(false)
                          }}
                        >
                          Book Now
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          fullWidth
                          onClick={() => {
                            window.location.href = '/auth/login'
                            setMobileMenuOpen(false)
                          }}
                          leftIcon={<LogIn className="w-4 h-4" />}
                        >
                          Login
                        </Button>
                        <Button 
                          variant="ghost" 
                          fullWidth
                          onClick={() => {
                            window.location.href = '/auth/register'
                            setMobileMenuOpen(false)
                          }}
                          leftIcon={<User className="w-4 h-4" />}
                        >
                          Sign Up
                        </Button>
                        <Button 
                          variant="primary" 
                          fullWidth
                          onClick={() => {
                            window.location.href = '/book'
                            setMobileMenuOpen(false)
                          }}
                        >
                          Book Now
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* Hero Section */}
      <Section background="default" padding="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-brand-800/5" />
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 rounded-full px-4 py-2 text-sm font-medium text-brand-300">
                  <Award className="w-4 h-4" />
                  Professional Mobile Car Detailing
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="text-text-primary">Premium Car Care</span>
                  <br />
                  <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                    At Your Location
                  </span>
                </h1>
                <p className="text-xl text-text-secondary leading-relaxed">
                  Professional mobile car detailing service bringing showroom-quality results directly to your doorstep. 
                  Expert ceramic coating, paint correction, and complete interior & exterior detailing.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="primary" 
                  size="xl" 
                  onClick={() => window.location.href = '/book'}
                  className="animate-purple-pulse"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Book Your Detail Now
                </Button>
                <Button 
                  variant="outline" 
                  size="xl"
                  onClick={() => window.location.href = 'tel:+447123456789'}
                  leftIcon={<Phone className="w-5 h-5" />}
                >
                  Call: 07123 456789
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-brand-400 text-brand-400" />
                    ))}
                  </div>
                  <span className="text-text-secondary">4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-400" />
                  <span className="text-text-secondary">500+ Happy Customers</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-600/20 to-brand-800/30 p-8 border border-brand-500/20 shadow-purple-xl">
                <div className="w-full h-full bg-gray-700 rounded-xl flex items-center justify-center">
                  <Car className="w-24 h-24 text-brand-400" />
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-success-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                Mobile Service
              </div>
              <div className="absolute -bottom-4 -left-4 bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                Same Day Available
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Services Section */}
      <div id="services">
        <Section background="default" padding="xl">
          <Container>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
                Our Services
              </h2>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                Professional mobile car detailing with transparent pricing and guaranteed results.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Exterior Detailing */}
              <Card variant="service" className="group hover:shadow-purple-xl transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-brand-600/10 to-brand-800/20 rounded-t-lg -m-6 mb-6 flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-brand-400" />
                </div>
                <CardHeader>
                  <h3 className="text-xl font-bold text-brand-300">Exterior Detail</h3>
                  <p className="text-text-secondary">Complete wash, wax & protection</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-text-secondary mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      Hand wash & foam treatment
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      Paint correction & polishing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      Wheel & tire detailing
                    </li>
                  </ul>
                  <div className="text-2xl font-bold text-brand-400">£89</div>
                </CardContent>
                <CardFooter>
                  <Button variant="primary" fullWidth onClick={() => window.location.href = '/book?service=exterior'}>
                    Book Now
                  </Button>
                </CardFooter>
              </Card>

              {/* Interior Detailing */}
              <Card variant="service" className="group hover:shadow-purple-xl transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-brand-600/10 to-brand-800/20 rounded-t-lg -m-6 mb-6 flex items-center justify-center">
                  <Palette className="w-16 h-16 text-brand-400" />
                </div>
                <CardHeader>
                  <h3 className="text-xl font-bold text-brand-300">Interior Detail</h3>
                  <p className="text-text-secondary">Deep clean & protection</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-text-secondary mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      Deep vacuum & steam clean
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      Leather conditioning
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      Fabric protection
                    </li>
                  </ul>
                  <div className="text-2xl font-bold text-brand-400">£79</div>
                </CardContent>
                <CardFooter>
                  <Button variant="primary" fullWidth onClick={() => window.location.href = '/book?service=interior'}>
                    Book Now
                  </Button>
                </CardFooter>
              </Card>

              {/* Full Service - Most Popular */}
              <Card variant="service" className="group hover:shadow-purple-xl transition-all duration-300 border-brand-500/50 bg-gradient-to-br from-brand-600/5 to-brand-800/10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  MOST POPULAR
                </div>
                <div className="aspect-video bg-gradient-to-br from-brand-600/20 to-brand-800/30 rounded-t-lg -m-6 mb-6 flex items-center justify-center">
                  <Shield className="w-16 h-16 text-brand-400" />
                </div>
                <CardHeader>
                  <h3 className="text-xl font-bold text-brand-300">Full Service</h3>
                  <p className="text-text-secondary">Complete interior & exterior</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-text-secondary mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      Everything included above
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      6-month ceramic coating
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      Before/after photos
                    </li>
                  </ul>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg text-text-muted line-through">£168</span>
                    <span className="text-2xl font-bold text-brand-400">£149</span>
                    <span className="text-xs bg-success-600 text-white px-2 py-1 rounded">SAVE £19</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="primary" fullWidth onClick={() => window.location.href = '/book?service=full'} className="animate-purple-pulse">
                    Book Now
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </Container>
        </Section>
      </div>

      {/* About Section */}
      <div id="about">
        <Section background="muted" padding="xl">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-6">
                  Why Choose Love4Detailing?
                </h2>
                <p className="text-xl text-text-secondary mb-8">
                  We bring professional-grade car detailing directly to your location. Our mobile service 
                  saves you time while delivering exceptional results that exceed your expectations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-brand-600/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">Mobile Convenience</h3>
                      <p className="text-sm text-text-secondary">We come to you - home, office, or anywhere convenient</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-brand-600/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">Professional Grade</h3>
                      <p className="text-sm text-text-secondary">Commercial equipment and premium products</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-brand-600/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">Fully Insured</h3>
                      <p className="text-sm text-text-secondary">Complete peace of mind with full coverage</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-brand-600/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">Passion Driven</h3>
                      <p className="text-sm text-text-secondary">We love cars and it shows in our work</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-brand-600/10 to-brand-800/20 border border-brand-500/20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Users className="w-16 h-16 text-brand-400 mx-auto" />
                    <div>
                      <div className="text-3xl font-bold text-brand-400">500+</div>
                      <div className="text-text-secondary">Happy Customers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      </div>

      {/* FAQ Section */}
      <div id="faq">
        <Section background="muted" padding="xl">
          <Container>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                Everything you need to know about our mobile car detailing service.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  question: "How long does a full service take?",
                  answer: "A full service typically takes 4-5 hours depending on your vehicle's condition. We'll provide an accurate time estimate during booking based on your specific requirements."
                },
                {
                  question: "Do I need to provide water and electricity?",
                  answer: "No! We're completely self-sufficient. Our mobile unit carries its own water supply, generator, and all professional equipment needed for a complete detail."
                },
                {
                  question: "What areas do you cover?",
                  answer: "We serve Birmingham and surrounding areas within a 17.5 mile radius of SW9. This includes Solihull, Coventry, Warwick, and most of the West Midlands."
                },
                {
                  question: "How do I book an appointment?",
                  answer: "You can book online through our website, call us directly at 07123 456789, or send us a message. We offer same-day bookings subject to availability."
                },
                {
                  question: "Are you insured?",
                  answer: "Yes, we carry full public liability and professional indemnity insurance. Your vehicle and property are completely protected during our service."
                },
                {
                  question: "What if I'm not satisfied?",
                  answer: "Your satisfaction is guaranteed. If you're not 100% happy with our work, we'll return to make it right at no additional cost."
                }
              ].map((faq, index) => (
                <Card key={index} variant="default" className="overflow-hidden">
                  <button
                    className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-text-primary">{faq.question}</h3>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-brand-400 transition-transform duration-200",
                        openFaq === index && "transform rotate-180"
                      )} />
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-surface-secondary border-t border-border-secondary">
        <Container>
          <div className="py-6 border-t border-border-secondary text-center text-text-muted">
            <p>&copy; 2024 Love4Detailing. All rights reserved. Professional mobile car detailing service.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}