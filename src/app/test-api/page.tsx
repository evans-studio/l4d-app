'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'

interface ApiResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  data?: any
  error?: any
  duration: number
}

export default function TestApiPage() {
  const [results, setResults] = useState<ApiResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any): Promise<ApiResult> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      return {
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? data : undefined,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        endpoint,
        method,
        status: 0,
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
        duration,
      }
    }
  }

  const runAllTests = async () => {
    setIsLoading(true)
    setResults([])

    const tests = [
      // Health check
      { endpoint: '/api/health', method: 'GET' },
      
      // Services endpoints
      { endpoint: '/api/services', method: 'GET' },
      { endpoint: '/api/services/categories', method: 'GET' },
      { endpoint: '/api/services/vehicle-sizes', method: 'GET' },
      
      // Pricing endpoints
      { endpoint: '/api/pricing/rules', method: 'GET' },
      { 
        endpoint: '/api/pricing/distance', 
        method: 'POST',
        body: { postcode: 'NG5 1FB' }
      },
      {
        endpoint: '/api/pricing/calculate',
        method: 'POST',
        body: {
          serviceId: '550e8400-e29b-41d4-a716-446655440000', // Mock UUID
          vehicleSizeId: '550e8400-e29b-41d4-a716-446655440001', // Mock UUID
          distanceKm: 3
        }
      },
      
      // Auth endpoints (these will likely fail without authentication)
      { endpoint: '/api/auth/me', method: 'GET' },
    ]

    const testResults: ApiResult[] = []

    for (const test of tests) {
      const result = await testEndpoint(test.endpoint, test.method, test.body)
      testResults.push(result)
      setResults([...testResults])
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  const getStatusColor = (status: number, success: boolean) => {
    if (status === 0) return 'text-gray-500'
    if (success) return 'text-green-600'
    if (status >= 400 && status < 500) return 'text-yellow-600'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Test Console</h1>
        
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={runAllTests} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          <Button 
            onClick={clearResults}
            variant="outline"
            disabled={isLoading}
          >
            Clear Results
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            
            <div className="grid gap-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {result.method}
                      </span>
                      <span className="font-medium">{result.endpoint}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${getStatusColor(result.status, result.success)}`}>
                        {result.status || 'ERROR'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {result.duration}ms
                      </span>
                    </div>
                  </div>

                  {result.success && result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-green-600 hover:text-green-700">
                        ✓ Success - Show Response
                      </summary>
                      <pre className="mt-2 p-3 bg-green-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}

                  {!result.success && result.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-red-600 hover:text-red-700">
                        ✗ Error - Show Details
                      </summary>
                      <pre className="mt-2 p-3 bg-red-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Summary</h3>
              <div className="flex gap-6 text-sm">
                <span className="text-green-600">
                  ✓ Passed: {results.filter(r => r.success).length}
                </span>
                <span className="text-red-600">
                  ✗ Failed: {results.filter(r => !r.success).length}
                </span>
                <span className="text-gray-600">
                  Total: {results.length}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Notes</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Some endpoints may return 401/403 errors if authentication is required</li>
            <li>• Service and vehicle size UUIDs are mocked - actual data may not exist</li>
            <li>• Distance calculation uses mock postcode data for development</li>
            <li>• All API responses follow the standardized format with success/error handling</li>
          </ul>
        </div>
      </div>
    </div>
  )
}