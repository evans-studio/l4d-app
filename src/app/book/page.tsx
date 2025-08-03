'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card';
import { ArrowLeft, Phone, User, LogIn, Mail, Shield, CheckCircle } from 'lucide-react';

function BookingPageContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    currentStep, 
    previousStep, 
    isRebooking, 
    resetFlow, 
    formData,
    setServiceSelection,
    loadAvailableServices
  } = useBookingFlowStore();
  
  // Auth state (still needed for header display)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<{ first_name?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // State to track if user has made a choice about continuing
  const [userChoiceMade, setUserChoiceMade] = useState(false);
  
  // State for service pre-population
  const [preSelectedService, setPreSelectedService] = useState<string | null>(null);

  // Check if there's existing booking data from a previous session
  const hasExistingBookingData = React.useMemo(() => {
    return !isRebooking && !userChoiceMade && (
      !!formData.service || 
      !!formData.vehicle || 
      !!formData.address || 
      !!formData.slot ||
      currentStep > 1
    );
  }, [isRebooking, userChoiceMade, formData, currentStep]);

  // Check authentication status and email verification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        
        if (data.success && data.data?.authenticated) {
          const user = data.data.user;
          // Only redirect to email verification if user is authenticated but not verified
          // New users can proceed without authentication
          if (user.email_verified === false) {
            // Only redirect authenticated users who need to verify their email
            router.push('/auth/verify-email?reason=booking');
            return;
          }
          setIsAuthenticated(true);
          setProfile(user);
        } else {
          // Not authenticated - this is fine for new users
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
  }, [router]);

  // Handle service pre-population from URL parameters
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId) {
      console.log('🔗 Service pre-selection detected:', serviceId);
      setPreSelectedService(serviceId);
      
      // Load available services and auto-select the specified one
      const prePopulateService = async () => {
        try {
          // First load available services
          await loadAvailableServices();
          
          // Fetch the specific service details
          const response = await fetch(`/api/services/${serviceId}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            console.log('✅ Service pre-populated:', data.data.name);
            // Set the service data in the booking flow
            setServiceSelection({
              serviceId: data.data.id,
              name: data.data.name,
              description: data.data.short_description || data.data.full_description,
              duration: data.data.duration_minutes,
              basePrice: data.data.base_price,
              category: data.data.category_id
            });
            
            // If we're on step 1 and service is selected, move to step 2
            if (currentStep === 1) {
              console.log('📍 Auto-advancing to vehicle details step');
              // The step advancement will be handled by the ServiceSelection component
            }
          }
        } catch (error) {
          console.error('❌ Failed to pre-populate service:', error);
        }
      };
      
      prePopulateService();
    }
  }, [searchParams, setServiceSelection, loadAvailableServices, currentStep]);

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

  // No auth gate - allow all users to proceed with booking
  // Account will be created automatically during the booking process

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Simple Back to Home Link */}
      <div className="px-4 py-3 border-b border-border-secondary">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.href = '/'}
          className="text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

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

      {/* Previous Session Notice */}
      {hasExistingBookingData && (
        <Section background="muted" padding="sm">
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-brand-600/10 border border-brand-400/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-brand-800">Continue Previous Booking?</h3>
                  <p className="text-sm text-brand-700">We found booking details from your previous session. You can continue where you left off or start fresh.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetFlow()
                    window.location.reload()
                  }}
                  className="text-brand-700 border-brand-400/30 hover:bg-brand-50"
                >
                  Start Fresh
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    // User chooses to continue with existing data
                    setUserChoiceMade(true);
                  }}
                >
                  Continue
                </Button>
              </div>
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
                href="tel:+447908625581" 
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                07908 625581
              </a>
              {' '}or email{' '}
              <a 
                href="mailto:zell@love4detailing.com" 
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                zell@love4detailing.com
              </a>
            </p>
          </div>
        </Container>
      </Section>
    </div>
  );
}

export default function BookingPage(): React.JSX.Element {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <ResponsiveLogo />
          <p className="mt-4 text-text-secondary">Loading booking form...</p>
        </div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}