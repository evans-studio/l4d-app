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
      <CardContent className="space-y-5">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-surface-tertiary rounded-lg">
            <div className="text-2xl font-bold text-brand-600 mb-1">{stats.totalBookings}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wide">Total Bookings</div>
          </div>
          <div className="text-center p-3 bg-surface-tertiary rounded-lg">
            <div className="text-lg font-bold text-text-primary mb-1">
              {formatCurrency(stats.totalSpent)}
            </div>
            <div className="text-xs text-text-secondary uppercase tracking-wide">Total Spent</div>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-center gap-3 p-3 bg-brand-600/5 rounded-lg border border-brand-600/10">
          <Clock className="w-5 h-5 text-brand-400" />
          <div>
            <p className="text-sm font-medium text-text-primary">Member since {formatDate(stats.memberSince)}</p>
          </div>
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

      </CardContent>
    </Card>
  )
}