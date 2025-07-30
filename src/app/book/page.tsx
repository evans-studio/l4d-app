'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';
import { ResponsiveLogo } from '@/components/ui/primitives/Logo';
import { Container, Section } from '@/components/layout/templates/PageLayout';
import { useBookingFlowStore } from '@/lib/store/bookingFlowStore';
import { BookingFlowIndicator } from '@/components/booking/BookingFlowIndicator';
import { ServiceSelection } from '@/components/booking/steps/ServiceSelection';
import { VehicleDetails } from '@/components/booking/steps/VehicleDetails';
import { TimeSlotSelection } from '@/components/booking/steps/TimeSlotSelection';
import { AddressCollection } from '@/components/booking/steps/AddressCollection';
import { UserDetails } from '@/components/booking/steps/UserDetails';
import { PricingConfirmation } from '@/components/booking/steps/PricingConfirmation';
import { ArrowLeft, Phone, User, LogIn } from 'lucide-react';

export default function BookingPage(): React.JSX.Element {
  const router = useRouter();
  const { currentStep, previousStep, isRebooking, resetFlow } = useBookingFlowStore();
  
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
        return <VehicleDetails />;
      case 3:
        return <TimeSlotSelection />;
      case 4:
        return <AddressCollection />;
      case 5:
        return <UserDetails />;
      case 6:
        return <PricingConfirmation />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header - Mobile First Responsive */}
      <Section background="muted" padding="sm">
        <Container>
          {/* Mobile Header Layout */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            {/* Top Row - Logo and Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.href = '/'}
                  className="p-2 sm:px-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Back to Home</span>
                </Button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <ResponsiveLogo />
                  <div className="hidden sm:block">
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                      {isRebooking ? 'Rebook Your Service' : 'Book Your Service'}
                    </h1>
                    <p className="text-sm text-text-secondary">
                      {isRebooking ? 'Using your previous booking details' : 'Professional mobile car detailing'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Mobile Auth Quick Access */}
              <div className="sm:hidden">
                {!authLoading && (
                  <>
                    {isAuthenticated && profile ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                        className="text-brand-400 hover:text-brand-300 p-2"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/auth/login')}
                        className="text-brand-400 hover:text-brand-300 p-2"
                      >
                        <LogIn className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Mobile Title (visible only on mobile) */}
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-text-primary">
                {isRebooking ? 'Rebook Your Service' : 'Book Your Service'}
              </h1>
              <p className="text-sm text-text-secondary">
                {isRebooking ? 'Using your previous booking details' : 'Professional mobile car detailing'}
              </p>
            </div>

            {/* Desktop Right Side */}
            <div className="hidden sm:flex items-center gap-3 lg:gap-4">
              {/* Authentication Status */}
              {!authLoading && (
                <div className="flex items-center gap-2">
                  {isAuthenticated && profile ? (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <User className="w-4 h-4 text-brand-400" />
                      <span className="text-sm lg:text-base">Hi, {(profile as any)?.first_name || 'Guest'}</span>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/auth/login')}
                      leftIcon={<LogIn className="w-4 h-4" />}
                      className="text-brand-400 hover:text-brand-300"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              )}
              
              {/* Help Contact */}
              <div className="hidden lg:flex items-center gap-2 text-text-secondary">
                <Phone className="w-4 h-4 text-brand-400" />
                <span className="text-sm">Need help? Call 07123 456789</span>
              </div>
              
              {/* Mobile Help Button (for tablet) */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-brand-400 hover:text-brand-300"
                onClick={() => window.location.href = 'tel:07123456789'}
              >
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Help Contact Bar */}
          <div className="sm:hidden mt-3 pt-3 border-t border-border-secondary">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-brand-400 hover:text-brand-300"
              onClick={() => window.location.href = 'tel:07123456789'}
            >
              <Phone className="w-4 h-4 mr-2" />
              Need help? Tap to call
            </Button>
          </div>
        </Container>
      </Section>

      {/* Rebooking Notice */}
      {isRebooking && (
        <Section background="muted" padding="sm">
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Rebooking Mode</h3>
                  <p className="text-sm text-blue-700">We've pre-filled your details from your previous booking</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetFlow()
                  window.location.reload()
                }}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Start Fresh
              </Button>
            </div>
          </Container>
        </Section>
      )}

      {/* Progress Indicator - Responsive variants */}
      <BookingFlowIndicator variant="mobile" />
      <BookingFlowIndicator variant="compact" />
      <BookingFlowIndicator variant="default" />

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