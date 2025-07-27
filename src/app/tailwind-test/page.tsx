'use client'

import React from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { Search, Heart, Settings } from 'lucide-react'

export default function TailwindTest() {
  return (
    <div className="min-h-screen p-8" style={{backgroundColor: '#000000'}}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-100">
            Tailwind Components Test
          </h1>
          <p className="text-gray-400">
            Testing our component library with proper Tailwind styling
          </p>
        </div>
        
        {/* Buttons Section */}
        <Card>
          <CardHeader title="Button Components" subtitle="All button variants and sizes" />
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Primary Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" size="xl">Extra Large</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Button Variants</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Button States</h3>
                <div className="flex flex-wrap gap-4">
                  <Button leftIcon={<Search className="h-4 w-4" />}>With Icon</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Inputs Section */}
        <Card>
          <CardHeader title="Input Components" subtitle="Form inputs with validation states" />
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cards Grid Section */}
        <Card>
          <CardHeader title="Card Grid Layout" subtitle="Responsive card components" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Card 1', content: 'This is the first card' },
                { title: 'Card 2', content: 'This is the second card' },
                { title: 'Card 3', content: 'This is the third card' },
                { title: 'Card 4', content: 'This is the fourth card' },
                { title: 'Card 5', content: 'This is the fifth card' },
                { title: 'Card 6', content: 'This is the sixth card' },
              ].map((card, index) => (
                <Card key={index} variant="outline">
                  <CardHeader title={card.title} />
                  <CardContent>
                    <p className="text-gray-400">{card.content}</p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" variant="outline">Action</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Color Test Section */}
        <Card>
          <CardHeader title="Color Palette Test" subtitle="Checking Tailwind color tokens" />
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-blue-600 rounded-lg"></div>
                <p className="text-sm text-gray-400">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-green-600 rounded-lg"></div>
                <p className="text-sm text-gray-400">Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-yellow-500 rounded-lg"></div>
                <p className="text-sm text-gray-400">Warning</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-red-600 rounded-lg"></div>
                <p className="text-sm text-gray-400">Error</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-800 rounded-lg border"></div>
                <p className="text-sm text-gray-400">Surface Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-700 rounded-lg"></div>
                <p className="text-sm text-gray-400">Surface Tertiary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-600 rounded-lg"></div>
                <p className="text-sm text-gray-400">Border Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-500 rounded-lg"></div>
                <p className="text-sm text-gray-400">Text Muted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Text Color Test */}
        <Card>
          <CardHeader title="Typography Test" subtitle="Text colors and hierarchy" />
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-100 text-lg">Primary text color - main content</p>
              <p className="text-gray-400">Secondary text color - supporting content</p>
              <p className="text-gray-500 text-sm">Muted text color - captions and metadata</p>
              <p className="text-blue-400">Brand primary color - links and highlights</p>
              <p className="text-green-400">Success color - positive states</p>
              <p className="text-yellow-400">Warning color - attention needed</p>
              <p className="text-red-400">Error color - problems and alerts</p>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}