/**
 * Alert Management System for Love4Detailing
 * 
 * Centralized alerting system that monitors application health,
 * performance, and business metrics with intelligent thresholds.
 */

import { analytics } from '@/lib/analytics/google-analytics'

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

// Alert categories
export type AlertCategory = 
  | 'performance' 
  | 'error' 
  | 'business' 
  | 'security' 
  | 'infrastructure'

// Alert configuration interface
export interface AlertRule {
  id: string
  name: string
  category: AlertCategory
  severity: AlertSeverity
  threshold: number
  timeWindow: number // minutes
  enabled: boolean
  description: string
}

// Alert instance interface
export interface Alert {
  id: string
  ruleId: string
  name: string
  category: AlertCategory
  severity: AlertSeverity
  message: string
  value: number
  threshold: number
  timestamp: number
  resolved: boolean
  metadata?: Record<string, any>
}

// Alert notification channels
export interface NotificationChannel {
  type: 'email' | 'webhook' | 'console'
  config: {
    email?: string
    webhookUrl?: string
    enabled: boolean
  }
}

/**
 * Alert Manager Class
 */
export class AlertManager {
  private static instance: AlertManager
  private alerts: Map<string, Alert> = new Map()
  private rules: Map<string, AlertRule> = new Map()
  private metrics: Map<string, Array<{ value: number; timestamp: number }>> = new Map()
  private channels: NotificationChannel[] = []

  constructor() {
    this.setupDefaultRules()
    this.setupNotificationChannels()
    this.startMetricsCollection()
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultRules() {
    const defaultRules: AlertRule[] = [
      // Performance Alerts
      {
        id: 'page_load_time',
        name: 'High Page Load Time',
        category: 'performance',
        severity: 'warning',
        threshold: 3000, // 3 seconds
        timeWindow: 5,
        enabled: true,
        description: 'Page load time exceeds acceptable threshold'
      },
      {
        id: 'api_response_time',
        name: 'Slow API Response',
        category: 'performance',
        severity: 'warning',
        threshold: 2000, // 2 seconds
        timeWindow: 5,
        enabled: true,
        description: 'API response time is too high'
      },
      {
        id: 'booking_flow_duration',
        name: 'Long Booking Flow',
        category: 'performance',
        severity: 'warning',
        threshold: 300000, // 5 minutes
        timeWindow: 10,
        enabled: true,
        description: 'Users taking too long to complete bookings'
      },
      
      // Error Rate Alerts
      {
        id: 'error_rate',
        name: 'High Error Rate',
        category: 'error',
        severity: 'error',
        threshold: 0.05, // 5%
        timeWindow: 10,
        enabled: true,
        description: 'Error rate exceeds 5%'
      },
      {
        id: 'booking_failure_rate',
        name: 'Booking Failures',
        category: 'business',
        severity: 'critical',
        threshold: 0.10, // 10%
        timeWindow: 15,
        enabled: true,
        description: 'Too many booking attempts are failing'
      },
      
      // Business Metrics
      {
        id: 'booking_abandonment',
        name: 'High Booking Abandonment',
        category: 'business',
        severity: 'warning',
        threshold: 0.70, // 70%
        timeWindow: 30,
        enabled: true,
        description: 'Users abandoning booking flow at high rate'
      },
      {
        id: 'daily_bookings',
        name: 'Low Daily Bookings',
        category: 'business',
        severity: 'info',
        threshold: 5, // minimum expected bookings per day
        timeWindow: 1440, // 24 hours
        enabled: true,
        description: 'Daily booking count below expected threshold'
      },
      
      // Security Alerts
      {
        id: 'failed_login_attempts',
        name: 'High Failed Login Attempts',
        category: 'security',
        severity: 'warning',
        threshold: 10,
        timeWindow: 15,
        enabled: true,
        description: 'Unusual number of failed login attempts'
      },
      {
        id: 'suspicious_activity',
        name: 'Suspicious User Activity',
        category: 'security',
        severity: 'error',
        threshold: 1,
        timeWindow: 60,
        enabled: true,
        description: 'Potential security threat detected'
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule)
    })
  }

