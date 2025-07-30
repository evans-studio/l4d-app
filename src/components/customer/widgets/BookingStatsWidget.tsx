'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { 
  TrendingUp, 
  Calendar, 
  Clock,
  Star,
  PoundSterling
} from 'lucide-react'

interface BookingStatsWidgetProps {
  stats: {
    totalBookings: number
    memberSince: string
    totalSpent: number
    favoriteService?: {
      name: string
      count: number
    }
  }
}

export function BookingStatsWidget({ stats }: BookingStatsWidgetProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-400" />
          Your Stats
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Bookings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-brand-400" />
            </div>
            <span className="text-sm text-text-secondary">Total Bookings</span>
          </div>
          <span className="text-lg font-bold text-text-primary">{stats.totalBookings}</span>
        </div>

        {/* Member Since */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success-600/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-success-400" />
            </div>
            <span className="text-sm text-text-secondary">Member Since</span>
          </div>
          <span className="text-sm font-medium text-text-primary">
            {formatDate(stats.memberSince)}
          </span>
        </div>

        {/* Total Spent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning-600/10 flex items-center justify-center">
              <PoundSterling className="w-4 h-4 text-warning-400" />
            </div>
            <span className="text-sm text-text-secondary">Total Spent</span>
          </div>
          <span className="text-lg font-bold text-text-primary">
            {formatCurrency(stats.totalSpent)}
          </span>
        </div>

        {/* Favorite Service */}
        {stats.favoriteService && (
          <div className="bg-surface-tertiary rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-warning-400" />
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                Favorite Service
              </span>
            </div>
            <p className="font-medium text-text-primary text-sm">
              {stats.favoriteService.name}
            </p>
            <p className="text-xs text-text-muted">
              Booked {stats.favoriteService.count} time{stats.favoriteService.count > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Achievement Badge */}
        {stats.totalBookings >= 5 && (
          <div className="bg-gradient-to-r from-brand-600/10 to-brand-400/10 rounded-lg p-3 border border-brand-500/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
                <Star className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-400">Loyal Customer</p>
                <p className="text-xs text-text-muted">5+ bookings completed</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}