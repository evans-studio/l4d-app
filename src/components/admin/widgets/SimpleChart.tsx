'use client'

import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface SimpleChartProps {
  title: string
  data: ChartDataPoint[]
  type: 'bar' | 'line' | 'pie' | 'area'
  height?: number
  showValues?: boolean
  loading?: boolean
}

export function SimpleChart({
  title,
  data,
  type,
  height = 300,
  showValues = true,
  loading = false
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  const getBarColor = (index: number, customColor?: string) => {
    if (customColor) return customColor
    const colors = [
      'bg-brand-purple',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500'
    ]
    return colors[index % colors.length]
  }

  const BarChart = () => (
    <div className="flex items-end justify-between gap-2 px-4" style={{ height: height - 60 }}>
      {data.map((item, index) => {
        const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        return (
          <div key={item.label} className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
              {showValues && item.value > 0 && (
                <span className="text-xs text-text-secondary mb-1">
                  {item.value.toLocaleString()}
                </span>
              )}
              <div
                className={`w-full rounded-t ${getBarColor(index, item.color)} transition-all duration-500 hover:opacity-80`}
                style={{ height: `${heightPercent}%`, minHeight: item.value > 0 ? '4px' : '0px' }}
              />
            </div>
            <span className="text-xs text-text-secondary mt-2 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )

  const LineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = maxValue > 0 ? 100 - (item.value / maxValue) * 80 : 50
      return { x, y, value: item.value, label: item.label }
    })

    return (
      <div className="relative px-4" style={{ height: height - 60 }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeOpacity="0.1" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Line */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-brand-purple"
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
          />
          
          {/* Points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="currentColor"
              className="text-brand-purple hover:scale-125 transition-transform cursor-pointer"
            />
          ))}
        </svg>
        
        {/* Labels */}
        <div className="absolute bottom-0 left-4 right-4 flex justify-between">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-text-secondary">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const PieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0
    
    return (
      <div className="flex items-center justify-center" style={{ height: height - 60 }}>
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = total > 0 ? item.value / total : 0
              const angle = percentage * 360
              const largeArcFlag = angle > 180 ? 1 : 0
              
              const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180)
              const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180)
              const endX = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180)
              const endY = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180)
              
              currentAngle += angle
              
              if (percentage === 0) return null
              
              return (
                <path
                  key={index}
                  d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                  className={`${(getBarColor(index, item.color) || 'bg-gray-500').replace('bg-', 'fill-')} hover:opacity-80 transition-opacity cursor-pointer`}
                />
              )
            })}
          </svg>
          
          {/* Legend */}
          <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className={`w-3 h-3 rounded-full mr-2 ${getBarColor(index, item.color) || 'bg-gray-500'}`} />
                <span className="text-text-secondary">
                  {item.label}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const AreaChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = maxValue > 0 ? 100 - (item.value / maxValue) * 70 : 50
      return { x, y, value: item.value, label: item.label }
    })

    return (
      <div className="relative px-4" style={{ height: height - 60 }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Area fill */}
          <path
            d={`M0,100 ${points.map(p => `L${p.x},${p.y}`).join(' ')} L100,100 Z`}
            fill="currentColor"
            className="text-brand-purple opacity-20"
          />
          
          {/* Line */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-brand-purple"
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
          />
        </svg>
        
        {/* Labels */}
        <div className="absolute bottom-0 left-4 right-4 flex justify-between">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-text-secondary">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <BarChart />
      case 'line':
        return <LineChart />
      case 'pie':
        return <PieChart />
      case 'area':
        return <AreaChart />
      default:
        return <BarChart />
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="animate-spin w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-text-secondary">No data available</p>
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  )
}