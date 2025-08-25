'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/primitives/Button'
import { 
  DollarSignIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CarIcon,
  PackageIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  PercentIcon,
  BarChart3Icon,
  EditIcon,
  Calculator
} from 'lucide-react'

interface VehicleSize {
  id: string
  name: string
  description: string
  multiplier: number
  sort_order: number
}

interface Service {
  id: string
  name: string
  base_price: number
  is_active: boolean
  category: string
}


interface PricingMatrix {
  [serviceId: string]: {
    [vehicleSizeId: string]: {
      price?: number
      profit_margin?: number
      cost_basis?: number
    }
  }
}

interface ProfitabilityData {
  service_id: string
  service_name: string
  avg_price: number
  total_bookings: number
  total_revenue: number
  avg_profit_margin: number
  cost_per_hour: number
  profitability_score: number
}

function ServicePricingPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [pricingMatrix, setPricingMatrix] = useState<PricingMatrix>({})
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'matrix' | 'bulk' | 'profitability'>('matrix')
  const [bulkAdjustment, setBulkAdjustment] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    applyTo: 'all' as 'all' | 'category' | 'service',
    categoryFilter: '',
    serviceFilter: ''
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadPricingData()
  }, [])

  const loadPricingData = async () => {
    try {
      setIsLoading(true)
      const [servicesResponse, vehicleSizesResponse, pricingResponse, profitabilityResponse] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/services/vehicle-sizes'),
        fetch('/api/admin/services/pricing'),
        fetch('/api/admin/services/profitability')
      ])

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        if (servicesData.success) {
          setServices(servicesData.data || [])
        }
      }

      if (vehicleSizesResponse.ok) {
        const vehicleSizesData = await vehicleSizesResponse.json()
        if (vehicleSizesData.success) {
          setVehicleSizes(vehicleSizesData.data || [])
        }
      }

      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json()
        if (pricingData.success) {
          setPricingMatrix(pricingData.data || {})
        }
      }

      if (profitabilityResponse.ok) {
        const profitabilityRes = await profitabilityResponse.json()
        if (profitabilityRes.success) {
          setProfitabilityData(profitabilityRes.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to load pricing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePricing = (serviceId: string, vehicleSizeId: string, field: string, value: number) => {
    setPricingMatrix(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [vehicleSizeId]: {
          ...prev[serviceId]?.[vehicleSizeId],
          [field]: value
        }
      }
    }))
    setHasUnsavedChanges(true)
  }

  const calculatePrice = (basePrice: number, multiplier: number, adjustment = 0) => {
    return Math.round((basePrice * multiplier + adjustment) * 100) / 100
  }

  const savePricingMatrix = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/services/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricingMatrix })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        // Reload profitability data
        const profitabilityResponse = await fetch('/api/admin/services/profitability')
        if (profitabilityResponse.ok) {
          const profitabilityRes = await profitabilityResponse.json()
          if (profitabilityRes.success) {
            setProfitabilityData(profitabilityRes.data || [])
          }
        }
      }
    } catch (error) {
      console.error('Failed to save pricing matrix:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const applyBulkAdjustment = () => {
    const filteredServices = services.filter(service => {
      if (bulkAdjustment.applyTo === 'all') return true
      if (bulkAdjustment.applyTo === 'category') return service.category === bulkAdjustment.categoryFilter
      if (bulkAdjustment.applyTo === 'service') return service.id === bulkAdjustment.serviceFilter
      return false
    })

    const newMatrix = { ...pricingMatrix }
    filteredServices.forEach(service => {
      vehicleSizes.forEach(size => {
        const currentPricing = newMatrix[service.id]?.[size.id]
        const currentPrice = currentPricing?.price ?? calculatePrice(service.base_price, size.multiplier)
        
        let newPrice: number
        if (bulkAdjustment.type === 'percentage') {
          newPrice = currentPrice * (1 + bulkAdjustment.value / 100)
        } else {
          newPrice = currentPrice + bulkAdjustment.value
        }

        if (!newMatrix[service.id]) newMatrix[service.id] = {}
        const serviceMatrix = newMatrix[service.id]
        if (serviceMatrix) {
          serviceMatrix[size.id] = {
            price: Math.round(newPrice * 100) / 100,
            profit_margin: currentPricing?.profit_margin ?? 0,
            cost_basis: currentPricing?.cost_basis ?? 0
          }
        }
      })
    })

    setPricingMatrix(newMatrix)
    setHasUnsavedChanges(true)
  }

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const getProfitabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/services">Services</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Pricing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Service Pricing Management</h1>
            <p className="text-text-secondary mt-2">Manage pricing matrices, bulk adjustments, and profitability analysis</p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => router.push('/admin/services')}>Back to Services</Button>
            <Button variant="outline" onClick={loadPricingData}>Refresh</Button>
            {hasUnsavedChanges && (
              <Button onClick={savePricingMatrix} disabled={isSaving} className="flex items-center gap-2">
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : null}
                Save Changes
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-surface-secondary rounded-lg border border-border-primary">
          <div className="flex border-b border-border-secondary">
            <button
              onClick={() => setSelectedTab('matrix')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                selectedTab === 'matrix'
                  ? 'border-b-2 border-brand-purple text-brand-purple bg-surface-hover'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <PackageIcon className="w-4 h-4 mr-2 inline" />
              Pricing Matrix
            </button>
            <button
              onClick={() => setSelectedTab('bulk')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                selectedTab === 'bulk'
                  ? 'border-b-2 border-brand-purple text-brand-purple bg-surface-hover'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <EditIcon className="w-4 h-4 mr-2 inline" />
              Bulk Adjustments
            </button>
            <button
              onClick={() => setSelectedTab('profitability')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                selectedTab === 'profitability'
                  ? 'border-b-2 border-brand-purple text-brand-purple bg-surface-hover'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <BarChart3Icon className="w-4 h-4 mr-2 inline" />
              Profitability Analysis
            </button>
          </div>

          <div className="p-6">
            {selectedTab === 'matrix' && (
              <>
                {hasUnsavedChanges && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-800 font-medium">You have unsaved changes</p>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-secondary">
                        <th className="text-left py-3 px-4 font-semibold text-text-primary">Service</th>
                        <th className="text-left py-3 px-4 font-semibold text-text-primary">Base Price</th>
                        {vehicleSizes.map(size => (
                          <th key={size.id} className="text-center py-3 px-4 font-semibold text-text-primary">
                            <div className="flex flex-col items-center gap-1">
                              <CarIcon className="w-4 h-4" />
                              <span>{size.name}</span>
                              <span className="text-xs text-text-secondary">{size.multiplier}x</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {services.map(service => (
                        <tr key={service.id} className="border-b border-border-secondary hover:bg-surface-hover">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-text-primary">{service.name}</p>
                              <p className="text-sm text-text-secondary">{service.category}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-text-primary font-semibold">
                            {formatCurrency(service.base_price)}
                          </td>
                          {vehicleSizes.map(size => {
                            const pricing = pricingMatrix[service.id]?.[size.id]
                            const calculatedPrice = calculatePrice(service.base_price, size.multiplier)
                            const currentPrice = pricing?.price ?? calculatedPrice
                            const profitMargin = pricing?.profit_margin ?? 0

                            return (
                              <td key={size.id} className="py-4 px-4">
                                <div className="space-y-2">
                                  <div className="relative">
                                    <DollarSignIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-text-secondary" />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={currentPrice}
                                      onChange={(e) => updatePricing(service.id, size.id, 'price', parseFloat(e.target.value) || 0)}
                                      className="w-full pl-6 pr-2 py-1 text-sm bg-surface-primary border border-border-secondary rounded focus:border-brand-400 focus:outline-none"
                                    />
                                  </div>
                                  <div className="relative">
                                    <PercentIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-text-secondary" />
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={profitMargin}
                                      onChange={(e) => updatePricing(service.id, size.id, 'profit_margin', parseFloat(e.target.value) || 0)}
                                      placeholder="Margin %"
                                      className="w-full pl-6 pr-2 py-1 text-sm bg-surface-primary border border-border-secondary rounded focus:border-brand-400 focus:outline-none"
                                    />
                                  </div>
                                  {currentPrice !== calculatedPrice && (
                                    <div className="flex items-center gap-1">
                                      {currentPrice > calculatedPrice ? (
                                        <TrendingUpIcon className="w-3 h-3 text-green-600" />
                                      ) : (
                                        <TrendingDownIcon className="w-3 h-3 text-red-600" />
                                      )}
                                      <span className="text-xs text-text-secondary">
                                        {formatCurrency(Math.abs(currentPrice - calculatedPrice))}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {selectedTab === 'bulk' && (
              <div className="space-y-6">
                <div className="bg-surface-primary rounded-lg p-6 border border-border-secondary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Bulk Price Adjustment</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Adjustment Type
                      </label>
                      <select
                        value={bulkAdjustment.type}
                        onChange={(e) => setBulkAdjustment(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                        className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded text-text-primary focus:border-brand-400 focus:outline-none"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {bulkAdjustment.type === 'percentage' ? 'Percentage Change' : 'Fixed Amount'}
                      </label>
                      <div className="relative">
                        {bulkAdjustment.type === 'percentage' ? (
                          <PercentIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        ) : (
                          <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        )}
                        <input
                          type="number"
                          step="0.1"
                          value={bulkAdjustment.value}
                          onChange={(e) => setBulkAdjustment(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                          className={`w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded text-text-primary focus:border-brand-400 focus:outline-none ${
                            bulkAdjustment.type === 'fixed' ? 'pl-9' : 'pr-9'
                          }`}
                          placeholder={bulkAdjustment.type === 'percentage' ? '10' : '5.00'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Apply To
                      </label>
                      <select
                        value={bulkAdjustment.applyTo}
                        onChange={(e) => setBulkAdjustment(prev => ({ ...prev, applyTo: e.target.value as 'all' | 'category' | 'service' }))}
                        className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded text-text-primary focus:border-brand-400 focus:outline-none"
                      >
                        <option value="all">All Services</option>
                        <option value="category">By Category</option>
                        <option value="service">Single Service</option>
                      </select>
                    </div>

                    <div>
                      <Button
                        onClick={applyBulkAdjustment}
                        className="w-full mt-6 flex items-center justify-center gap-2"
                        disabled={bulkAdjustment.value === 0}
                      >
                        <Calculator className="w-4 h-4" />
                        Apply Adjustment
                      </Button>
                    </div>
                  </div>

                  {bulkAdjustment.applyTo === 'category' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Select Category
                      </label>
                      <select
                        value={bulkAdjustment.categoryFilter}
                        onChange={(e) => setBulkAdjustment(prev => ({ ...prev, categoryFilter: e.target.value }))}
                        className="w-full max-w-sm px-3 py-2 bg-surface-secondary border border-border-secondary rounded text-text-primary focus:border-brand-400 focus:outline-none"
                      >
                        <option value="">Select a category</option>
                        {[...new Set(services.map(s => s.category))].map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {bulkAdjustment.applyTo === 'service' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Select Service
                      </label>
                      <select
                        value={bulkAdjustment.serviceFilter}
                        onChange={(e) => setBulkAdjustment(prev => ({ ...prev, serviceFilter: e.target.value }))}
                        className="w-full max-w-sm px-3 py-2 bg-surface-secondary border border-border-secondary rounded text-text-primary focus:border-brand-400 focus:outline-none"
                      >
                        <option value="">Select a service</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>{service.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'profitability' && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {profitabilityData.map(data => (
                    <div
                      key={data.service_id}
                      className="bg-surface-primary rounded-lg p-6 border border-border-secondary"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">{data.service_name}</h3>
                          <p className="text-text-secondary text-sm">{data.total_bookings} bookings total</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getProfitabilityColor(data.profitability_score)}`}>
                            {data.profitability_score.toFixed(0)}
                          </p>
                          <p className="text-text-secondary text-sm">Profitability Score</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-surface-secondary rounded">
                          <p className="text-text-secondary text-sm">Avg. Price</p>
                          <p className="text-lg font-semibold text-text-primary">
                            {formatCurrency(data.avg_price)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-surface-secondary rounded">
                          <p className="text-text-secondary text-sm">Total Revenue</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(data.total_revenue)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-surface-secondary rounded">
                          <p className="text-text-secondary text-sm">Avg. Margin</p>
                          <p className="text-lg font-semibold text-text-primary">
                            {formatPercentage(data.avg_profit_margin)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-surface-secondary rounded">
                          <p className="text-text-secondary text-sm">Cost/Hour</p>
                          <p className="text-lg font-semibold text-text-primary">
                            {formatCurrency(data.cost_per_hour)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {profitabilityData.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3Icon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Profitability Data</h3>
                    <p className="text-text-secondary">Complete some bookings to see profitability analysis.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default function ServicePricingPageWithProtection() {
  return (
    <AdminRoute>
      <ServicePricingPage />
    </AdminRoute>
  )
}