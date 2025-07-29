'use client'

import { useState, useEffect } from 'react'
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { Input } from '@/components/ui/primitives/Input'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CarIcon, CheckIcon } from 'lucide-react'

export function VehicleDetails() {
  const {
    formData,
    vehicleSizes,
    userVehicles,
    isExistingUser,
    isLoading,
    error,
    setVehicleData,
    loadVehicleSizes,
    previousStep,
    nextStep,
    canProceedToNextStep,
    calculatePrice
  } = useBookingFlowStore()

  const { isCurrentStep } = useBookingStep(3)
  
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(!isExistingUser || userVehicles.length === 0)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [vehicleForm, setVehicleForm] = useState({
    make: formData.vehicle?.make || '',
    model: formData.vehicle?.model || '',
    year: formData.vehicle?.year || new Date().getFullYear(),
    color: formData.vehicle?.color || '',
    registration: formData.vehicle?.registration || '',
    size: formData.vehicle?.size || 'medium' as 'small' | 'medium' | 'large' | 'extra_large',
    notes: formData.vehicle?.notes || '',
  })

  // Load vehicle sizes when component mounts
  useEffect(() => {
    if (isCurrentStep && vehicleSizes.length === 0) {
      loadVehicleSizes()
    }
  }, [isCurrentStep, vehicleSizes.length, loadVehicleSizes])

  // Update form when store data changes
  useEffect(() => {
    if (formData.vehicle) {
      setVehicleForm({
        make: formData.vehicle.make,
        model: formData.vehicle.model,
        year: formData.vehicle.year,
        color: formData.vehicle.color || '',
        registration: formData.vehicle.registration || '',
        size: formData.vehicle.size,
        notes: formData.vehicle.notes || '',
      })
    }
  }, [formData.vehicle])

  const handleFormChange = (field: string, value: any) => {
    setVehicleForm(prev => ({ ...prev, [field]: value }))
  }

  const handleExistingVehicleSelect = (vehicleId: string) => {
    const vehicle = userVehicles.find(v => v.id === vehicleId)
    if (vehicle && vehicle.vehicle_size) {
      setSelectedVehicleId(vehicleId)
      setVehicleData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        registration: vehicle.registration || '',
        size: getSizeNameFromMultiplier(vehicle.vehicle_size.price_multiplier),
        notes: vehicle.notes || ''
      })
      setShowNewVehicleForm(false)
    }
  }

  const handleNewVehicleSubmit = () => {
    if (vehicleForm.make && vehicleForm.model && vehicleForm.size) {
      setVehicleData(vehicleForm)
      setSelectedVehicleId(null)
    }
  }

  const handleNext = async () => {
    // Calculate price when proceeding to next step
    if (canProceedToNextStep()) {
      await calculatePrice()
      nextStep()
    }
  }

  // Helper function to map price multiplier to size name
  const getSizeNameFromMultiplier = (multiplier: number): 'small' | 'medium' | 'large' | 'extra_large' => {
    if (multiplier <= 0.8) return 'small'
    if (multiplier <= 1.0) return 'medium'
    if (multiplier <= 1.3) return 'large'
    return 'extra_large'
  }

  // Helper function to get size display info from database
  const getSizeInfo = (sizeName: string) => {
    const vehicleSize = vehicleSizes.find(size => 
      size.name.toLowerCase().replace(/\s+/g, '_') === sizeName
    )
    
    if (vehicleSize) {
      return {
        id: vehicleSize.id,
        label: vehicleSize.name,
        description: vehicleSize.description || 'Vehicle size',
        multiplier: `${vehicleSize.price_multiplier}x`,
        examples: vehicleSize.examples || []
      }
    }
    
    // Fallback for legacy size names
    const legacyMap = {
      small: { label: 'Small', description: 'Hatchbacks, city cars', multiplier: '0.8x', examples: [] },
      medium: { label: 'Medium', description: 'Sedans, small SUVs', multiplier: '1.0x', examples: [] },
      large: { label: 'Large', description: 'Large SUVs, vans', multiplier: '1.3x', examples: [] },
      extra_large: { label: 'Extra Large', description: 'Large vans, trucks', multiplier: '1.5x', examples: [] }
    }
    return legacyMap[sizeName as keyof typeof legacyMap] || legacyMap.medium
  }

  if (!isCurrentStep) {
    return <div></div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          Vehicle Details
        </h2>
        <p className="text-text-secondary text-lg">
          Tell us about your vehicle to ensure the best service
        </p>
      </div>

      {/* Existing Vehicles (for returning customers) */}
      {isExistingUser && userVehicles.length > 0 && !showNewVehicleForm && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-text-primary">Choose from your saved vehicles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userVehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedVehicleId === vehicle.id
                    ? 'border-brand-500 bg-brand-600/5 shadow-purple-lg'
                    : 'hover:border-brand-400 hover:shadow-purple'
                }`}
                onClick={() => handleExistingVehicleSelect(vehicle.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-600/10 flex items-center justify-center">
                        <CarIcon className="w-6 h-6 text-brand-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h4>
                        <p className="text-sm text-text-secondary">
                          {vehicle.vehicle_size?.name} • {vehicle.color}
                        </p>
                      </div>
                    </div>
                    {selectedVehicleId === vehicle.id && (
                      <CheckIcon className="w-5 h-5 text-brand-600" />
                    )}
                  </div>
                  {vehicle.registration && (
                    <p className="text-sm text-text-muted">Reg: {vehicle.registration}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowNewVehicleForm(true)}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              Add Different Vehicle
            </Button>
          </div>
        </div>
      )}

      {/* New Vehicle Form */}
      {showNewVehicleForm && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-text-primary">
              {isExistingUser && userVehicles.length > 0 ? 'Add New Vehicle' : 'Vehicle Information'}
            </h3>
            <p className="text-text-secondary">
              Please provide your vehicle details for accurate service pricing
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Basic Vehicle Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Make *
                </label>
                <Input
                  value={vehicleForm.make}
                  onChange={(e) => handleFormChange('make', e.target.value)}
                  placeholder="e.g., BMW, Mercedes, Ford"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Model *
                </label>
                <Input
                  value={vehicleForm.model}
                  onChange={(e) => handleFormChange('model', e.target.value)}
                  placeholder="e.g., 320i, C-Class, Focus"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Year *
                </label>
                <Input
                  type="number"
                  value={vehicleForm.year}
                  onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                  min="1980"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Color
                </label>
                <Input
                  value={vehicleForm.color}
                  onChange={(e) => handleFormChange('color', e.target.value)}
                  placeholder="e.g., White, Black, Silver"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Registration
                </label>
                <Input
                  value={vehicleForm.registration}
                  onChange={(e) => handleFormChange('registration', e.target.value.toUpperCase())}
                  placeholder="e.g., AB12 CDE"
                />
              </div>
            </div>

            {/* Vehicle Size Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Vehicle Size *
              </label>
              <p className="text-sm text-text-secondary mb-4">
                This affects the service pricing. Choose the size that best matches your vehicle.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {vehicleSizes.length > 0 ? vehicleSizes.map((vehicleSize) => {
                  const sizeKey = vehicleSize.name.toLowerCase().replace(/\s+/g, '_')
                  const isSelected = vehicleForm.size === sizeKey
                  
                  return (
                    <Card
                      key={vehicleSize.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-600/5 shadow-purple-lg'
                          : 'hover:border-brand-400 hover:shadow-purple'
                      }`}
                      onClick={() => handleFormChange('size', sizeKey)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-400'
                        }`}>
                          <CarIcon className="w-4 h-4" />
                        </div>
                        <h4 className="font-semibold text-text-primary mb-1">
                          {vehicleSize.name}
                        </h4>
                        <p className="text-xs text-text-secondary mb-1">
                          {vehicleSize.description || 'Vehicle size'}
                        </p>
                        <p className="text-xs font-medium text-brand-400">
                          Price: {vehicleSize.price_multiplier}x
                        </p>
                        {vehicleSize.examples && vehicleSize.examples.length > 0 && (
                          <p className="text-xs text-text-tertiary mt-1">
                            {vehicleSize.examples.join(', ')}
                          </p>
                        )}
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-brand-600 mx-auto mt-2" />
                        )}
                      </CardContent>
                    </Card>
                  )
                }) : (
                  // Fallback while loading vehicle sizes from database
                  ['small', 'medium', 'large', 'extra_large'].map((size) => {
                    const sizeInfo = getSizeInfo(size)
                    const isSelected = vehicleForm.size === size
                    
                    return (
                      <Card
                        key={size}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-brand-500 bg-brand-600/5 shadow-purple-lg'
                            : 'hover:border-brand-400 hover:shadow-purple'
                        }`}
                        onClick={() => handleFormChange('size', size)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                            isSelected ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-400'
                          }`}>
                            <CarIcon className="w-4 h-4" />
                          </div>
                          <h4 className="font-semibold text-text-primary mb-1">
                            {sizeInfo.label}
                          </h4>
                          <p className="text-xs text-text-secondary mb-1">
                            {sizeInfo.description}
                          </p>
                          <p className="text-xs font-medium text-brand-400">
                            Price: {sizeInfo.multiplier}
                          </p>
                          {isSelected && (
                            <CheckIcon className="w-4 h-4 text-brand-600 mx-auto mt-2" />
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Additional Notes
              </label>
              <textarea
                value={vehicleForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Any special requirements or notes about your vehicle..."
                rows={3}
                className="w-full px-3 py-2 border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <div className="flex items-center gap-3 w-full">
              {isExistingUser && userVehicles.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowNewVehicleForm(false)}
                >
                  Back to Saved Vehicles
                </Button>
              )}
              <Button
                onClick={handleNewVehicleSubmit}
                disabled={!vehicleForm.make || !vehicleForm.model || !vehicleForm.size}
                className="flex-1"
              >
                Continue with This Vehicle
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Vehicle Summary */}
      {formData.vehicle && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Selected Vehicle</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-surface-tertiary rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
                  <CarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">
                    {formData.vehicle.year} {formData.vehicle.make} {formData.vehicle.model}
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {getSizeInfo(formData.vehicle.size).label} Vehicle • {formData.vehicle.color}
                  </p>
                  {formData.vehicle.registration && (
                    <p className="text-sm text-text-muted">Reg: {formData.vehicle.registration}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">Price Multiplier</p>
                <p className="text-lg font-bold text-brand-400">
                  {getSizeInfo(formData.vehicle.size).multiplier}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          variant="outline"
          onClick={previousStep}
          leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
        >
          Back to Contact Details
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceedToNextStep() || isLoading}
          size="lg"
          rightIcon={<ChevronRightIcon className="w-4 h-4" />}
        >
          {isLoading ? 'Calculating Price...' : 'Continue to Services'}
        </Button>
      </div>
    </div>
  )
}