/**
 * Monitoring Dashboard Component for Love4Detailing
 * 
 * Provides real-time monitoring of application health, performance,
 * and business metrics with alert management capabilities.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { Badge } from '@/components/ui/primitives/Badge'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  BarChart3,
  Shield,
  Zap,
  Server,
  Users
} from 'lucide-react'
import { alertManager, type Alert, type AlertSeverity, type AlertCategory } from '@/lib/monitoring/alert-manager'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'

interface MonitoringStats {
  activeAlerts: number
  resolvedToday: number
  avgResponseTime: number
  errorRate: number
  uptime: number
  totalBookings: number
}

interface MetricCard {
  id: string
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  category: AlertCategory
  severity?: AlertSeverity
}

export function MonitoringDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<MonitoringStats>({
    activeAlerts: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    errorRate: 0,
    uptime: 99.9,
    totalBookings: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'all'>('all')
  const [showResolved, setShowResolved] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch monitoring data
  useEffect(() => {
    const fetchData = async () => {
      if (!alertManager) return

      try {
        const activeAlerts = alertManager.getActiveAlerts()
        const alertHistory = alertManager.getAlertHistory(24)
        
        setAlerts(showResolved ? alertHistory : activeAlerts)
        
        // Update stats
        const resolvedToday = alertHistory.filter(a => a.resolved).length
        setStats(prev => ({
          ...prev,
          activeAlerts: activeAlerts.length,
          resolvedToday,
          // In a real app, these would come from your backend
          avgResponseTime: Math.random() * 1000 + 200,
          errorRate: Math.random() * 0.05,
        }))
        
        setLoading(false)
      } catch (error) {
        logger.error('Failed to fetch monitoring data:', error)
        setLoading(false)
      }
    }

    fetchData()

    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showResolved, autoRefresh])

  const handleRefresh = () => {
    setLoading(true)
    // Trigger data fetch
    setTimeout(() => setLoading(false), 1000)
  }

  const filteredAlerts = selectedCategory === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.category === selectedCategory)

  const metricCards: MetricCard[] = [
    {
      id: 'active_alerts',
      title: 'Active Alerts',
      value: stats.activeAlerts,
      change: -2,
      trend: 'down',
      icon: AlertTriangle,
      category: 'error',
      severity: stats.activeAlerts > 0 ? 'warning' : undefined
    },
    {
      id: 'response_time',
      title: 'Avg Response Time',
      value: `${Math.round(stats.avgResponseTime)}ms`,
      change: -5.2,
      trend: 'down',
      icon: Clock,
      category: 'performance'
    },
    {
      id: 'error_rate',
      title: 'Error Rate',
      value: `${(stats.errorRate * 100).toFixed(2)}%`,
      change: 0.1,
      trend: 'up',
      icon: Shield,
      category: 'error',
      severity: stats.errorRate > 0.05 ? 'warning' : undefined
    },
    {
      id: 'uptime',
      title: 'Uptime',
      value: `${stats.uptime}%`,
      change: 0.0,
      trend: 'stable',
      icon: Server,
      category: 'infrastructure'
    },
    {
      id: 'bookings_today',
      title: "Today's Bookings",
      value: stats.totalBookings,
      change: 12,
      trend: 'up',
      icon: Users,
      category: 'business'
    },
    {
      id: 'resolved_today',
      title: 'Resolved Today',
      value: stats.resolvedToday,
      change: 3,
      trend: 'up',
      icon: CheckCircle,
      category: 'error'
    }
  ]

  const categoryFilters: { value: AlertCategory | 'all'; label: string; icon: React.ComponentType<any> }[] = [
    { value: 'all', label: 'All Categories', icon: Activity },
    { value: 'performance', label: 'Performance', icon: Zap },
    { value: 'error', label: 'Errors', icon: AlertTriangle },
    { value: 'business', label: 'Business', icon: BarChart3 },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'infrastructure', label: 'Infrastructure', icon: Server }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Heading size="h1" color="white" className="mb-2">
            System Monitoring
          </Heading>
          <Text size="base" color="secondary">
            Real-time monitoring of application health and performance
          </Text>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'primary' : 'outline'}
            size="sm"
            leftIcon={autoRefresh ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          >
            Auto Refresh
          </Button>
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric) => (
          <Card key={metric.id} className="border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  metric.severity === 'warning' ? 'bg-yellow-900/20' : 'bg-blue-900/20'
                )}>
                  <metric.icon className={cn(
                    "w-5 h-5",
                    metric.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                  )} />
                </div>
                
                {metric.severity && (
                  <Badge variant={metric.severity === 'warning' ? 'warning' : 'success'} size="sm">
                    {metric.severity}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <Text size="sm" color="secondary">
                  {metric.title}
                </Text>
                <div className="flex items-center justify-between">
                  <Heading size="h3" color="white">
                    {metric.value}
                  </Heading>
                  <div className="flex items-center gap-1">
                    {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                    {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                    {metric.trend === 'stable' && <div className="w-4 h-0.5 bg-gray-400" />}
                    <Text size="sm" className={cn(
                      metric.trend === 'up' ? 'text-green-400' :
                      metric.trend === 'down' ? 'text-red-400' :
                      'text-gray-400'
                    )}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </Text>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <Heading size="h3" color="white">
                Alerts & Notifications
              </Heading>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowResolved(!showResolved)}
                variant="ghost"
                size="sm"
                leftIcon={showResolved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              >
                {showResolved ? 'Hide Resolved' : 'Show Resolved'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="w-4 h-4" />}
              >
                Configure
              </Button>
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categoryFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedCategory(filter.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedCategory === filter.value
                    ? "bg-brand-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                )}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <Text size="base" color="secondary" className="ml-3">
                Loading alerts...
              </Text>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <Heading size="h4" color="white" className="mb-2">
                No alerts found
              </Heading>
              <Text size="base" color="secondary">
                {showResolved 
                  ? "No resolved alerts in the selected timeframe"
                  : "All systems are operating normally"
                }
              </Text>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Individual Alert Card Component
 */
function AlertCard({ alert }: { alert: Alert }) {
  const severityColors = {
    info: 'border-blue-500 bg-blue-900/10',
    warning: 'border-yellow-500 bg-yellow-900/10',
    error: 'border-red-500 bg-red-900/10',
    critical: 'border-red-600 bg-red-900/20'
  }

  const severityIcons = {
    info: <Activity className="w-4 h-4 text-blue-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    error: <AlertTriangle className="w-4 h-4 text-red-400" />,
    critical: <AlertTriangle className="w-4 h-4 text-red-500" />
  }

  return (
    <div className={cn(
      "border-l-4 p-4 rounded-r-lg",
      alert.resolved 
        ? "border-green-500 bg-green-900/10" 
        : severityColors[alert.severity]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {alert.resolved ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              severityIcons[alert.severity]
            )}
            
            <Heading size="h5" color="white">
              {alert.name}
            </Heading>
            
            <Badge 
              variant={alert.resolved ? 'success' : alert.severity === 'critical' ? 'error' : 'warning'} 
              size="sm"
            >
              {alert.resolved ? 'RESOLVED' : alert.severity.toUpperCase()}
            </Badge>
            
            <Badge variant="secondary" size="sm">
              {alert.category}
            </Badge>
          </div>
          
          <Text size="sm" color="secondary" className="mb-3">
            {alert.message}
          </Text>
          
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>
              {new Date(alert.timestamp).toLocaleString()}
            </span>
            {!alert.resolved && (
              <span>
                Threshold: {alert.threshold} | Current: {alert.value.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}