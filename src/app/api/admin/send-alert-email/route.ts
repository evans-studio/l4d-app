/**
 * Alert Email API Route for Love4Detailing
 * 
 * Sends alert notifications via email to administrators
 * when monitoring thresholds are exceeded.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { env } from '@/lib/config/environment'
import { logger } from '@/lib/utils/logger'
import type { Alert } from '@/lib/monitoring/alert-manager'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, subject, content, alert } = await request.json() as {
      to: string
      subject: string
      content: string
      alert: Alert
    }

    // Validate required fields
    if (!to || !subject || !content || !alert) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields' } },
        { status: 400 }
      )
    }

    // Generate HTML email content
    const htmlContent = generateAlertEmailHTML(alert, content)

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: env.email.fromEmail,
      to: [to],
      subject,
      html: htmlContent,
      text: content,
      replyTo: env.email.replyTo,
      headers: {
        'X-Priority': alert.severity === 'critical' ? '1' : '3',
        'X-Alert-Category': alert.category,
        'X-Alert-Severity': alert.severity,
      }
    })

    if (emailResult.error) {
      logger.error('Failed to send alert email:', emailResult.error)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to send email', details: emailResult.error } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        emailId: emailResult.data?.id,
        timestamp: Date.now()
      }
    })

  } catch (error) {
    logger.error('Alert email API error:', error instanceof Error ? error : undefined)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * Generate HTML email template for alerts
 */
function generateAlertEmailHTML(alert: Alert, textContent: string): string {
  const severityColors = {
    info: '#3B82F6',      // Blue
    warning: '#F59E0B',   // Amber
    error: '#EF4444',     // Red
    critical: '#DC2626'   // Dark Red
  }

  const severityIcons = {
    info: 'ℹ️',
    warning: '⚠️', 
    error: '❌',
    critical: '🚨'
  }

  const color = severityColors[alert.severity]
  const icon = severityIcons[alert.severity]
  const isResolved = alert.resolved
  const statusText = isResolved ? 'RESOLVED' : alert.severity.toUpperCase()
  const statusColor = isResolved ? '#10B981' : color

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alert.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .alert-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .alert-header {
      background: ${statusColor};
      color: white;
      padding: 20px;
      text-align: center;
    }
    .alert-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .alert-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    .alert-status {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 4px;
    }
    .alert-content {
      padding: 30px;
    }
    .alert-message {
      background: #f1f5f9;
      border-left: 4px solid ${color};
      padding: 16px;
      margin-bottom: 24px;
      border-radius: 0 8px 8px 0;
    }
    .alert-details {
      display: grid;
      gap: 12px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-label {
      font-weight: 600;
      color: #64748b;
    }
    .detail-value {
      color: #1e293b;
      text-align: right;
    }
    .metric-comparison {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 12px;
      margin: 16px 0;
    }
    .current-value {
      font-weight: 600;
      color: #dc2626;
    }
    .threshold-value {
      color: #64748b;
    }
    .footer {
      background: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      color: #64748b;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: #7c3aed;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 16px;
    }
    .cta-button:hover {
      background: #6d28d9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert-card">
      <!-- Header -->
      <div class="alert-header">
        <div class="alert-icon">${icon}</div>
        <h1 class="alert-title">${alert.name}</h1>
        <div class="alert-status">[${statusText}] ${alert.category.toUpperCase()}</div>
      </div>

      <!-- Content -->
      <div class="alert-content">
        <div class="alert-message">
          <strong>${isResolved ? '✅ Alert Resolved:' : '🚨 Alert Triggered:'}</strong>
          ${alert.message}
        </div>

        <!-- Alert Details -->
        <div class="alert-details">
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-value">${alert.category}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Severity</span>
            <span class="detail-value">${alert.severity}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Triggered</span>
            <span class="detail-value">${new Date(alert.timestamp).toLocaleString()}</span>
          </div>
        </div>

        ${!isResolved ? `
        <!-- Metric Comparison -->
        <div class="metric-comparison">
          <div>
            <strong>Current Value:</strong> <span class="current-value">${alert.value.toFixed(2)}</span>
          </div>
          <div style="margin-left: auto;">
            <strong>Threshold:</strong> <span class="threshold-value">${alert.threshold}</span>
          </div>
        </div>
        ` : ''}

        <!-- Metadata -->
        ${alert.metadata ? `
        <div class="alert-details" style="margin-top: 20px;">
          <h3 style="margin-bottom: 12px; color: #1e293b;">Additional Information</h3>
          ${Object.entries(alert.metadata).map(([key, value]) => `
            <div class="detail-row">
              <span class="detail-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span class="detail-value">${value}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">
          This alert was generated by Love4Detailing's monitoring system.<br>
          Please investigate and take appropriate action if required.
        </p>
        <a href="https://love4detailing.com/admin/monitoring" class="cta-button">
          View Monitoring Dashboard
        </a>
      </div>
    </div>

    <!-- Contact Information -->
    <div style="text-align: center; margin-top: 20px;">
      <p style="color: #64748b; font-size: 14px;">
        <strong>Love4Detailing Support</strong><br>
        📧 zell@love4detailing.com | 📞 +44 7908 625581<br>
        🌐 <a href="https://love4detailing.com" style="color: #7c3aed;">love4detailing.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}