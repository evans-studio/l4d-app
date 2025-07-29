'use client'

import { Card, CardContent } from '@/components/ui/composites/Card'
import { Calculator, Car, MapPin } from 'lucide-react'

interface PricingBreakdownProps {
  breakdown: {
    basePrice: number
    vehicleSize: string
    sizeMultiplier: number
    subtotal: number
    distanceKm?: number
    distanceSurcharge: number
    totalPrice: number
    calculation: string
  }
  showTitle?: boolean
  compact?: boolean
  className?: string
}

export function PricingBreakdown({ 
  breakdown, 
  showTitle = true, 
  compact = false,
  className = '' 
}: PricingBreakdownProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-semibold text-text-primary">
              Price Breakdown
            </h3>
          </div>
        )}

        <div className="space-y-3">
          {/* Base Service Price */}
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Base service price</span>
            <span className="text-text-primary font-medium">
              £{breakdown.basePrice.toFixed(2)}
            </span>
          </div>

          {/* Vehicle Size Multiplier */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-text-tertiary" />
              <span className="text-text-secondary">
                {breakdown.vehicleSize} ({breakdown.sizeMultiplier}x)
              </span>
            </div>
            <span className="text-text-primary">
              £{(breakdown.basePrice * breakdown.sizeMultiplier).toFixed(2)}
            </span>
          </div>

          {/* Distance Surcharge (if applicable) */}
          {breakdown.distanceKm && breakdown.distanceKm > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-text-tertiary" />
                <span className="text-text-secondary">
                  Distance surcharge ({breakdown.distanceKm.toFixed(1)}km)
                </span>
              </div>
              <span className="text-text-primary">
                £{breakdown.distanceSurcharge.toFixed(2)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border-primary my-3"></div>

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-text-primary">
              Total Price
            </span>
            <span className="text-xl font-bold text-brand-600">
              £{breakdown.totalPrice.toFixed(2)}
            </span>
          </div>

          {/* Calculation Formula (if not compact) */}
          {!compact && (
            <div className="mt-4 p-3 bg-surface-secondary rounded-lg">
              <p className="text-sm text-text-secondary mb-1">Calculation:</p>
              <p className="text-sm font-mono text-text-tertiary">
                {breakdown.calculation}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Simplified version for inline display
export function InlinePricingPreview({ 
  basePrice, 
  sizeMultiplier, 
  distanceSurcharge = 0, 
  vehicleSize,
  className = ''
}: {
  basePrice: number
  sizeMultiplier: number
  distanceSurcharge?: number
  vehicleSize: string
  className?: string
}) {
  const total = (basePrice * sizeMultiplier) + distanceSurcharge

  return (
    <div className={`flex items-center justify-between p-3 bg-brand-50 rounded-lg border border-brand-200 ${className}`}>
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-brand-600" />
        <span className="text-sm text-text-secondary">
          {vehicleSize} pricing
        </span>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-brand-600">
          £{total.toFixed(2)}
        </div>
        {distanceSurcharge > 0 && (
          <div className="text-xs text-text-tertiary">
            includes £{distanceSurcharge.toFixed(2)} distance
          </div>
        )}
      </div>
    </div>
  )
}