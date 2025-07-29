'use client';

import React, { useState, useEffect } from 'react';
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore';
import { Button } from '@/components/ui/primitives/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, Sparkles, Palette, Shield } from 'lucide-react';

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
  
  const { isCurrentStep } = useBookingStep(4)
  
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<string | null>(
    formData.service?.serviceId || null
  )

  // Load services and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load services using the store
      await loadAvailableServices()
      
      // Load categories separately
      try {
        const categoriesResponse = await fetch('/api/services/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          if (categoriesData.success) {
            setCategories(categoriesData.data || [])
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    if (isCurrentStep) {
      loadData()
    }
  }, [isCurrentStep, loadAvailableServices])

  const handleServiceSelection = (serviceId: string): void => {
    const service = availableServices.find(s => s.id === serviceId)
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
        basePrice: service.base_price,
        duration: service.duration_minutes
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

  // Filter services by category
  const filteredServices = selectedCategory === 'all' 
    ? availableServices 
    : availableServices.filter(service => service.category_id === selectedCategory)
    
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

      {/* Category Filter - Mobile First Responsive */}
      <div className="px-4 sm:px-0">
        {/* Mobile: Horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:hidden scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-brand-600 text-white shadow-purple'
                  : 'bg-surface-tertiary text-text-secondary hover:bg-surface-hover border border-border-secondary hover:border-brand-400'
              }`}
            >
              {category.name as string}
            </button>
          ))}
        </div>
        
        {/* Desktop: Centered flex wrap */}
        <div className="hidden sm:flex flex-wrap gap-2 justify-center">
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredServices.map((service) => {
              const isSelected = selectedService === service.id;
              const serviceName = service.name.toLowerCase();
              const isPremium = serviceName.includes('full') || serviceName.includes('complete') || serviceName.includes('premium');
              
              return (
                <Card
                  key={service.id}
                  variant={isSelected ? 'interactive' : 'default'}
                  className={`cursor-pointer transition-all duration-300 relative touch-manipulation ${
                    isSelected
                      ? 'border-brand-500 bg-brand-600/5 shadow-purple-lg'
                      : 'hover:border-brand-400 hover:shadow-purple'
                  } ${isPremium ? 'border-brand-500/50 bg-gradient-to-br from-brand-600/5 to-brand-800/10' : ''}`}
                  onClick={() => handleServiceSelection(service.id)}
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
                    <div className="text-center space-y-1 sm:space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-brand-400">£{service.base_price}</div>
                      <div className="text-xs sm:text-sm text-text-muted">~{Math.round(service.duration_minutes / 60)} hours</div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 sm:p-6 pt-0">
                    <Button
                      variant={isSelected ? 'primary' : 'outline'}
                      fullWidth
                      size="sm"
                      className={`${isSelected ? 'animate-purple-pulse' : ''} touch-manipulation min-h-[44px]`}
                    >
                      {isSelected ? 'Selected' : 'Select Service'}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-tertiary rounded-lg p-4 gap-3 sm:gap-0">
                <div className="flex-1">
                  <span className="text-text-primary font-medium text-base sm:text-lg">{formData.service.name}</span>
                  <div className="text-sm text-text-muted mt-1">~{Math.round(formData.service.duration / 60)} hours</div>
                </div>
                <span className="text-brand-400 font-bold text-xl sm:text-2xl">£{formData.service.basePrice}</span>
              </div>
              <div className="mt-4 text-sm text-text-secondary">
                Final price will be calculated based on your vehicle size in the next step.
              </div>
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
            disabled={!canProceedToNextStep()}
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
            disabled={!canProceedToNextStep()}
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