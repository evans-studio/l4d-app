'use client';

import React from 'react';
import { ButtonDemo } from '@/components/ui/primitives/Button';
import { InputDemo } from '@/components/ui/primitives/Input';
import { LogoDemo } from '@/components/ui/primitives/Logo';
import { SkeletonDemo } from '@/components/ui/primitives/Skeleton';
import { BadgeDemo } from '@/components/ui/primitives/Badge';
import { CardDemo } from '@/components/ui/composites/Card';
import { ToastDemo, ToastProvider } from '@/components/ui/composites/Toast';
import { TableDemo } from '@/components/ui/composites/Table';
import { FormDemo } from '@/components/ui/composites/Form';
import { Container, Section } from '@/components/layout/templates/PageLayout';

export default function BrandShowcasePage() {
  const [activeSection, setActiveSection] = React.useState<string>('overview');

  const sections = [
    { id: 'overview', name: 'Brand Overview', component: <BrandOverview /> },
    { id: 'logo', name: 'Logo System', component: <LogoDemo /> },
    { id: 'buttons', name: 'Buttons', component: <ButtonDemo /> },
    { id: 'forms', name: 'Forms', component: <InputDemo /> },
    { id: 'cards', name: 'Cards', component: <CardDemo /> },
    { id: 'components', name: 'Other Components', component: <OtherComponents /> },
    { id: 'booking', name: 'Booking Flow', component: <BookingFlow /> },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-primary">
        {/* Header */}
        <Section background="muted" padding="md">
          <Container>
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">L4D</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                    Love4Detailing
                  </h1>
                  <p className="text-brand-300 font-medium">Brand Identity System</p>
                </div>
              </div>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Purple-enhanced UI components with strong brand identity for professional car detailing services
              </p>
            </div>
          </Container>
        </Section>

        {/* Navigation */}
        <Section background="default" padding="sm">
          <Container>
            <nav className="flex justify-center">
              <div className="flex flex-wrap gap-1 bg-surface-card p-1 rounded-lg border border-border-secondary">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      activeSection === section.id
                        ? 'bg-brand-600 text-white shadow-purple'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    {section.name}
                  </button>
                ))}
              </div>
            </nav>
          </Container>
        </Section>

        {/* Content */}
        <Section background="default" padding="lg">
          <Container size="full">
            {sections.find(section => section.id === activeSection)?.component}
          </Container>
        </Section>
      </div>
    </ToastProvider>
  );
}

