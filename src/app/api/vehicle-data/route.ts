import { NextResponse } from 'next/server'
import vehicleData from '@/data/vehicle-size-data.json'

export async function GET() {
  try {
    console.log('🚗 Vehicle data API called, loading vehicle size data...')
    console.log(`📊 Vehicle data contains ${vehicleData.vehicles?.length || 0} makes`)
    
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
    console.error('❌ Error loading vehicle data:', error)
    
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