'use client';

import React, { useState, useEffect } from 'react';
import { BookingFlowData, Service, ServiceCategory } from '@/lib/utils/booking-types';
import { Button } from '@/components/ui/primitives/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card';
import { CheckIcon, ChevronRightIcon, Sparkles, Palette, Shield } from 'lucide-react';

interface ServiceSelectionProps {
  bookingData: BookingFlowData;
  updateBookingData: (updates: Partial<BookingFlowData>) => void;
  onNext: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function ServiceSelection({ 
  bookingData, 
  updateBookingData, 
  onNext, 
  isLoading, 
  setIsLoading 
}: ServiceSelectionProps): React.JSX.Element {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<string[]>(
    bookingData.selectedServices || []
  );

  // Load real services and categories from the database
  useEffect(() => {
    const loadServicesAndCategories = async (): Promise<void> => {
      setIsLoading(true);
      
      try {
        // Load services and categories in parallel
        const [servicesResponse, categoriesResponse] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/services/categories')
        ]);

        if (servicesResponse.ok && categoriesResponse.ok) {
          const servicesData = await servicesResponse.json();
          const categoriesData = await categoriesResponse.json();

          if (servicesData.success && categoriesData.success) {
            setServices(servicesData.data || []);
            setCategories(categoriesData.data || []);
          } else {
            console.error('Failed to load services or categories');
            // Fallback to basic services if API fails
            setServices([
              {
                id: 'exterior',
                name: 'Exterior Detail',
                short_description: 'Complete wash, wax & protection',
                base_price: 89,
                duration_minutes: 180,
                category_id: 'detailing'
              }
            ]);
            setCategories([
              {
                id: 'detailing',
                name: 'Detailing Services',
                description: 'Standard services',
                display_order: 1,
                is_active: true,
                created_at: new Date().toISOString()
              }
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading services:', error);
        // Fallback to basic services on error
        setServices([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadServicesAndCategories();
  }, [setIsLoading]);

  const handleServiceToggle = (serviceId: string): void => {
    const newSelectedServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];
    
    setSelectedServices(newSelectedServices);
    updateBookingData({ selectedServices: newSelectedServices });
  };

  const handleNext = (): void => {
    if (selectedServices.length > 0) {
      onNext();
    }
  };

  const getServiceIcon = (serviceName: string): React.JSX.Element => {
    const name = serviceName.toLowerCase();
    if (name.includes('exterior') || name.includes('wash') || name.includes('wax')) {
      return <Sparkles className="w-8 h-8" />;
    } else if (name.includes('interior') || name.includes('vacuum') || name.includes('clean')) {
      return <Palette className="w-8 h-8" />;
    } else if (name.includes('full') || name.includes('complete') || name.includes('premium')) {
      return <Shield className="w-8 h-8" />;
    }
    return <Sparkles className="w-8 h-8" />;
  };

  // Filter services by category
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category_id === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          Choose Your Services
        </h2>
        <p className="text-text-secondary text-lg">
          Select the detailing services you&apos;d like to book
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-brand-600 text-white shadow-purple'
              : 'bg-surface-tertiary text-text-secondary hover:bg-surface-hover border border-border-secondary hover:border-brand-400'
          }`}
        >
          All Services
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id as string}
            onClick={() => setSelectedCategory(category.id as string)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-brand-600 text-white shadow-purple'
                : 'bg-surface-tertiary text-text-secondary hover:bg-surface-hover border border-border-secondary hover:border-brand-400'
            }`}
          >
            {category.name as string}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent>
                <div className="h-4 bg-surface-tertiary rounded mb-4"></div>
                <div className="h-3 bg-surface-tertiary rounded mb-2"></div>
                <div className="h-3 bg-surface-tertiary rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-surface-tertiary rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const isSelected = selectedServices.includes(service.id as string);
            const serviceName = (service.name as string).toLowerCase();
            const isPremium = serviceName.includes('full') || serviceName.includes('complete') || serviceName.includes('premium');
            
            return (
              <Card
                key={service.id as string}
                variant={isSelected ? 'interactive' : 'default'}
                className={`cursor-pointer transition-all duration-300 relative ${
                  isSelected
                    ? 'border-brand-500 bg-brand-600/5 shadow-purple-lg'
                    : 'hover:border-brand-400 hover:shadow-purple'
                } ${isPremium ? 'border-brand-500/50 bg-gradient-to-br from-brand-600/5 to-brand-800/10' : ''}`}
                onClick={() => handleServiceToggle(service.id as string)}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                
                {/* Selection Indicator */}
                <div className={`
                  absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected 
                    ? 'bg-brand-600 border-brand-600' 
                    : 'border-border-secondary'
                  }
                `}>
                  {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                </div>

                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isSelected 
                      ? 'bg-brand-600 text-white' 
                      : 'bg-brand-600/10 text-brand-400'
                  }`}>
                    {getServiceIcon(service.name as string)}
                  </div>
                  <h3 className="text-xl font-bold text-brand-300">{service.name as string}</h3>
                  <p className="text-text-secondary">{service.short_description as string}</p>
                </CardHeader>

                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-brand-400">£{service.base_price as number}</div>
                    <div className="text-sm text-text-muted">~{Math.round((service.duration_minutes as number) / 60)} hours</div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    variant={isSelected ? 'primary' : 'outline'}
                    fullWidth
                    className={isSelected ? 'animate-purple-pulse' : ''}
                  >
                    {isSelected ? 'Selected' : 'Select Service'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selection Summary */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Selected Services ({selectedServices.length})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedServices.map((serviceId) => {
                const service = services.find(s => (s.id as string) === serviceId);
                if (!service) return null;
                
                return (
                  <div key={serviceId} className="flex items-center justify-between bg-surface-tertiary rounded-lg p-3">
                    <span className="text-text-primary font-medium">{service.name as string}</span>
                    <span className="text-brand-400 font-bold">£{service.base_price as number}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border-secondary">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-text-primary">Total</span>
                <span className="text-2xl font-bold text-brand-400">
                  £{selectedServices.reduce((total, serviceId) => {
                    const service = services.find(s => (s.id as string) === serviceId);
                    return total + (service?.base_price as number || 0);
                  }, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <div></div> {/* Empty div for spacing */}
        
        <Button
          onClick={handleNext}
          disabled={selectedServices.length === 0}
          size="lg"
          rightIcon={<ChevronRightIcon className="w-4 h-4" />}
        >
          Continue to Vehicle Details
        </Button>
      </div>
    </div>
  );
}