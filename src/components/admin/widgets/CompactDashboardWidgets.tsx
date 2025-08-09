'use client'

import { ArrowUp, ArrowDown, Minus, AlertTriangle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'

// TypeScript interfaces for the compact widgets
interface TodaysSchedule {
  stats: {
    total: number
    completed: number
    remaining: number
  }
  next: {
    time: string
    customer: string
    service: string
  } | null
  revenue: number
}

interface CustomerActivity {
  new: number
  returning: number
  latest: {
    name: string
    action: string
    timeAgo: string
  }
}

interface RevenuePulse {
  today: number
  week: number
  month: number
  trend: 'up' | 'down' | 'stable'
}

interface RequiresAction {
  count: number
  mostUrgent: {
    type: string
    message: string
    action: string
  }
}

interface CompactWidgetsProps {
  todaysSchedule: TodaysSchedule
  customerActivity: CustomerActivity
  revenuePulse: RevenuePulse
  requiresAction: RequiresAction
  onActionClick?: () => void
}

// Trend icon component
function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  switch (trend) {
    case 'up':
      return <ArrowUp className="w-3 h-3 text-green-500" />
    case 'down':
      return <ArrowDown className="w-3 h-3 text-red-500" />
    case 'stable':
      return <Minus className="w-3 h-3 text-gray-500" />
  }
}

export function CompactDashboardWidgets({ 
  todaysSchedule, 
  customerActivity, 
  revenuePulse, 
  requiresAction,
  onActionClick 
}: CompactWidgetsProps) {
  
  return (
    <div className="space-y-4">
      {/* Requires Action - Thin Banner (only show if count > 0) */}
      {requiresAction.count > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-orange-800">
                {requiresAction.count} Action{requiresAction.count > 1 ? 's' : ''} Required
              </span>
              <span className="text-sm text-orange-700 ml-2">
                {requiresAction.mostUrgent.message}
              </span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={onActionClick}
            className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0 ml-4"
          >
            {requiresAction.mostUrgent.action}
          </Button>
        </div>
      )}

      {/* Ultra-Compact Layout */}
      {/* Desktop - Single Row */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-8">
            
            {/* Today's Schedule */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-gray-900">Today:</span>
                  <span className="text-gray-600">
                    {todaysSchedule.stats.total} bookings • {todaysSchedule.stats.completed} done • £{todaysSchedule.revenue}
                  </span>
                </div>
              </div>
              {todaysSchedule.next && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Next:</span> {todaysSchedule.next.time} - {todaysSchedule.next.customer} - {todaysSchedule.next.service}
                </div>
              )}
            </div>

            {/* Customer Activity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-gray-900">Customers:</span>
                  <span className="text-gray-600">
                    {customerActivity.new} new • {customerActivity.returning} total
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Latest:</span> {customerActivity.latest.name} {customerActivity.latest.action} ({customerActivity.latest.timeAgo})
              </div>
            </div>

            {/* Revenue Pulse */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-gray-900">Revenue:</span>
                  <span className="text-gray-600">
                    £{revenuePulse.today}/£{revenuePulse.week.toLocaleString()}/£{revenuePulse.month.toLocaleString()}
                  </span>
                  <TrendIcon trend={revenuePulse.trend} />
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Today/Week/Month
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile - Stacked Compact Widgets */}
      <div className="lg:hidden space-y-3">
        
        {/* Today's Schedule - Mobile */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-16 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {todaysSchedule.stats.total} bookings • {todaysSchedule.stats.completed} done • £{todaysSchedule.revenue}
            </div>
            {todaysSchedule.next && (
              <div className="text-xs text-gray-600 mt-1">
                Next: {todaysSchedule.next.time} - {todaysSchedule.next.customer}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 text-right">
            [Today]
          </div>
        </div>

        {/* Revenue - Mobile */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-900">
              £{revenuePulse.today} / £{revenuePulse.week.toLocaleString()} / £{revenuePulse.month.toLocaleString()}
            </div>
            <TrendIcon trend={revenuePulse.trend} />
          </div>
          <div className="text-xs text-gray-500 text-right">
            [Revenue]
          </div>
        </div>

        {/* Customers - Mobile */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-16 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {customerActivity.new} new • {customerActivity.returning} this week
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {customerActivity.latest.name} {customerActivity.latest.action}
            </div>
          </div>
          <div className="text-xs text-gray-500 text-right">
            [Customers]
          </div>
        </div>

      </div>
    </div>
  )
}

// Individual compact widgets for more flexibility
export function TodaysScheduleWidget({ data }: { data: TodaysSchedule }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-20 flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-lg font-bold text-gray-900">
            {data.stats.total}
          </span>
          <span className="text-xs text-gray-600">
            • {data.stats.completed} done • {data.stats.remaining} left
          </span>
        </div>
        {data.next && (
          <div className="text-xs text-gray-600">
            Next: {data.next.time} - {data.next.customer}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-green-600">£{data.revenue}</div>
        <div className="text-xs text-gray-500">Revenue</div>
      </div>
    </div>
  )
}

export function CustomerActivityWidget({ data }: { data: CustomerActivity }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-20 flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-lg font-bold text-blue-600">{data.new}</span>
          <span className="text-xs text-gray-600">new</span>
          <span className="text-lg font-bold text-gray-900">{data.returning}</span>
          <span className="text-xs text-gray-600">total</span>
        </div>
        <div className="text-xs text-gray-600">
          Latest: {data.latest.name} {data.latest.action} ({data.latest.timeAgo})
        </div>
      </div>
    </div>
  )
}

export function RevenuePulseWidget({ data }: { data: RevenuePulse }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Today/Week/Month</span>
          <TrendIcon trend={data.trend} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-900">£{data.today}</div>
        <div className="text-sm font-bold text-gray-900">£{data.week.toLocaleString()}</div>
        <div className="text-sm font-bold text-gray-900">£{data.month.toLocaleString()}</div>
      </div>
    </div>
  )
}

export function RequiresActionWidget({ data, onActionClick }: { data: RequiresAction; onActionClick?: () => void }) {
  if (data.count === 0) return null
  
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-800">
          {data.count} Actions Required - {data.mostUrgent.message}
        </span>
      </div>
      <Button 
        size="sm" 
        variant="primary" 
        onClick={onActionClick}
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        Review Now &gt;
      </Button>
    </div>
  )
}