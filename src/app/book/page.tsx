'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';
import { ResponsiveLogo } from '@/components/ui/primitives/Logo';
import { Container, Section } from '@/components/layout/templates/PageLayout';
import { useBookingFlowStore } from '@/lib/store/bookingFlowStore';
import { BookingStepIndicator } from '@/components/booking/BookingStepIndicator';
import { ServiceSelection } from '@/components/booking/steps/ServiceSelection';
import { VehicleDetails } from '@/components/booking/steps/VehicleDetails';
import { AddressCollection } from '@/components/booking/steps/AddressCollection';
import { TimeSlotSelection } from '@/components/booking/steps/TimeSlotSelection';
import { PricingConfirmation } from '@/components/booking/steps/PricingConfirmation';
import { ArrowLeft, Phone, User, LogIn } from 'lucide-react';

export default function BookingPage(): React.JSX.Element {
  const router = useRouter();
  const { currentStep, previousStep } = useBookingFlowStore();
  
  // Auth state (still needed for header display)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<{ first_name?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        
        if (data.success && data.data?.authenticated) {
          setIsAuthenticated(true);
          setProfile(data.data.user);
        } else {
          setIsAuthenticated(false);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setProfile(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const renderCurrentStep = (): React.JSX.Element | null => {
    switch (currentStep) {
      case 1:
        return <ServiceSelection />;
      case 2:
      case 3:
      case 4:
      case 5:
        return (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Step {currentStep} - Coming Soon</h2>
            <p className="text-text-secondary mb-6">This step is being updated to use the new store architecture.</p>
            <Button onClick={previousStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <Section background="muted" padding="md">
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = '/'}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <ResponsiveLogo />
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">
                    Book Your Service
                  </h1>
                  <p className="text-text-secondary">
                    Professional mobile car detailing
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Authentication Status */}
              {!authLoading && (
                <div className="flex items-center gap-2">
                  {isAuthenticated && profile ? (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <User className="w-4 h-4 text-brand-400" />
                      <span className="hidden sm:inline">Welcome, {(profile as any)?.first_name || 'Guest'}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                        className="text-brand-400 hover:text-brand-300"
                      >
                        Dashboard
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/auth/login')}
                        leftIcon={<LogIn className="w-4 h-4" />}
                        className="text-brand-400 hover:text-brand-300"
                      >
                        <span className="hidden sm:inline">Sign In</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Help Contact */}
              <div className="hidden md:flex items-center gap-2 text-text-secondary">
                <Phone className="w-4 h-4 text-brand-400" />
                <span>Need help? Call 07123 456789</span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Progress Indicator */}
      <Section background="default" padding="sm">
        <Container>
          <BookingStepIndicator
            currentStep={currentStep}
            totalSteps={5}
            steps={[
              { label: 'Services', description: 'Choose your services' },
              { label: 'Vehicle', description: 'Vehicle details' },
              { label: 'Address', description: 'Service location' },
              { label: 'Time', description: 'Select date & time' },
              { label: 'Confirm', description: 'Review & book' },
            ]}
          />
        </Container>
      </Section>

      {/* Main Content */}
      <Section background="default" padding="lg">
        <Container size="lg">
          {renderCurrentStep()}
        </Container>
      </Section>

      {/* Footer */}
      <Section background="muted" padding="md" className="mt-16">
        <Container>
          <div className="text-center text-text-secondary text-sm">
            <p>
              Need help? Contact us at{' '}
              <a 
                href="tel:+447123456789" 
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                07123 456789
              </a>
              {' '}or email{' '}
              <a 
                href="mailto:info@love4detailing.co.uk" 
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                info@love4detailing.co.uk
              </a>
            </p>
          </div>
        </Container>
      </Section>
    </div>
  );
}