const BrandOverview: React.FC = () => (
  <div className="space-y-8">
    <div className="text-center space-y-4 mb-12">
      <h2 className="text-3xl font-bold text-text-primary">Love4Detailing Brand System</h2>
      <p className="text-text-secondary max-w-2xl mx-auto">
        A comprehensive purple-enhanced design system built on your confirmed brand identity
      </p>
    </div>

    {/* Brand Colors */}
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-text-primary">Brand Purple System</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { name: 'brand-300', value: '#d7c1ff', desc: 'Light accent' },
          { name: 'brand-400', value: '#c299ff', desc: 'Text accent' },
          { name: 'brand-500', value: '#a966ff', desc: 'Interactive' },
          { name: 'brand-600', value: '#9747ff', desc: 'Primary brand' },
          { name: 'brand-700', value: '#8a3af7', desc: 'Hover state' },
          { name: 'brand-800', value: '#7a2ee6', desc: 'Dark variant' },
          { name: 'brand-900', value: '#6525c4', desc: 'Deep purple' },
        ].map((color) => (
          <div key={color.name} className="space-y-2">
            <div 
              className="h-20 rounded-lg border border-border-secondary shadow-sm"
              style={{ backgroundColor: color.value }}
            />
            <div className="text-center">
              <p className="text-sm font-mono text-text-primary">{color.name}</p>
              <p className="text-xs text-text-muted">{color.value}</p>
              <p className="text-xs text-text-secondary">{color.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Surface Colors with Purple Hints */}
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-text-primary">Dark Theme with Purple Hints</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { name: 'surface-primary', value: '#0a0a0a', desc: 'Main background' },
          { name: 'surface-secondary', value: '#141318', desc: 'Purple-tinted' },
          { name: 'surface-tertiary', value: '#1f1d26', desc: 'More purple' },
          { name: 'surface-hover', value: '#2a2831', desc: 'Hover states' },
          { name: 'surface-card', value: '#161419', desc: 'Card backgrounds' },
        ].map((color) => (
          <div key={color.name} className="space-y-2">
            <div 
              className="h-16 rounded-lg border border-border-secondary"
              style={{ backgroundColor: color.value }}
            />
            <div className="text-center">
              <p className="text-sm font-mono text-text-primary">{color.name}</p>
              <p className="text-xs text-text-muted">{color.value}</p>
              <p className="text-xs text-text-secondary">{color.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Purple Emphasis Areas */}
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-text-primary">Purple Emphasis Strategy</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-card rounded-lg p-6 border border-border-secondary">
          <h4 className="text-lg font-semibold text-brand-300 mb-4">🔥 Strong Purple Emphasis</h4>
          <ul className="space-y-2 text-text-secondary">
            <li>• Primary CTA buttons (Book Now, Get Quote)</li>
            <li>• Active states and selected items</li>
            <li>• Progress indicators and confirmations</li>
            <li>• Brand elements and logos</li>
            <li>• Key interactive elements</li>
          </ul>
        </div>

        <div className="bg-surface-card rounded-lg p-6 border border-border-secondary">
          <h4 className="text-lg font-semibold text-brand-300 mb-4">✨ Subtle Purple Accents</h4>
          <ul className="space-y-2 text-text-secondary">
            <li>• Border hover states with purple tinting</li>
            <li>• Focus rings with purple glows</li>
            <li>• Background gradients with purple undertones</li>
            <li>• Semantic colors with purple base tints</li>
            <li>• Interactive elements with purple highlights</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Typography with Purple */}
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-text-primary">Typography with Purple Accents</h3>
      <div className="bg-surface-card rounded-lg p-8 border border-border-secondary space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          Heading 1 - Brand Gradient
        </h1>
        <h2 className="text-3xl font-bold text-brand-300">
          Heading 2 - Brand Light
        </h2>
        <h3 className="text-2xl font-semibold text-text-primary">
          Heading 3 - Primary Text
        </h3>
        <p className="text-text-secondary">
          Body text with <span className="text-brand-400 font-medium">purple accents</span> for emphasis and 
          <span className="text-brand-300 hover:text-brand-400 transition-colors cursor-pointer"> interactive elements</span>.
        </p>
        <p className="text-text-muted text-sm">
          Muted text for supporting information and metadata.
        </p>
      </div>
    </div>
  </div>
);

const OtherComponents: React.FC = () => (
  <div className="space-y-12">
    <SkeletonDemo />
    <BadgeDemo />
    <ToastDemo />
    <TableDemo />
    <FormDemo />
  </div>
);

const BookingFlow: React.FC = () => (
  <div className="space-y-8">
    <div className="text-center space-y-4 mb-12">
      <h2 className="text-3xl font-bold text-text-primary">Booking Flow - Strong Purple Emphasis</h2>
      <p className="text-text-secondary max-w-2xl mx-auto">
        Key conversion points with prominent purple branding and clear call-to-actions
      </p>
    </div>

    {/* Service Selection */}
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-text-primary">1. Service Selection</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Exterior Detail', price: '£89', popular: false },
          { name: 'Full Service', price: '£149', popular: true },
          { name: 'Interior Detail', price: '£79', popular: false },
        ].map((service) => (
          <div
            key={service.name}
            className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
              service.popular
                ? 'border-brand-500 bg-brand-600/10 shadow-purple-lg'
                : 'border-border-secondary hover:border-brand-400 hover:bg-brand-600/5'
            }`}
          >
            {service.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                MOST POPULAR
              </div>
            )}
            <div className="text-center space-y-3">
              <h4 className="text-lg font-semibold text-text-primary">{service.name}</h4>
              <div className="text-3xl font-bold text-brand-400">{service.price}</div>
              <button
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                  service.popular
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-purple hover:shadow-purple-lg animate-purple-pulse'
                    : 'border border-brand-500 text-brand-400 hover:bg-brand-600 hover:text-white'
                }`}
              >
                Select {service.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Progress Indicator */}
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-text-primary">2. Progress Indicator</h3>
      <div className="bg-surface-card rounded-lg p-6 border border-border-secondary">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-muted">Step 2 of 4</span>
          <span className="text-sm text-brand-400 font-medium">50% Complete</span>
        </div>
        <div className="w-full bg-surface-tertiary rounded-full h-2">
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full w-1/2 shadow-purple transition-all duration-500"></div>
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <span className="text-brand-400 font-medium">✓ Service Selected</span>
          <span className="text-brand-400 font-medium">📅 Date & Time</span>
          <span className="text-text-muted">📍 Location</span>
          <span className="text-text-muted">💳 Payment</span>
        </div>
      </div>
    </div>

    {/* Confirmation */}
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-text-primary">3. Booking Confirmation</h3>
      <div className="bg-gradient-to-br from-brand-600/10 to-brand-800/20 rounded-lg p-8 border border-brand-500/30 text-center">
        <div className="text-6xl mb-4 animate-purple-bounce">✅</div>
        <h4 className="text-2xl font-bold text-brand-300 mb-2">Booking Confirmed!</h4>
        <p className="text-text-secondary mb-6">
          Your Full Service detail has been scheduled for March 15th at 10:00 AM
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-brand-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-700 transition-all shadow-purple hover:shadow-purple-lg">
            View Booking Details
          </button>
          <button className="border border-brand-500 text-brand-400 hover:bg-brand-600 hover:text-white px-8 py-3 rounded-lg font-medium transition-all">
            Add to Calendar
          </button>
        </div>
      </div>
    </div>

    {/* CTA Section */}
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-text-primary">4. Additional CTAs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-card rounded-lg p-6 border border-border-secondary">
          <h4 className="text-lg font-semibold text-text-primary mb-3">📱 Mobile App</h4>
          <p className="text-text-secondary mb-4">Track your booking and get updates on the go</p>
          <button className="w-full bg-brand-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-brand-700 transition-all shadow-purple hover:shadow-purple-lg">
            Download Love4Detailing App
          </button>
        </div>
        
        <div className="bg-surface-card rounded-lg p-6 border border-border-secondary">
          <h4 className="text-lg font-semibold text-text-primary mb-3">🔄 Regular Service</h4>
          <p className="text-text-secondary mb-4">Set up monthly detailing and save 15%</p>
          <button className="w-full border border-brand-500 text-brand-400 hover:bg-brand-600 hover:text-white py-3 px-6 rounded-lg font-medium transition-all">
            Setup Recurring Service
          </button>
        </div>
      </div>
    </div>
  </div>
);