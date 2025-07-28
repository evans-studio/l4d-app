'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';
import { ResponsiveLogo } from '@/components/ui/primitives/Logo';
import { Container, Section } from '@/components/layout/templates/PageLayout';
import { BookingFlowData } from '@/lib/utils/booking-types';
import { BookingStepIndicator } from '@/components/booking/BookingStepIndicator';
import { ServiceSelection } from '@/components/booking/steps/ServiceSelection';
import { VehicleDetails } from '@/components/booking/steps/VehicleDetails';
import { AddressCollection } from '@/components/booking/steps/AddressCollection';
import { TimeSlotSelection } from '@/components/booking/steps/TimeSlotSelection';
import { PricingConfirmation } from '@/components/booking/steps/PricingConfirmation';
import { ArrowLeft, Phone, User, LogIn } from 'lucide-react';

const TOTAL_STEPS = 5;

export default function BookingPage(): React.JSX.Element {
  const router = useRouter();
  
  // Auth state
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
  
  const [bookingData, setBookingData] = useState<BookingFlowData>({
    currentStep: 1,
    totalSteps: TOTAL_STEPS,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // The auth state will be passed to individual components
  // which can use the user profile information as needed

  const updateBookingData = (updates: Partial<BookingFlowData>): void => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = (): void => {
    if (bookingData.currentStep < TOTAL_STEPS) {
      updateBookingData({ currentStep: bookingData.currentStep + 1 });
    }
  };

  const prevStep = (): void => {
    if (bookingData.currentStep > 1) {
      updateBookingData({ currentStep: bookingData.currentStep - 1 });
    }
  };

  const renderCurrentStep = (): React.JSX.Element | null => {
    switch (bookingData.currentStep) {
      case 1:
        return (
          <ServiceSelection
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            onNext={nextStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 2:
        return (
          <VehicleDetails
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            onNext={nextStep}
            onPrev={prevStep}
            setIsLoading={setIsLoading}
          />
        );
      case 3:
        return (
          <AddressCollection
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            onNext={nextStep}
            onPrev={prevStep}
            setIsLoading={setIsLoading}
          />
        );
      case 4:
        return (
          <TimeSlotSelection
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            onNext={nextStep}
            onPrev={prevStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 5:
        return (
          <PricingConfirmation
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            onPrev={prevStep}
          />
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
            currentStep={bookingData.currentStep}
            totalSteps={bookingData.totalSteps}
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