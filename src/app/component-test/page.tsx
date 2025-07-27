import React from 'react'
import { Button } from '@/components/ui/primitives/Button'

export default function ComponentTest(): React.ReactElement {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Component Library Test</h1>
      
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-yellow-800">
          🧪 Testing Tailwind CSS: If this box is yellow, Tailwind is working!
        </p>
      </div>
      
      <div className="space-x-2 mb-4">
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="destructive">Destructive Button</Button>
      </div>
      
      <div className="space-x-2 mb-4">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      
      <p className="text-green-600">
        ✅ If you can see styled buttons above, your components are working!
      </p>
    </div>
  )
}