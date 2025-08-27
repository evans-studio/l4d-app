'use client'

import { useState, useEffect } from 'react'
import { CreditCard, AlertTriangle, Send, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { logger } from '@/lib/utils/logger'
import { type AdminBooking } from '@/hooks/useRealTimeBookings'

interface PaymentSummaryProps {
  bookings: AdminBooking[]
  onRefreshBookings?: () => void
}

interface PaymentMetrics {
  pendingCount: number
  overdueCount: number
  totalRevenue: number
  overdueRevenue: number
}

export function PaymentSummary({ bookings, onRefreshBookings }: PaymentSummaryProps) {
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    pendingCount: 0,
    overdueCount: 0,
    totalRevenue: 0,
    overdueRevenue: 0
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [isProcessingReminders, setIsProcessingReminders] = useState(false)
  const [reminderResult, setReminderResult] = useState<{
    success: boolean
    sent: number
    processed: number
  } | null>(null)

  // Calculate payment metrics
  useEffect(() => {
    const now = new Date()
    const paymentBookings = bookings.filter(b => ['processing', 'payment_failed'].includes(b.status))
    
    let pendingCount = 0
    let overdueCount = 0
    let totalRevenue = 0
    let overdueRevenue = 0

    paymentBookings.forEach(booking => {
      totalRevenue += booking.total_price

      if (booking.status === 'processing') {
        // Check if overdue (48 hours after creation)
        const createdAt = new Date(booking.created_at)
        const hoursAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        
        if (hoursAgo > 48) {
          overdueCount++
          overdueRevenue += booking.total_price
        } else {
          pendingCount++
        }
      }
    })

    setMetrics({ pendingCount, overdueCount, totalRevenue, overdueRevenue })
  }, [bookings])

  const handleSendReminders = async () => {
    setIsProcessingReminders(true)
    setReminderResult(null)

    try {
      const response = await fetch('/api/admin/payment-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      
      if (result.success) {
        setReminderResult({
          success: true,
          sent: result.data.sent,
          processed: result.data.processed
        })
        
        // Refresh bookings if callback provided
        if (onRefreshBookings) {
          setTimeout(onRefreshBookings, 1000)
        }
      } else {
        setReminderResult({
          success: false,
          sent: 0,
          processed: 0
        })
      }
    } catch (error) {
      logger.error('Error sending payment reminders:', error)
      setReminderResult({
        success: false,
        sent: 0,
        processed: 0
      })
    } finally {
      setIsProcessingReminders(false)
    }
  }

  // Don't show if no payment-related bookings
  const totalPaymentBookings = metrics.pendingCount + metrics.overdueCount
  if (totalPaymentBookings === 0) {
    return null
  }

  return (
    <Card className={`mb-6 border-2 transition-all duration-200 ${
      metrics.overdueCount > 0 
        ? 'border-red-200 bg-red-50' 
        : 'border-blue-200 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        {/* Compact Summary Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              metrics.overdueCount > 0 ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {metrics.overdueCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CreditCard className="w-5 h-5 text-blue-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className={`font-medium ${
                  metrics.overdueCount > 0 ? 'text-red-800' : 'text-blue-800'
                }`}>
                  Payment Status:
                </span>
                
                {metrics.pendingCount > 0 && (
                  <span className="flex items-center gap-1 text-blue-700">
                    <Clock className="w-3 h-3" />
                    {metrics.pendingCount} Pending
                  </span>
                )}
                
                {metrics.overdueCount > 0 && (
                  <span className="flex items-center gap-1 text-red-700 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {metrics.overdueCount} Overdue
                  </span>
                )}
                
                <span className={`text-xs ${
                  metrics.overdueCount > 0 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  £{metrics.totalRevenue.toFixed(2)} total
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalPaymentBookings > 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminders}
                disabled={isProcessingReminders}
                className={`text-xs h-8 ${
                  metrics.overdueCount > 0
                    ? 'text-red-600 border-red-300 hover:bg-red-50'
                    : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Send className="w-3 h-3 mr-1" />
                {isProcessingReminders ? 'Sending...' : 'Send Reminders'}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-xs h-8 px-2 ${
                metrics.overdueCount > 0
                  ? 'text-red-600 border-red-300 hover:bg-red-50'
                  : 'text-blue-600 border-blue-300 hover:bg-blue-50'
              }`}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-700">{metrics.pendingCount}</div>
                <div className="text-xs text-blue-600">Pending Payments</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-red-700">{metrics.overdueCount}</div>
                <div className="text-xs text-red-600">Overdue Payments</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">£{(metrics.totalRevenue - metrics.overdueRevenue).toFixed(2)}</div>
                <div className="text-xs text-green-600">Pending Revenue</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-red-700">£{metrics.overdueRevenue.toFixed(2)}</div>
                <div className="text-xs text-red-600">At Risk Revenue</div>
              </div>
            </div>

            {/* Reminder Results */}
            {reminderResult && (
              <div className={`p-3 rounded-lg text-sm ${
                reminderResult.success 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {reminderResult.success ? (
                  <span>✅ Sent {reminderResult.sent} reminders out of {reminderResult.processed} overdue payments</span>
                ) : (
                  <span>❌ Failed to send payment reminders. Please try again.</span>
                )}
              </div>
            )}

            {/* Additional Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminders}
                disabled={isProcessingReminders}
                className={`text-xs h-7 ${
                  metrics.overdueCount > 0
                    ? 'text-red-600 border-red-300 hover:bg-red-50'
                    : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Send className="w-3 h-3 mr-1" />
                {isProcessingReminders ? 'Processing...' : 'Send All Reminders'}
              </Button>
              
              <div className={`text-xs px-3 py-2 rounded ${
                metrics.overdueCount > 0 ? 'text-red-700' : 'text-blue-700'
              }`}>
                💡 Reminders sent at 24h, 48h, and 72h intervals
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}