  /**
   * Setup notification channels
   */
  private setupNotificationChannels() {
    this.channels = [
      {
        type: 'email',
        config: {
          email: process.env.ADMIN_EMAIL || 'zell@love4detailing.com',
          enabled: process.env.NODE_ENV === 'production'
        }
      },
      {
        type: 'console',
        config: {
          enabled: true
        }
      }
    ]
  }

  /**
   * Start collecting metrics
   */
  private startMetricsCollection() {
    if (typeof window === 'undefined') return

    // Collect performance metrics every 30 seconds
    setInterval(() => {
      this.collectPerformanceMetrics()
    }, 30000)

    // Collect business metrics every 5 minutes
    setInterval(() => {
      this.collectBusinessMetrics()
    }, 300000)
  }

  /**
   * Record a metric value
   */
  public recordMetric(metricId: string, value: number, metadata?: Record<string, any>) {
    const timestamp = Date.now()
    
    if (!this.metrics.has(metricId)) {
      this.metrics.set(metricId, [])
    }
    
    const metricHistory = this.metrics.get(metricId)!
    metricHistory.push({ value, timestamp })
    
    // Keep only last 24 hours of data
    const cutoff = timestamp - (24 * 60 * 60 * 1000)
    this.metrics.set(metricId, metricHistory.filter(m => m.timestamp > cutoff))
    
    // Check if this metric triggers any alerts
    this.evaluateAlerts(metricId, value, metadata)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${metricId} = ${value}`)
    }
  }

  /**
   * Evaluate alert rules for a metric
   */
  private evaluateAlerts(metricId: string, currentValue: number, metadata?: Record<string, any>) {
    const rule = this.rules.get(metricId)
    if (!rule || !rule.enabled) return

    const now = Date.now()
    const windowStart = now - (rule.timeWindow * 60 * 1000)
    const metricHistory = this.metrics.get(metricId) || []
    
    // Get values within the time window
    const windowValues = metricHistory
      .filter(m => m.timestamp >= windowStart)
      .map(m => m.value)
    
    if (windowValues.length === 0) return

    // Calculate aggregate value (average for most metrics)
    let aggregateValue: number
    if (rule.category === 'error' || rule.category === 'business') {
      // Use average for rates and percentages
      aggregateValue = windowValues.reduce((a, b) => a + b, 0) / windowValues.length
    } else {
      // Use 95th percentile for performance metrics
      const sorted = [...windowValues].sort((a, b) => a - b)
      const index = Math.floor(sorted.length * 0.95)
      aggregateValue = sorted[index] || sorted[sorted.length - 1] || 0
    }

    // Check if threshold is exceeded
    const isThresholdExceeded = aggregateValue > rule.threshold
    const alertId = `${rule.id}_${now}`
    
    if (isThresholdExceeded && !this.alerts.has(rule.id)) {
      // Create new alert
      const alert: Alert = {
        id: alertId,
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        message: `${rule.description}. Current: ${aggregateValue.toFixed(2)}, Threshold: ${rule.threshold}`,
        value: aggregateValue,
        threshold: rule.threshold,
        timestamp: now,
        resolved: false,
        metadata
      }
      
      this.alerts.set(rule.id, alert)
      this.sendNotification(alert)
      
    } else if (!isThresholdExceeded && this.alerts.has(rule.id)) {
      // Resolve existing alert
      const existingAlert = this.alerts.get(rule.id)!
      existingAlert.resolved = true
      this.sendNotification({
        ...existingAlert,
        message: `RESOLVED: ${rule.description}. Current: ${aggregateValue.toFixed(2)}`,
        severity: 'info' as AlertSeverity
      })
      this.alerts.delete(rule.id)
    }
  }

  /**
   * Send alert notification
   */
  private async sendNotification(alert: Alert) {
    for (const channel of this.channels) {
      if (!channel.config.enabled) continue

      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(alert, channel.config.email!)
            break
          case 'console':
            this.sendConsoleNotification(alert)
            break
          case 'webhook':
            if (channel.config.webhookUrl) {
              await this.sendWebhookNotification(alert, channel.config.webhookUrl)
            }
            break
        }
      } catch (error) {
        console.error(`Failed to send ${channel.type} notification:`, error)
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, email: string) {
    if (typeof window !== 'undefined') return // Client-side, skip email

    const severity = alert.resolved ? 'RESOLVED' : alert.severity.toUpperCase()
    const subject = `[${severity}] Love4Detailing Alert: ${alert.name}`
    
    const emailContent = `
Alert Details:
- Name: ${alert.name}
- Category: ${alert.category}
- Severity: ${alert.severity}
- Message: ${alert.message}
- Timestamp: ${new Date(alert.timestamp).toISOString()}
- Threshold: ${alert.threshold}
- Current Value: ${alert.value}

This alert was generated by the Love4Detailing monitoring system.
Please investigate and take appropriate action.

---
Love4Detailing Monitoring System
    `.trim()

    try {
      await fetch('/api/admin/send-alert-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject,
          content: emailContent,
          alert
        })
      })
    } catch (error) {
      console.error('Failed to send alert email:', error)
    }
  }

  /**
   * Send console notification
   */
  private sendConsoleNotification(alert: Alert) {
    const icon = alert.resolved ? '✅' : this.getSeverityIcon(alert.severity)
    const prefix = alert.resolved ? 'RESOLVED' : alert.severity.toUpperCase()
    
    console.log(`${icon} [${prefix}] ${alert.name}: ${alert.message}`)
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, webhookUrl: string) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert,
        timestamp: Date.now(),
        source: 'love4detailing-monitoring'
      })
    })
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return 'ℹ️'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'critical': return '🚨'
      default: return '📊'
    }
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics() {
    if (typeof window === 'undefined') return

    // Page load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      this.recordMetric('page_load_time', loadTime)
    }

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.recordMetric('memory_usage', memory.usedJSHeapSize / memory.jsHeapSizeLimit)
    }
  }

  /**
   * Collect business metrics
   */
  private collectBusinessMetrics() {
    // These would typically come from your analytics or backend
    // For now, we'll track them when events occur
  }

  /**
   * Public methods for recording business events
   */
  public recordBookingStarted() {
    this.recordMetric('booking_starts', 1)
  }

  public recordBookingCompleted(value?: number) {
    this.recordMetric('booking_completions', 1)
    if (value) {
      this.recordMetric('booking_values', value)
    }
  }

  public recordBookingAbandoned(step: string) {
    this.recordMetric('booking_abandonment', 1, { step })
  }

  public recordError(error: string, severity: 'low' | 'medium' | 'high') {
    const severityValue = severity === 'low' ? 1 : severity === 'medium' ? 2 : 3
    this.recordMetric('error_rate', severityValue, { error })
  }

  public recordApiCall(endpoint: string, duration: number, success: boolean) {
    this.recordMetric('api_response_time', duration, { endpoint, success })
    if (!success) {
      this.recordMetric('api_error_rate', 1, { endpoint })
    }
  }

  /**
   * Get current alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  /**
   * Get alert history
   */
  public getAlertHistory(hours: number = 24): Alert[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return Array.from(this.alerts.values())
      .filter(alert => alert.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Add custom alert rule
   */
  public addAlertRule(rule: AlertRule) {
    this.rules.set(rule.id, rule)
  }

  /**
   * Update alert rule
   */
  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>) {
    const rule = this.rules.get(ruleId)
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates })
    }
  }

  /**
   * Disable alert rule
   */
  public disableAlertRule(ruleId: string) {
    this.updateAlertRule(ruleId, { enabled: false })
  }
}

// Global alert manager instance
export const alertManager = typeof window !== 'undefined' ? AlertManager.getInstance() : null

// Convenience functions for common use cases
export const recordBookingEvent = (event: 'started' | 'completed' | 'abandoned', data?: any) => {
  if (!alertManager) return
  
  switch (event) {
    case 'started':
      alertManager.recordBookingStarted()
      break
    case 'completed':
      alertManager.recordBookingCompleted(data?.value)
      break
    case 'abandoned':
      alertManager.recordBookingAbandoned(data?.step || 'unknown')
      break
  }
}

export const recordPerformanceMetric = (metric: string, value: number, metadata?: Record<string, any>) => {
  alertManager?.recordMetric(metric, value, metadata)
}

export const recordApiMetric = (endpoint: string, duration: number, success: boolean) => {
  alertManager?.recordApiCall(endpoint, duration, success)
}