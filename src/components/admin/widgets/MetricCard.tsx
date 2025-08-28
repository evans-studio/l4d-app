'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    label: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon: LucideIcon
  iconColor?: string
  loading?: boolean
  onClick?: () => void
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-brand-purple',
  loading = false,
  onClick
}: MetricCardProps) {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatValue = (val: string | number) => {
    if (loading) return '---'
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toLocaleString()
    }
    return val
  }

  return (
    <Card 
      variant={onClick ? 'interactive' : 'default'}
      clickable={!!onClick}
      onClick={onClick}
      className="relative overflow-hidden"
    >
      <CardContent className="p-6">
        {loading && (
          <div className="absolute inset-0 bg-surface-primary/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full"></div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-text-secondary text-sm font-medium mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-text-primary mb-2">
              {formatValue(value)}
            </p>
            
            {change && (
              <div className={`flex items-center text-sm ${getTrendColor(change.trend)}`}>
                <span className="mr-1">
                  {change.trend === 'up' && '↗'}
                  {change.trend === 'down' && '↘'}
                  {change.trend === 'neutral' && '→'}
                </span>
                <span className="font-medium">
                  {change.value >= 0 ? '+' : ''}{change.value.toFixed(1)}%
                </span>
                <span className="text-text-secondary ml-2">
                  {change.label}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-full bg-surface-hover ${iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}