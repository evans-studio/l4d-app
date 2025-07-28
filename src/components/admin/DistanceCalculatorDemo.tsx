'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { Badge } from '@/components/ui/primitives/Badge'
import { MapPin, Clock, Calculator, TrendingUp, Loader2 } from 'lucide-react'
import { calculateDistance, calculateTravelSurcharge, isWithinServiceArea } from '@/lib/services/distance'

interface DistanceResult {
  distance: number
  duration: number
  success: boolean
  provider: 'google' | 'mapbox' | 'haversine'
  error?: string
}

export function DistanceCalculatorDemo() {
  const [fromPostcode, setFromPostcode] = useState('SW1A 1AA') // Buckingham Palace
  const [toPostcode, setToPostcode] = useState('EC1A 1BB') // London
  const [result, setResult] = useState<DistanceResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<Array<{
    from: string
    to: string
    result: DistanceResult
    timestamp: string
  }>>([])

  const handleCalculate = async () => {
    if (!fromPostcode.trim() || !toPostcode.trim()) {
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const distanceResult = await calculateDistance(fromPostcode.trim(), toPostcode.trim())
      setResult(distanceResult)

      // Add to history
      setHistory(prev => [{
        from: fromPostcode.trim(),
        to: toPostcode.trim(),
        result: distanceResult,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 4)]) // Keep last 5 calculations

    } catch (error) {
      console.error('Distance calculation error:', error)
      setResult({
        distance: 0,
        duration: 0,
        success: false,
        provider: 'haversine',
        error: 'Calculation failed'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getProviderBadge = (provider: string) => {
    const variants = {
      google: 'default',
      mapbox: 'secondary',
      haversine: 'outline'
    } as const

    return (
      <Badge variant={variants[provider as keyof typeof variants] || 'outline'}>
        {provider.charAt(0).toUpperCase() + provider.slice(1)}
      </Badge>
    )
  }

  const formatPostcode = (postcode: string) => {
    return postcode.toUpperCase().replace(/\s+/g, ' ').trim()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Distance Calculator Demo
          </h3>
          <p className="text-sm text-muted-foreground">
            Test the multi-provider distance calculation system with UK postcodes
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Postcode</label>
              <Input
                placeholder="e.g. SW1A 1AA"
                value={fromPostcode}
                onChange={(e) => setFromPostcode(formatPostcode(e.target.value))}
                className="uppercase"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Postcode</label>
              <Input
                placeholder="e.g. EC1A 1BB"
                value={toPostcode}
                onChange={(e) => setToPostcode(formatPostcode(e.target.value))}
                className="uppercase"
              />
            </div>
          </div>

          <Button 
            onClick={handleCalculate}
            disabled={isLoading || !fromPostcode.trim() || !toPostcode.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Calculate Distance
              </>
            )}
          </Button>

          {result && (
            <div className="mt-6 p-4 border rounded-lg">
              {result.success ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Calculation Result</h4>
                    {getProviderBadge(result.provider)}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-2xl font-bold">{result.distance}</span>
                        <span className="text-sm text-muted-foreground ml-1">km</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Distance</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-2xl font-bold">{result.duration}</span>
                        <span className="text-sm text-muted-foreground ml-1">min</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Travel Surcharge:</span>
                      <span className="font-medium">
                        £{calculateTravelSurcharge(result.distance).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Within Service Area:</span>
                      <Badge variant={isWithinServiceArea(result.distance) ? 'success' : 'error'}>
                        {isWithinServiceArea(result.distance) ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-red-600 mb-2">❌ Calculation Failed</div>
                  <p className="text-sm text-muted-foreground">
                    {result.error || 'Unable to calculate distance'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Provider: {result.provider}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Calculations
            </h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">
                      {item.from} → {item.to}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {item.result.success ? (
                    <div className="text-right">
                      <div className="font-medium">{item.result.distance}km</div>
                      <div className="text-xs text-muted-foreground">
                        {item.result.duration}min • {getProviderBadge(item.result.provider)}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="error">Failed</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h4 className="font-medium">Provider Configuration</h4>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Google Maps API:</span>
              <Badge variant={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'success' : 'error'}>
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Configured' : 'Not Set'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Mapbox API:</span>
              <Badge variant={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? 'success' : 'error'}>
                {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? 'Configured' : 'Not Set'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Haversine Fallback:</span>
              <Badge variant="success">Always Available</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            The system tries Google Maps first, then Mapbox, then falls back to Haversine formula with UK postcode geocoding.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}