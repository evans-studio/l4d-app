'use client';

import React, { useState, useEffect } from 'react';
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore';
import { Button } from '@/components/ui/primitives/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, Sparkles, Palette, Shield, Clock, Star } from 'lucide-react';

export function ServiceSelection(): React.JSX.Element {
  const {
    availableServices,
    formData,
    isLoading,
    error,
    setServiceSelection,
    loadAvailableServices,
    previousStep,
    nextStep,
    canProceedToNextStep
  } = useBookingFlowStore()
  
  // Track hydration to prevent SSR/client mismatches
  const [isHydrated, setIsHydrated] = useState(false)
  
  const { isCurrentStep } = useBookingStep(1)
  
  const [selectedService, setSelectedService] = useState<string | null>(
    formData.service?.serviceId || null
  )
  const [servicesWithPricing, setServicesWithPricing] = useState<any[]>([])

  // Set hydration flag after component mounts
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load services on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load services with pricing information
        const servicesResponse = await fetch('/api/services')
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          if (servicesData.success) {
            setServicesWithPricing(servicesData.data || [])
          }
        }
        
        // Also load available services for the store
        await loadAvailableServices()
      } catch (error) {
        console.error('Error loading services:', error)
      }
    }

    if (isCurrentStep) {
      loadData()
    }
  }, [isCurrentStep, loadAvailableServices])

  const handleServiceSelection = (serviceId: string): void => {
    const service = servicesWithPricing.find(s => s.id === serviceId) || availableServices.find(s => s.id === serviceId)
    if (!service) return
    
    if (selectedService === serviceId) {
      // Deselect current service
      setSelectedService(null)
      setServiceSelection(null as any)
    } else {
      // Select new service
      setSelectedService(serviceId)
      setServiceSelection({
        serviceId: service.id,
        name: service.name,
        basePrice: service.priceRange?.min || 0,
        duration: service.duration_minutes || service.estimated_duration || 0
      })
    }
  }

  const handleNext = (): void => {
    if (canProceedToNextStep()) {
      nextStep()
    }
  }

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

  // Use servicesWithPricing if available, otherwise availableServices - no filtering needed
  const servicesToDisplay = servicesWithPricing.length > 0 ? servicesWithPricing : availableServices
  
    
  // Don't render if not current step
  if (!isCurrentStep) {
    return <div></div>
  }

  return (
    <div className="space-y-8">
      {/* Header - Mobile First Responsive */}
      <div className="text-center px-4 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Choose Your Services
        </h2>
        <p className="text-text-secondary text-base sm:text-lg">
          Select the detailing services you&apos;d like to book
        </p>
      </div>


      {/* Services Grid - Mobile First Responsive */}
      <div className="px-4 sm:px-0">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
        ) : servicesToDisplay.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">
              {isLoading ? 'Loading services...' : 'No services available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {servicesToDisplay.map((service) => {
              const isSelected = selectedService === service.id;
              const serviceName = service.name.toLowerCase();
              const isPremium = serviceName.includes('full') || serviceName.includes('complete') || serviceName.includes('premium');
              const hasValidPricing = service.priceRange && service.priceRange.min && service.priceRange.max;
              
              return (
                <Card
                  key={service.id}
                  variant={isSelected ? 'interactive' : 'default'}
                  className={`transition-all duration-300 relative touch-manipulation ${
                    !hasValidPricing 
                      ? 'cursor-not-allowed opacity-60 bg-surface-secondary border-border-secondary' 
                      : 'cursor-pointer'
                  } ${
                    isSelected && hasValidPricing
                      ? 'border-brand-500 bg-brand-600/5 shadow-purple-lg'
                      : hasValidPricing 
                        ? 'hover:border-brand-400 hover:shadow-purple'
                        : ''
                  } ${isPremium && hasValidPricing ? 'border-brand-500/50 bg-gradient-to-br from-brand-600/5 to-brand-800/10' : ''}`}
                  onClick={() => hasValidPricing && handleServiceSelection(service.id)}
                >
                  {isPremium && (
                    <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                      <span className="sm:hidden">POPULAR</span>
                      <span className="hidden sm:inline">MOST POPULAR</span>
                    </div>
                  )}
                  
                  {/* Selection Indicator - Mobile Optimized */}
                  <div className={`
                    absolute top-3 sm:top-4 right-3 sm:right-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'bg-brand-600 border-brand-600' 
                      : 'border-border-secondary'
                    }
                  `}>
                    {isSelected && <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </div>

                  <CardHeader className="text-center p-4 sm:p-6">
                    {/* Icon - Mobile Responsive */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 ${
                      isSelected 
                        ? 'bg-brand-600 text-white' 
                        : 'bg-brand-600/10 text-brand-400'
                    }`}>
                      <div className="scale-75 sm:scale-100">
                        {getServiceIcon(service.name)}
                      </div>
                    </div>
                    
                    {/* Service Name - Mobile Responsive */}
                    <h3 className="text-lg sm:text-xl font-bold text-brand-300 mb-2">{service.name}</h3>
                    <p className="text-text-secondary text-sm sm:text-base line-clamp-2">
                      {service.short_description || 'Professional detailing service'}
                    </p>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="text-center space-y-2">
                      {/* Dynamic Price Display */}
                      {service.priceRange && service.priceRange.min && service.priceRange.max ? (
                        service.priceRange.min !== service.priceRange.max ? (
                          <div className="space-y-1">
                            <div className="text-lg sm:text-xl font-bold text-brand-400">
                              From £{service.priceRange.min} - £{service.priceRange.max}
                            </div>
                            <div className="text-xs text-text-muted">Based on vehicle size</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xl sm:text-2xl font-bold text-brand-400">
                              £{service.priceRange.min}
                            </div>
                            <div className="text-xs text-text-muted">Fixed price</div>
                          </div>
                        )
                      ) : (
                        <div className="space-y-1">
                          <div className="text-lg text-text-secondary">
                            Contact for pricing
                          </div>
                          {!hasValidPricing && (
                            <div className="text-xs text-orange-400 font-medium">
                              Pricing not configured
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Duration Display */}
                      <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-text-muted">
                        <Clock className="w-3 h-3" />
                        <span>~{Math.round((service.duration_minutes || service.estimated_duration || 0) / 60)} hours</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 sm:p-6 pt-0">
                    <Button
                      variant={isSelected && hasValidPricing ? 'primary' : 'outline'}
                      fullWidth
                      size="sm"
                      disabled={!hasValidPricing}
                      className={`${isSelected && hasValidPricing ? 'animate-purple-pulse' : ''} touch-manipulation min-h-[44px]`}
                    >
                      {!hasValidPricing 
                        ? 'Pricing Required' 
                        : isSelected 
                          ? 'Selected' 
                          : 'Select Service'
                      }
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection Summary - Mobile First Responsive */}
      {selectedService && formData.service && (
        <div className="px-4 sm:px-0">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-text-primary">
                Selected Service
              </h3>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {(() => {
                const selectedServiceData = servicesWithPricing.find(s => s.id === selectedService) || availableServices.find(s => s.id === selectedService)
                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-tertiary rounded-lg p-4 gap-3 sm:gap-0">
                      <div className="flex-1">
                        <span className="text-text-primary font-medium text-base sm:text-lg">{formData.service.name}</span>
                        <div className="text-sm text-text-muted mt-1">~{Math.round(formData.service.duration / 60)} hours</div>
                      </div>
                      <div className="text-right">
                        {selectedServiceData?.priceRange && selectedServiceData.priceRange.min !== selectedServiceData.priceRange.max ? (
                          <div>
                            <span className="text-brand-400 font-bold text-lg sm:text-xl">£{selectedServiceData.priceRange.min} - £{selectedServiceData.priceRange.max}</span>
                            <div className="text-xs text-text-muted">Based on vehicle size</div>
                          </div>
                        ) : selectedServiceData?.priceRange?.min ? (
                          <span className="text-brand-400 font-bold text-xl sm:text-2xl">£{selectedServiceData.priceRange.min}</span>
                        ) : (
                          <span className="text-text-secondary text-sm">Contact for pricing</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-text-secondary space-y-2">
                      <p>Final price will be calculated based on your vehicle size and service location.</p>
                      {formData.service && (
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <Clock className="w-3 h-3" />
                          <span>Estimated duration: {Math.round(formData.service.duration / 60)} hours</span>
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation - Mobile First Responsive */}
      <div className="px-4 sm:px-0">
        {/* Mobile: Stacked */}
        <div className="sm:hidden space-y-3 pt-6">
          <Button
            onClick={handleNext}
            disabled={isHydrated ? !canProceedToNextStep() : true}
            size="lg"
            fullWidth
            rightIcon={<ChevronRightIcon className="w-4 h-4" />}
            className="min-h-[48px]"
          >
            Continue to Service Location
          </Button>
          <Button
            variant="outline"
            onClick={previousStep}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
            fullWidth
            className="min-h-[48px]"
          >
            Back to Vehicle Details
          </Button>
        </div>
        
        {/* Desktop: Side by side */}
        <div className="hidden sm:flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={previousStep}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
          >
            Back to Vehicle Details
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isHydrated ? !canProceedToNextStep() : true}
            size="lg"
            rightIcon={<ChevronRightIcon className="w-4 h-4" />}
          >
            Continue to Service Location
          </Button>
        </div>
      </div>
    </div>
  );
}