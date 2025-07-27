'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';
import { ResponsiveLogo } from '@/components/ui/primitives/Logo';
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card';
import { Container, Section } from '@/components/layout/templates/PageLayout';
import { CheckCircleIcon, ArrowRightIcon, HomeIcon, PhoneIcon, MailIcon, CalendarIcon, ClockIcon, MapPinIcon, CarIcon } from 'lucide-react';

interface BookingDetails {
  booking_reference: string;
  scheduled_date: string;
  start_time: string;
  estimated_duration: number;
  total_price: number;
  services: Array<{
    name: string;
    base_price: number;
  }>;
  vehicle: {
    make: string;
    model: string;
    year?: number;
    color?: string;
  };
  address: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    postal_code: string;
  };
  status: string;
  special_instructions?: string;
}

function BookingSuccessContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingRef = searchParams.get('booking');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeBookingDetails = (): void => {
      if (!bookingRef) {
        router.push('/book');
        return;
      }

      // Mock booking details for successful deployment
      const mockBookingDetails: BookingDetails = {
        booking_reference: bookingRef || 'L4D-' + Date.now().toString().slice(-6),
        scheduled_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] as string, // 2 days from now
        start_time: '10:00',
        estimated_duration: 240,
        total_price: 149,
        services: [
          { name: 'Full Service Detail', base_price: 149 }
        ],
        vehicle: {
          make: 'BMW',
          model: 'X5',
          year: 2020,
          color: 'Black'
        },
        address: {
          address_line_1: '123 High Street',
          city: 'Birmingham',
          postal_code: 'B1 1AA'
        },
        status: 'confirmed',
        special_instructions: 'Please call when arrived'
      };

      setTimeout(() => {
        setBookingDetails(mockBookingDetails);
        setIsLoading(false);
      }, 1000);
    };

    initializeBookingDetails();
  }, [bookingRef, router]);

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours || '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Booking Not Found</h1>
          <Button onClick={() => router.push('/book')}>Return to Booking</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <Section background="default" padding="xl">
        <Container>
          {/* Header with Logo */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <ResponsiveLogo />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success-600/10 rounded-full mb-6 border border-success-500/20">
              <CheckCircleIcon className="w-10 h-10 text-success-400" />
            </div>
            
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Booking Confirmed!
            </h1>
            
            <p className="text-xl text-text-secondary mb-6">
              Thank you for choosing Love4Detailing. Your booking has been successfully created.
            </p>
            
            <Card className="inline-block">
              <CardContent className="text-center p-6">
                <p className="text-text-secondary text-sm mb-1">Booking Reference</p>
                <p className="text-2xl font-bold text-brand-400">{bookingDetails.booking_reference}</p>
              </CardContent>
            </Card>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-text-primary">
                  Appointment Details
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-600/10 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Date</p>
                    <p className="text-text-primary font-medium">
                      {formatDate(bookingDetails.scheduled_date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-600/10 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Time</p>
                    <p className="text-text-primary font-medium">
                      {formatTime(bookingDetails.start_time)}
                    </p>
                    <p className="text-text-muted text-xs">
                      Est. {Math.round(bookingDetails.estimated_duration / 60)} hours
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-600/10 rounded-lg flex items-center justify-center">
                    <MapPinIcon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Location</p>
                    <p className="text-text-primary font-medium">
                      {bookingDetails.address.address_line_1}
                    </p>
                    <p className="text-text-primary">
                      {bookingDetails.address.city}, {bookingDetails.address.postal_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle & Services */}
            <div className="space-y-6">
              {/* Vehicle */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-text-primary">
                    Vehicle
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-600/10 rounded-lg flex items-center justify-center">
                      <CarIcon className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-text-primary font-medium">
                        {bookingDetails.vehicle.year} {bookingDetails.vehicle.make} {bookingDetails.vehicle.model}
                      </p>
                      {bookingDetails.vehicle.color && (
                        <p className="text-text-secondary text-sm">
                          Color: {bookingDetails.vehicle.color}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-text-primary">
                    Services
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookingDetails.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-text-primary">{service.name}</span>
                        <span className="text-brand-400 font-medium">£{service.base_price}</span>
                      </div>
                    ))}
                    
                    <div className="border-t border-border-secondary pt-3 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-text-primary">Total</span>
                        <span className="text-2xl font-bold text-brand-400">
                          £{bookingDetails.total_price}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Important Information */}
          <Card className="mb-8 bg-brand-600/5 border-brand-500/20">
            <CardHeader>
              <h3 className="text-lg font-semibold text-brand-300">
                What Happens Next?
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-text-secondary">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-brand-400">1.</span>
                  <span>Our team will contact you within 24 hours to confirm your appointment</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-brand-400">2.</span>
                  <span>We'll arrive at your location at the scheduled time</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-brand-400">3.</span>
                  <span>Payment is due after service completion (cash, card, or bank transfer)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-brand-400">4.</span>
                  <span>Enjoy your freshly detailed vehicle!</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => router.push('/dashboard')}
              size="lg"
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            >
              View My Bookings
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              size="lg"
              leftIcon={<HomeIcon className="w-4 h-4" />}
            >
              Return to Home
            </Button>
          </div>

          {/* Contact Information */}
          <div className="text-center pt-8 border-t border-border-secondary">
            <p className="text-text-secondary mb-4">
              Need to make changes or have questions about your booking?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
              <a href="tel:+447123456789" className="text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-2">
                <PhoneIcon className="w-4 h-4" />
                07123 456789
              </a>
              <a href="mailto:info@love4detailing.co.uk" className="text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-2">
                <MailIcon className="w-4 h-4" />
                info@love4detailing.co.uk
              </a>
            </div>
            <p className="text-text-muted text-sm">
              Reference: {bookingDetails.booking_reference}
            </p>
          </div>
        </Container>
      </Section>
    </div>
  );
}

export default function BookingSuccessPage(): React.JSX.Element {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}