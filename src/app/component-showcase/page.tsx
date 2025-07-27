'use client'

import React from 'react'
import { MainLayout } from '@/components/layouts/MainLayout'
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter, 
  CardGrid 
} from '@/components/ui/composites/Card'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useModal 
} from '@/components/ui/composites/Modal'
import { Button } from '@/components/ui/primitives/Button'
import { Input, Textarea } from '@/components/ui/primitives/Input'
import { 
  Heading, 
  Text, 
  Label, 
  Link 
} from '@/components/ui/primitives/Typography'
import { 
  Icon, 
  IconButton, 
  IconWithBadge 
} from '@/components/ui/primitives/Icon'
import { 
  BookingCard, 
  BookingCardSkeleton,
  type BookingData 
} from '@/components/ui/patterns/BookingCard'

import { 
  Star, 
  Heart, 
  Settings, 
  Bell, 
  Download,
  Plus,
  Search,
  Filter,
  Calendar,
  Car,
  MapPin,
  Clock,
  Palette,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'

export default function ComponentShowcase() {
  const modal = useModal()
  const [loading, setLoading] = React.useState(false)
  const [selectedDevice, setSelectedDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  
  // Sample booking data
  const sampleBookings: BookingData[] = [
    {
      id: '1',
      bookingReference: 'L4D-2024-001',
      status: 'pending',
      scheduledDate: '2024-01-15',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
      totalPrice: 89.99,
      customer: {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+44 7123 456789'
      },
      services: [
        { id: '1', name: 'Full Exterior Wash', price: 35.00 },
        { id: '2', name: 'Interior Vacuum & Clean', price: 25.00 },
        { id: '3', name: 'Wheel & Tire Detail', price: 29.99 }
      ],
      vehicle: {
        make: 'BMW',
        model: 'X5',
        year: 2022,
        color: 'Black',
        size: 'Large'
      },
      address: {
        addressLine1: '123 High Street',
        addressLine2: 'Apartment 4B',
        city: 'Manchester',
        postalCode: 'M1 2AB'
      },
      specialInstructions: 'Please be careful with the leather seats - they are brand new.',
      createdAt: '2024-01-10T14:30:00Z',
      priority: 'normal'
    },
    {
      id: '2',
      bookingReference: 'L4D-2024-002',
      status: 'confirmed',
      scheduledDate: '2024-01-16',
      scheduledStartTime: '14:00',
      totalPrice: 159.99,
      customer: {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+44 7987 654321'
      },
      services: [
        { id: '4', name: 'Premium Detail Package', price: 159.99 }
      ],
      vehicle: {
        make: 'Audi',
        model: 'A4',
        year: 2021,
        color: 'Silver',
        size: 'Medium'
      },
      createdAt: '2024-01-12T10:15:00Z',
      priority: 'high'
    },
    {
      id: '3',
      bookingReference: 'L4D-2024-003',
      status: 'completed',
      scheduledDate: '2024-01-14',
      scheduledStartTime: '11:00',
      totalPrice: 45.00,
      customer: {
        id: '3',
        firstName: 'Mike',
        lastName: 'Wilson'
      },
      services: [
        { id: '5', name: 'Quick Wash', price: 45.00 }
      ],
      createdAt: '2024-01-13T16:45:00Z'
    }
  ]
  
  const handleBookingAction = (action: string, booking: BookingData) => {
    console.log(`${action} booking:`, booking.bookingReference)
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }
  
  const deviceViewports = {
    mobile: 'max-w-sm mx-auto',
    tablet: 'max-w-2xl mx-auto',
    desktop: 'max-w-full'
  }
  
  return (
    <MainLayout>
      <div className="container py-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Heading size="h1" className="text-gradient">
            Component Library Showcase
          </Heading>
          <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
            A comprehensive responsive design system built for Love 4 Detailing. 
            Experience professional UI components across all device sizes.
          </Text>
          
          {/* Device Switcher */}
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant={selectedDevice === 'mobile' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Smartphone className="h-4 w-4" />}
              onClick={() => setSelectedDevice('mobile')}
            >
              Mobile
            </Button>
            <Button
              variant={selectedDevice === 'tablet' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Tablet className="h-4 w-4" />}
              onClick={() => setSelectedDevice('tablet')}
            >
              Tablet
            </Button>
            <Button
              variant={selectedDevice === 'desktop' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Monitor className="h-4 w-4" />}
              onClick={() => setSelectedDevice('desktop')}
            >
              Desktop
            </Button>
          </div>
        </div>
        
        {/* Responsive Container */}
        <div className={deviceViewports[selectedDevice]}>
          
          {/* Typography Section */}
          <section className="space-y-6">
            <Card>
              <CardHeader title="Typography System" subtitle="Responsive text scaling and hierarchy" />
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Heading size="h1">Heading 1 - Main Title</Heading>
                    <Heading size="h2">Heading 2 - Section Title</Heading>
                    <Heading size="h3">Heading 3 - Subsection</Heading>
                    <Heading size="h4">Heading 4 - Component Title</Heading>
                  </div>
                  
                  <div className="space-y-2">
                    <Text size="lg">Large text for important information</Text>
                    <Text size="base">Base text for body content and descriptions</Text>
                    <Text size="sm" color="secondary">Small text for supporting information</Text>
                    <Text size="xs" color="muted">Extra small text for captions and metadata</Text>
                  </div>
                  
                  <div>
                    <Link href="#" variant="default">Default link</Link> | {' '}
                    <Link href="#" variant="subtle">Subtle link</Link> | {' '}
                    <Link href="#" variant="button">Button-style link</Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Button Variants Section */}
          <section className="space-y-6">
            <Card>
              <CardHeader title="Button Components" subtitle="All variants with responsive touch targets" />
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label>Primary Actions</Label>
                    <div className="grid grid-cols-2 sm:flex gap-2 mt-2">
                      <Button variant="primary" size="sm">Small</Button>
                      <Button variant="primary" size="md">Medium</Button>
                      <Button variant="primary" size="lg">Large</Button>
                      <Button variant="primary" size="xl">Extra Large</Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Button Variants</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <Button variant="primary">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="link">Link Button</Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Button States</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      <Button leftIcon={<Download />}>With Icon</Button>
                      <Button loading loadingText="Processing...">Loading</Button>
                      <Button disabled>Disabled</Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Icon Buttons</Label>
                    <div className="flex gap-2 mt-2">
                      <IconButton icon={Settings} aria-label="Settings" />
                      <IconButton icon={Heart} aria-label="Favorite" variant="primary" />
                      <IconButton icon={Search} aria-label="Search" variant="outline" />
                      <IconWithBadge icon={Bell} badge={3} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Form Components Section */}
          <section className="space-y-6">
            <Card>
              <CardHeader title="Form Components" subtitle="Input fields with validation states" />
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      required
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+44 7123 456789"
                      optional
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Enter password"
                      helperText="Must be at least 8 characters"
                    />
                    <Input
                      label="Search"
                      placeholder="Search bookings..."
                      leftIcon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      label="Error State"
                      error="This field is required"
                      placeholder="Enter value"
                    />
                    <Input
                      label="Success State"
                      success="Email address verified"
                      placeholder="valid@email.com"
                      value="valid@email.com"
                      readOnly
                    />
                    <Input
                      label="Warning State"
                      warning="This email is already in use"
                      placeholder="warning@email.com"
                    />
                  </div>
                  
                  <Textarea
                    label="Special Instructions"
                    placeholder="Enter any special requirements or notes..."
                    rows={4}
                    helperText="Maximum 500 characters"
                  />
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Modal Demo Section */}
          <section className="space-y-6">
            <Card>
              <CardHeader title="Modal Components" subtitle="Mobile-adaptive dialogs and overlays" />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={modal.open} variant="outline">
                    Open Demo Modal
                  </Button>
                  <Button 
                    onClick={() => alert('Confirmation would appear here')}
                    variant="destructive"
                  >
                    Show Confirmation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Booking Cards Section */}
          <section className="space-y-6">
            <Card>
              <CardHeader 
                title="Booking Cards" 
                subtitle="Pattern components demonstrating real-world usage"
                actions={
                  <div className="flex gap-2">
                    <IconButton icon={Filter} aria-label="Filter" size="sm" />
                    <IconButton icon={Plus} aria-label="Add booking" variant="primary" size="sm" />
                  </div>
                }
              />
              <CardContent>
                <div className="space-y-4">
                  {sampleBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      layout={selectedDevice === 'mobile' ? 'compact' : 'detailed'}
                      onView={(booking) => handleBookingAction('View', booking)}
                      onEdit={(booking) => handleBookingAction('Edit', booking)}
                      onCancel={(booking) => handleBookingAction('Cancel', booking)}
                      onConfirm={(booking) => handleBookingAction('Confirm', booking)}
                      loading={loading}
                    />
                  ))}
                  
                  {/* Loading state demonstration */}
                  <BookingCardSkeleton layout={selectedDevice === 'mobile' ? 'compact' : 'detailed'} />
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Responsive Grid Section */}
          <section className="space-y-6">
            <Card>
              <CardHeader title="Responsive Grids" subtitle="Adaptive layouts across breakpoints" />
              <CardContent>
                <CardGrid
                  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                  gap="md"
                >
                  {[
                    { icon: Car, title: 'Vehicle Services', count: 24 },
                    { icon: Calendar, title: 'Today\'s Bookings', count: 8 },
                    { icon: MapPin, title: 'Service Areas', count: 12 },
                    { icon: Clock, title: 'Avg. Duration', count: '2.5h' },
                    { icon: Star, title: 'Customer Rating', count: '4.9' },
                    { icon: Palette, title: 'Active Staff', count: 6 },
                  ].map((item, index) => (
                    <Card key={index} variant="outline">
                      <CardContent spacing="sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                            <Icon 
                              icon={item.icon} 
                              size="md" 
                              color="primary"
                              decorative
                            />
                          </div>
                          <div>
                            <Text size="sm" color="muted">{item.title}</Text>
                            <Heading size="h4">{item.count}</Heading>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardGrid>
              </CardContent>
            </Card>
          </section>
          
          {/* Responsive Features Summary */}
          <section className="space-y-6">
            <Card variant="elevated">
              <CardHeader title="Responsive Design Features" />
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Heading size="h5" className="mb-3">Mobile-First Approach</Heading>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li>• Touch-friendly 44px minimum target sizes</li>
                      <li>• Progressive enhancement for larger screens</li>
                      <li>• Optimized for mobile performance</li>
                      <li>• Thumb-friendly navigation zones</li>
                    </ul>
                  </div>
                  
                  <div>
                    <Heading size="h5" className="mb-3">Adaptive Components</Heading>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li>• Responsive typography scaling</li>
                      <li>• Flexible grid systems</li>
                      <li>• Mobile drawer patterns</li>
                      <li>• Context-aware interactions</li>
                    </ul>
                  </div>
                  
                  <div>
                    <Heading size="h5" className="mb-3">Accessibility</Heading>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li>• WCAG 2.1 AA compliance</li>
                      <li>• Keyboard navigation support</li>
                      <li>• Screen reader compatibility</li>
                      <li>• High contrast mode support</li>
                    </ul>
                  </div>
                  
                  <div>
                    <Heading size="h5" className="mb-3">Performance</Heading>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li>• Optimized bundle sizes</li>
                      <li>• Efficient re-render patterns</li>
                      <li>• Lazy loading components</li>
                      <li>• Motion preference support</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button variant="primary" size="lg" fullWidth>
                  Get Started with Component Library
                </Button>
              </CardFooter>
            </Card>
          </section>
        </div>
      </div>
      
      {/* Demo Modal */}
      <Modal 
        open={modal.isOpen} 
        onClose={modal.close}
        closeOnOverlayClick
        closeOnEscape
      >
        <ModalContent size="md" onClose={modal.close}>
          <ModalHeader 
            title="Demo Modal" 
            subtitle="This modal adapts to mobile and desktop views"
          />
          <ModalBody>
            <div className="space-y-4">
              <Text>
                This modal automatically adjusts its layout based on the screen size. 
                On mobile devices, it takes up more screen space for better usability.
              </Text>
              
              <Input
                label="Sample Input"
                placeholder="Try typing here..."
              />
              
              <Text size="sm" color="muted">
                All form elements within modals maintain their responsive behavior 
                and accessibility features.
              </Text>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={modal.close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={modal.close}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  )
}