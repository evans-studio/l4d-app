import { NextResponse } from 'next/server'
import vehicleData from '@/data/vehicle-size-data.json'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    logger.debug('🚗 Vehicle data API called, loading vehicle size data...')
    logger.debug(`📊 Vehicle data contains ${vehicleData.vehicles?.length || 0} makes`)
    
    // Return the vehicle data with proper API response format
    return NextResponse.json({
      success: true,
      data: vehicleData,
      metadata: {
        timestamp: new Date().toISOString(),
        totalMakes: vehicleData.vehicles.length,
        dataVersion: '1.0'
      }
    })
  } catch (error) {
    logger.error('❌ Error loading vehicle data:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to load vehicle data',
          code: 'VEHICLE_DATA_ERROR'
        }
      },
      { status: 500 }
    )
  }
}