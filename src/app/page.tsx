'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives/Button';
import { Container, Section } from '@/components/layout/templates/PageLayout';
import { ArrowRight, Star, CheckCircle, Award, Car, Sparkles, Palette, Shield, Heart, Users, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card';
import { MainLayout } from '@/components/layouts/MainLayout';

export default function HomePage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <MainLayout>
      {/* Hero Section */}
      <Section background="default" padding="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-brand-800/5" />
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
                  Professional
                  <span className="text-brand-400 block">Mobile Car</span>
                  Detailing
                </h1>
                <p className="text-xl text-text-secondary leading-relaxed">
                  Premium mobile car detailing service that comes to you. Transform your vehicle with our professional-grade equipment and eco-friendly products.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book" className="flex-1 sm:flex-none">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    fullWidth
                  >
                    Book Your Service
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.location.href = 'tel:+447123456789'}
                  className="flex-1 sm:flex-none"
                >
                  Call 07123 456789
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-text-secondary font-medium">5.0 Rating</span>
                </div>
                <div className="h-6 w-px bg-border-secondary" />
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-400" />
                  <span className="text-text-secondary font-medium">Fully Insured</span>
                </div>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-600/20 to-brand-800/30 flex items-center justify-center">
                <Car className="w-32 h-32 text-brand-600/60" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-brand-600 text-white p-4 rounded-xl shadow-lg">
                <div className="text-2xl font-bold">£35+</div>
                <div className="text-sm opacity-90">Starting from</div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Services Section */}
      <div id="services">
        <Section background="muted" padding="xl">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Our Services
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Professional car detailing services designed to keep your vehicle looking its absolute best
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Essential Package */}
            <Card className="relative border-2 border-border-secondary hover:border-brand-400 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-600/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Essential Detail</h3>
                <p className="text-text-secondary">Perfect for regular maintenance and keeping your car looking fresh</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Exterior wash & dry
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Interior vacuum & wipe
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Wheel & tire cleaning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Basic window cleaning
                  </li>
                </ul>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-brand-400">£35</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/book" className="w-full">
                  <Button variant="outline" fullWidth>
                    Choose Essential
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Premium Package */}
            <Card className="relative border-2 border-brand-500 bg-brand-600/5 shadow-purple-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <CardHeader>
                <div className="w-12 h-12 bg-brand-600/10 rounded-lg flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Premium Detail</h3>
                <p className="text-text-secondary">Comprehensive cleaning inside and out for the discerning car owner</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Everything in Essential
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Clay bar treatment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Paint protection wax
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Interior deep clean
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    Tire shine & dressing
                  </li>
                </ul>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg text-text-muted line-through">£89</span>
                  <span className="text-2xl font-bold text-brand-400">£79</span>
                  <span className="text-xs bg-success-600 text-white px-2 py-1 rounded">SAVE £10</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/book" className="w-full">
                  <Button variant="primary" fullWidth>
                    Choose Premium
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Ultimate Package */}
            <Card className="relative border-2 border-border-secondary hover:border-brand-400 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-600/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Ultimate Detail</h3>
                <p className="text-text-secondary">The complete treatment for show-car results and long-lasting protection</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
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
                <Link href="/book" className="w-full">
                  <Button variant="outline" fullWidth>
                    Choose Ultimate
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </Container>
        </Section>
      </div>

      {/* About Section */}
      <div id="about">
        <Section background="default" padding="xl">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
                  Why Choose Love 4 Detailing?
                </h2>
                <p className="text-lg text-text-secondary leading-relaxed mb-8">
                  We're passionate about cars and dedicated to providing exceptional mobile detailing services. Our team brings professional-grade equipment and eco-friendly products directly to your location.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Passion for Excellence</h3>
                    <p className="text-text-secondary text-sm">Every car is treated with the same care and attention we'd give our own.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Trusted Service</h3>
                    <p className="text-text-secondary text-sm">Fully insured with 5-star ratings from hundreds of satisfied customers.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-600/20 to-brand-800/30 flex items-center justify-center">
                <Shield className="w-32 h-32 text-brand-600/60" />
              </div>
            </div>
          </div>
        </Container>
        </Section>
      </div>

      {/* Contact Section */}
      <div id="contact">
        <Section background="muted" padding="xl">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to Transform Your Car?</h2>
            <p className="text-xl text-text-secondary mb-8">Book your professional mobile detailing service today</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button variant="primary" size="lg">
                  Book Now
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={() => window.location.href = 'tel:+447123456789'}>
                Call 07123 456789
              </Button>
            </div>
          </div>
        </Container>
        </Section>
      </div>
    </MainLayout>
  );
}