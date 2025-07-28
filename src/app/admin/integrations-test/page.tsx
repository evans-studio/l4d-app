'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Badge } from '@/components/ui/primitives/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/composites/Tabs'
import { RealTimeAvailability } from '@/components/booking/RealTimeAvailability'
import { DistanceCalculatorDemo } from '@/components/admin/DistanceCalculatorDemo'
import { 
  Zap, 
  Mail, 
  MapPin, 
  Calendar, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react'

export default function IntegrationsTestPage() {
  const [emailTest, setEmailTest] = useState({
    to: '',
    subject: 'Love 4 Detailing - Test Email',
    isLoading: false,
    result: null as { success: boolean; message: string } | null
  })

  const handleEmailTest = async () => {
    if (!emailTest.to.trim()) return

    setEmailTest(prev => ({ ...prev, isLoading: true, result: null }))

    try {
      const testData = {
        customerName: 'John Smith',
        customerEmail: emailTest.to.trim(),
        bookingReference: `TEST-${Date.now()}`,
        serviceName: 'Premium Detail',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '10:00',
        totalPrice: 89.99,
        address: '123 Test Street, London, SW1A 1AA',
        vehicleDetails: 'BMW X5 2020',
        specialInstructions: 'This is a test booking for integration testing.',
        businessName: 'Love 4 Detailing',
        businessPhone: '0123 456 7890'
      }

      const template = {
        subject: emailTest.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6366f1; color: white; padding: 20px; text-align: center;">
              <h1>Love 4 Detailing</h1>
              <h2>Integration Test Email</h2>
            </div>
            <div style="padding: 20px;">
              <p>Hello ${testData.customerName},</p>
              <p>This is a test email from the Love 4 Detailing integration system.</p>
              <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>Test Booking Details</h3>
                <p><strong>Reference:</strong> ${testData.bookingReference}</p>
                <p><strong>Service:</strong> ${testData.serviceName}</p>
                <p><strong>Date:</strong> ${testData.scheduledDate}</p>
                <p><strong>Time:</strong> ${testData.scheduledTime}</p>
                <p><strong>Price:</strong> £${testData.totalPrice}</p>
              </div>
              <p>All systems are working correctly!</p>
            </div>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Love 4 Detailing. Integration Test.</p>
            </div>
          </div>
        `,
        text: `
          Love 4 Detailing - Integration Test
          
          Hello ${testData.customerName},
          
          This is a test email from the integration system.
          
          Test Booking: ${testData.bookingReference}
          Service: ${testData.serviceName}
          Date: ${testData.scheduledDate} at ${testData.scheduledTime}
          
          All systems working correctly!
        `
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })

      const result = await response.json()

      setEmailTest(prev => ({
        ...prev,
        result: {
          success: result.success,
          message: result.success ? 'Test email sent successfully!' : result.error?.message || 'Failed to send email'
        }
      }))

    } catch (error) {
      setEmailTest(prev => ({
        ...prev,
        result: {
          success: false,
          message: 'Network error occurred'
        }
      }))
    } finally {
      setEmailTest(prev => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Phase 3 Integrations Test</h1>
        <p className="text-muted-foreground">
          Real-time availability, distance calculation, and email notification system testing
        </p>
      </div>

      <Tabs defaultValue="availability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="distance" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Distance
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Real-Time Availability System
              </h2>
              <p className="text-muted-foreground">
                Test the real-time availability polling system with optimistic updates
              </p>
            </CardHeader>
            <CardContent>
              <RealTimeAvailability 
                selectedDate={new Date().toISOString().split('T')[0]!}
                showDebugInfo={true}
                onSlotSelect={(slotId) => console.log('Slot selected:', slotId)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distance" className="space-y-6">
          <DistanceCalculatorDemo />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Email Notification System
              </h2>
              <p className="text-muted-foreground">
                Test the email notification system with Resend integration
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Test Email Address</label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={emailTest.to}
                  onChange={(e) => setEmailTest(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  value={emailTest.subject}
                  onChange={(e) => setEmailTest(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <Button 
                onClick={handleEmailTest}
                disabled={emailTest.isLoading || !emailTest.to.trim()}
                className="w-full"
              >
                {emailTest.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Test Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>

              {emailTest.result && (
                <div className={`p-4 rounded-lg border ${
                  emailTest.result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`flex items-center gap-2 ${
                    emailTest.result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {emailTest.result.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {emailTest.result.message}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">Email Templates Available:</h4>
                <div className="text-sm space-y-1">
                  <div>✅ Booking Confirmation</div>
                  <div>✅ Booking Reminder (24h before)</div>
                  <div>✅ Booking Cancellation</div>
                  <div>✅ Booking Reschedule</div>
                  <div>✅ Service Completion</div>
                  <div>✅ Admin Notifications</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">System Status</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Real-time Availability Hook</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Distance Calculation Service</span>
                  <Badge variant="success">Ready</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Email Notification System</span>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Multi-Date Availability Hook</span>
                  <Badge variant="success">Available</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">API Endpoints</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm font-mono">
                <div>GET /api/time-slots/availability?date=YYYY-MM-DD</div>
                <div>PUT /api/time-slots/[id]/book</div>
                <div>PUT /api/time-slots/[id]/release</div>
                <div>POST /api/email/send</div>
                <div>GET /api/bookings/upcoming-reminders</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Distance Providers</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Google Maps API</span>
                  <Badge variant="outline">Primary</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mapbox API</span>
                  <Badge variant="outline">Fallback</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Haversine + UK Postcodes</span>
                  <Badge variant="success">Always Available</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Features Implemented</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Real-time availability polling (30s intervals)
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Optimistic UI updates for booking actions
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Multi-provider distance calculation
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Travel surcharge calculation
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Service area validation
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  HTML email templates with Resend
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Admin notification system
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Race condition protection
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Audit logging for booking actions
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Background email processing
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}