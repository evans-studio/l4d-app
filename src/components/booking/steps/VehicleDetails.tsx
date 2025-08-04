'use client'

import { useState, useEffect } from 'react'
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { Input } from '@/components/ui/primitives/Input'
import { Select } from '@/components/ui/primitives/Select'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CarIcon, CheckIcon, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { getVehicleSizeDescription, PRICING_CONFIG } from '@/lib/pricing/calculator'

// Vehicle data interfaces
interface VehicleModel {
  model: string
  size: 'S' | 'M' | 'L' | 'XL'
  years: number[]
}

interface VehicleMake {
  make: string
  models: VehicleModel[]
}

interface VehicleDataResponse {
  vehicles: VehicleMake[]
}

export function VehicleDetails() {
  const {
    formData,
    vehicleSizes,
    userVehicles,
    isExistingUser,
    isLoading,
    error,
    setVehicleData: setStoreVehicleData,
    loadVehicleSizes,
    previousStep,
    nextStep,
    canProceedToNextStep,
    calculatePrice
  } = useBookingFlowStore()

  const { isCurrentStep } = useBookingStep(2)
  
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(!isExistingUser || userVehicles.length === 0)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [vehicleData, setVehicleData] = useState<VehicleDataResponse | null>(null)
  const [vehicleDataLoading, setVehicleDataLoading] = useState(false)
  const [vehicleDataError, setVehicleDataError] = useState<string | null>(null)
  const [vehicleForm, setVehicleForm] = useState({
    make: formData.vehicle?.make || '',
    model: formData.vehicle?.model || '',
    year: formData.vehicle?.year || new Date().getFullYear(),
    color: formData.vehicle?.color || '',
    registration: formData.vehicle?.registration || '',
    size: formData.vehicle?.size || 'M' as 'S' | 'M' | 'L' | 'XL',
    notes: formData.vehicle?.notes || '',
  })

  // Get available makes from vehicle data with safety checks and deduplication
  const availableMakes = vehicleData?.vehicles 
    ? [...new Set(vehicleData.vehicles.map(v => v.make))].sort() 
    : []

  // Get available models for selected make with safety checks and deduplication
  const availableModels = vehicleForm.make && vehicleData?.vehicles
    ? (() => {
        const models = vehicleData.vehicles.find(v => v.make === vehicleForm.make)?.models || []
        // Deduplicate models by name while preserving the first occurrence
        const uniqueModels = models.filter((model, index, array) => 
          array.findIndex(m => m.model === model.model) === index
        )
        return uniqueModels
      })()
    : []

  // Get available years for selected make/model with safety checks and deduplication
  const availableYears = vehicleForm.make && vehicleForm.model && availableModels.length > 0
    ? (() => {
        const years = availableModels.find(m => m.model === vehicleForm.model)?.years || []
        // Deduplicate years and sort them
        return [...new Set(years)].sort((a, b) => b - a)
      })()
    : []

  // Get size for selected make/model (auto-detection on model selection)
  const getVehicleSize = (make: string, model: string): 'S' | 'M' | 'L' | 'XL' => {
    try {
      if (!vehicleData?.vehicles || !make || !model) {
        return 'M' // Default fallback
      }
      
      const vehicleMake = vehicleData.vehicles.find(v => v.make === make)
      if (vehicleMake?.models) {
        const vehicleModel = vehicleMake.models.find(m => m.model === model)
        if (vehicleModel?.size) {
          return vehicleModel.size as 'S' | 'M' | 'L' | 'XL'
        }
      }
    } catch (error) {
      console.error('Error getting vehicle size:', error)
    }
    return 'M' // Default fallback
  }

  // Load vehicle data when component mounts
  useEffect(() => {
    if (isCurrentStep && !vehicleData && !vehicleDataLoading) {
      const loadVehicleData = async () => {
        setVehicleDataLoading(true)
        setVehicleDataError(null)
        
        try {
          const response = await fetch('/api/vehicle-data')
          const data = await response.json()
          
          if (data.success && data.data) {
            setVehicleData(data.data)
          } else {
            throw new Error(data.error?.message || 'Failed to load vehicle data')
          }
        } catch (error) {
          console.error('Error loading vehicle data:', error)
          setVehicleDataError(error instanceof Error ? error.message : 'Failed to load vehicle data')
        } finally {
          setVehicleDataLoading(false)
        }
      }
      
      loadVehicleData()
    }
  }, [isCurrentStep, vehicleData, vehicleDataLoading])

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
    setVehicleForm(prev => {
      const newForm = { ...prev, [field]: value }
      
      // Reset dependent fields when make changes
      if (field === 'make') {
        newForm.model = ''
        newForm.year = new Date().getFullYear()
        newForm.size = 'M' // Reset to default
      }
      
      // Auto-detect size and reset year when model changes
      if (field === 'model') {
        newForm.year = new Date().getFullYear()
        // Auto-detect size based on make/model selection
        if (newForm.make && value) {
          newForm.size = getVehicleSize(newForm.make, value)
        }
      }
      
      return newForm
    })
  }

  const handleExistingVehicleSelect = (vehicleId: string) => {
    try {
      const vehicle = userVehicles.find(v => v.id === vehicleId)
      if (!vehicle) {
        console.error('Vehicle not found:', vehicleId)
        return
      }

      setSelectedVehicleId(vehicleId)
      
      // Safely handle vehicle size data
      let vehicleSize: 'S' | 'M' | 'L' | 'XL' = 'M' // Default fallback
      if (vehicle.vehicle_size?.price_multiplier) {
        vehicleSize = getSizeNameFromMultiplier(vehicle.vehicle_size.price_multiplier)
      }

      setStoreVehicleData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        registration: vehicle.registration || '',
        size: vehicleSize,
        notes: vehicle.notes || ''
      })
      setShowNewVehicleForm(false)
    } catch (error) {
      console.error('Error selecting existing vehicle:', error)
      // Continue with default behavior - don't crash the component
    }
  }

  const handleNewVehicleSubmit = () => {
    if (vehicleForm.make && vehicleForm.model && vehicleForm.registration && vehicleForm.size) {
      setStoreVehicleData(vehicleForm)
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
  const getSizeNameFromMultiplier = (multiplier: number): 'S' | 'M' | 'L' | 'XL' => {
    if (multiplier <= 1.0) return 'S'
    if (multiplier <= 1.3) return 'M'
    if (multiplier <= 1.6) return 'L'
    return 'XL'
  }

  // Helper function to get size display info from database with safety checks
  const getSizeInfo = (sizeName: string) => {
    try {
      // Try to get from database first
      if (vehicleSizes?.length > 0) {
        const vehicleSize = vehicleSizes.find(size => 
          size?.name?.toLowerCase().replace(/\s+/g, '_') === sizeName?.toLowerCase()
        )
        
        if (vehicleSize) {
          return {
            id: vehicleSize.id,
            label: vehicleSize.name || sizeName,
            description: vehicleSize.description || 'Vehicle size',
            multiplier: vehicleSize.price_multiplier ? `${vehicleSize.price_multiplier}x` : '',
            examples: vehicleSize.examples || []
          }
        }
      }
      
      // Fallback to static size map with safety checks
      const sizeMap: Record<string, any> = {
        S: { label: 'Small', description: getVehicleSizeDescription('S'), multiplier: '', examples: [] },
        M: { label: 'Medium', description: getVehicleSizeDescription('M'), multiplier: '', examples: [] },
        L: { label: 'Large', description: getVehicleSizeDescription('L'), multiplier: '', examples: [] },
        XL: { label: 'Extra Large', description: getVehicleSizeDescription('XL'), multiplier: '', examples: [] }
      }
      
      return sizeMap[sizeName] || sizeMap.M
    } catch (error) {
      console.error('Error getting size info:', error)
      // Return safe fallback
      return {
        label: 'Medium',
        description: 'Medium sized vehicle',
        multiplier: '',
        examples: []
      }
    }
  }

  if (!isCurrentStep) {
    return <div></div>
  }

  // Show loading state while vehicle data is loading
  if (vehicleDataLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            Vehicle Details
          </h2>
          <p className="text-text-secondary text-lg">
            Tell us about your vehicle to ensure the best service
          </p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <span className="text-text-secondary">Loading vehicle database...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if vehicle data failed to load
  if (vehicleDataError && !vehicleData) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            Vehicle Details
          </h2>
          <p className="text-text-secondary text-lg">
            Tell us about your vehicle to ensure the best service
          </p>
        </div>
        
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="font-semibold text-red-600">Unable to Load Vehicle Database</h3>
            </div>
            <p className="text-red-600 mb-4">{vehicleDataError}</p>
            <Button
              onClick={() => {
                setVehicleDataError(null)
                // Trigger reload by resetting state
                const loadVehicleData = async () => {
                  setVehicleDataLoading(true)
                  setVehicleDataError(null)
                  
                  try {
                    const response = await fetch('/api/vehicle-data')
                    const data = await response.json()
                    
                    if (data.success && data.data) {
                      setVehicleData(data.data)
                    } else {
                      throw new Error(data.error?.message || 'Failed to load vehicle data')
                    }
                  } catch (error) {
                    console.error('Error loading vehicle data:', error)
                    setVehicleDataError(error instanceof Error ? error.message : 'Failed to load vehicle data')
                  } finally {
                    setVehicleDataLoading(false)
                  }
                }
                
                loadVehicleData()
              }}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-text-primary mb-2">Choose from your saved vehicles</h3>
            <p className="text-text-secondary">Select one of your previously saved vehicles for faster booking</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {userVehicles.map((vehicle) => {
              let sizeInfo
              try {
                const sizeName = vehicle.vehicle_size?.price_multiplier 
                  ? getSizeNameFromMultiplier(vehicle.vehicle_size.price_multiplier)
                  : 'M'
                sizeInfo = getSizeInfo(sizeName)
              } catch (error) {
                console.error('Error getting size info for vehicle:', vehicle.id, error)
                sizeInfo = getSizeInfo('M') // Safe fallback
              }
              const isSelected = selectedVehicleId === vehicle.id
              
              return (
                <Card
                  key={vehicle.id}
                  className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.02] min-h-[120px] ${
                    isSelected
                      ? 'border-brand-500 bg-brand-600/10 shadow-brand-lg ring-2 ring-brand-500/20'
                      : 'hover:border-brand-400 hover:shadow-purple hover:bg-brand-600/5'
                  }`}
                  onClick={() => handleExistingVehicleSelect(vehicle.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center min-h-[48px] min-w-[48px] touch-manipulation ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-400'
                        }`}>
                          <CarIcon className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-text-primary text-xl leading-tight mb-2">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-tertiary rounded-full text-sm font-medium text-text-secondary min-h-[32px]">
                              {sizeInfo.label} Vehicle
                            </span>
                            {vehicle.color && (
                              <span className="text-base text-text-secondary">• {vehicle.color}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center min-h-[48px] min-w-[48px] touch-manipulation">
                            <CheckIcon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Vehicle Details */}
                    <div className="space-y-3 mt-4">
                      {vehicle.registration && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-text-secondary uppercase tracking-wide min-w-[100px]">Registration:</span>
                          <span className="text-base font-mono bg-surface-secondary px-3 py-2 rounded text-text-primary min-h-[36px] flex items-center">
                            {vehicle.registration}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-text-secondary uppercase tracking-wide min-w-[100px]">Size:</span>
                        <span className="text-base text-text-primary">{sizeInfo.label}</span>
                        <span className="text-sm text-text-muted">({sizeInfo.multiplier} pricing)</span>
                      </div>
                      
                      {vehicle.notes && (
                        <div className="pt-3 border-t border-border-secondary/50">
                          <span className="text-sm font-medium text-text-secondary uppercase tracking-wide block mb-2">Notes:</span>
                          <p className="text-base text-text-secondary line-clamp-2">{vehicle.notes}</p>
                        </div>
                      )}
                    </div>
                    
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowNewVehicleForm(true)}
              leftIcon={<PlusIcon className="w-4 h-4" />}
              size="lg"
            >
              Add Different Vehicle
            </Button>
            <p className="text-xs text-text-muted mt-2">
              Don't see your vehicle? Add a new one for this booking.
            </p>
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
                <Select
                  value={vehicleForm.make}
                  onChange={(e) => handleFormChange('make', e.target.value)}
                  placeholder="Select make"
                  disabled={availableMakes.length === 0}
                >
                  <option value="">Select make</option>
                  {availableMakes.length > 0 ? (
                    availableMakes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading makes...</option>
                  )}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Model *
                </label>
                <Select
                  value={vehicleForm.model}
                  onChange={(e) => handleFormChange('model', e.target.value)}
                  placeholder="Select model"
                  disabled={!vehicleForm.make || availableModels.length === 0}
                >
                  <option value="">Select model</option>
                  {availableModels.length > 0 ? (
                    availableModels.map((model, index) => (
                      <option key={`${vehicleForm.make}-${model.model}-${index}`} value={model.model}>
                        {model.model}
                      </option>
                    ))
                  ) : vehicleForm.make ? (
                    <option value="" disabled>Loading models...</option>
                  ) : (
                    <option value="" disabled>Select make first</option>
                  )}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Registration *
                </label>
                <Input
                  value={vehicleForm.registration}
                  onChange={(e) => handleFormChange('registration', e.target.value.toUpperCase())}
                  placeholder="e.g., AB12 CDE"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Year <span className="text-text-muted">(optional)</span>
                </label>
                <Select
                  value={vehicleForm.year.toString()}
                  onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                  placeholder="Select year"
                  disabled={!vehicleForm.make || !vehicleForm.model || availableYears.length === 0}
                >
                  <option value="">Select year</option>
                  {availableYears.length > 0 ? (
                    availableYears.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))
                  ) : vehicleForm.make && vehicleForm.model ? (
                    <option value="" disabled>Loading years...</option>
                  ) : (
                    <option value="" disabled>Select make & model first</option>
                  )}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Color <span className="text-text-muted">(optional)</span>
                </label>
                <Input
                  value={vehicleForm.color}
                  onChange={(e) => handleFormChange('color', e.target.value)}
                  placeholder="e.g., White, Black, Silver"
                />
              </div>
            </div>

            {/* Vehicle Size Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Vehicle Size *
              </label>
              <p className="text-sm text-text-secondary mb-4">
                {vehicleForm.make && vehicleForm.model 
                  ? `Size automatically determined for ${vehicleForm.make} ${vehicleForm.model}. This affects service pricing.`
                  : 'This affects the service pricing. Select your vehicle make and model for automatic size detection.'
                }
              </p>
              
              {/* Simple size display */}
              <div className="bg-surface-secondary rounded-lg p-4 border border-border-secondary">
                <div>
                  <h4 className="font-medium text-text-primary">
                    {getSizeInfo(vehicleForm.size).label}
                  </h4>
                </div>
                
                {vehicleForm.make && vehicleForm.model && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-brand-600">
                    <CheckIcon className="w-4 h-4" />
                    <span>Auto-detected from vehicle selection</span>
                  </div>
                )}
                
                {!vehicleForm.make || !vehicleForm.model && (
                  <div className="mt-3 text-sm text-text-muted">
                    Select make and model above for automatic size detection
                  </div>
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
                disabled={!vehicleForm.make || !vehicleForm.model || !vehicleForm.registration || !vehicleForm.size}
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


      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          variant="outline"
          onClick={previousStep}
          leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
        >
          Back to Service Selection
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceedToNextStep() || isLoading}
          size="lg"
          rightIcon={<ChevronRightIcon className="w-4 h-4" />}
        >
          {isLoading ? 'Calculating Price...' : 'Continue to Time Selection'}
        </Button>
      </div>
    </div>
  )
}