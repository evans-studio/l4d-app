'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'

const templates = [
  {
    id: "default",
    name: "Default Schedule",
    description: "Standard 5-slot daily schedule",
    slots: [
      { start_time: "10:00", duration_minutes: 90 },
      { start_time: "12:00", duration_minutes: 90 },
      { start_time: "14:00", duration_minutes: 90 },
      { start_time: "16:00", duration_minutes: 90 },
      { start_time: "18:00", duration_minutes: 90 }
    ]
  },
  {
    id: "weekdays_9to5",
    name: "Weekdays 9-5",
    description: "Business hours schedule for weekdays",
    slots: [
      { start_time: "09:00", duration_minutes: 120 },
      { start_time: "11:30", duration_minutes: 120 },
      { start_time: "14:00", duration_minutes: 120 },
      { start_time: "16:30", duration_minutes: 90 }
    ]
  },
  {
    id: "weekends_only",
    name: "Weekends Only",
    description: "Extended slots for weekend services",
    slots: [
      { start_time: "08:00", duration_minutes: 150 },
      { start_time: "11:00", duration_minutes: 150 },
      { start_time: "14:00", duration_minutes: 150 },
      { start_time: "17:00", duration_minutes: 120 }
    ]
  },
  {
    id: "full_week",
    name: "Full Week",
    description: "Consistent schedule for all days",
    slots: [
      { start_time: "09:00", duration_minutes: 120 },
      { start_time: "12:00", duration_minutes: 120 },
      { start_time: "15:00", duration_minutes: 120 }
    ]
  }
];

export default function SetupTemplatesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleSetupTemplates = async () => {
    setIsLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/admin/time-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templates })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult('✅ Successfully inserted time slot templates! You can now use the BulkAddModal.')
      } else {
        setResult(`❌ Failed to insert templates: ${data.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      setResult(`❌ Error inserting templates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="bg-[var(--surface-primary)] border border-[var(--border-secondary)] rounded-lg p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          Setup Time Slot Templates
        </h1>
        
        <div className="mb-6">
          <p className="text-[var(--text-secondary)] mb-4">
            This will insert the default time slot templates into your database. 
            These templates will be used by the BulkAddModal for creating time slots.
          </p>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--text-primary)]">Templates to be added:</h3>
            {templates.map(template => (
              <div key={template.id} className="bg-[var(--surface-secondary)] p-3 rounded">
                <div className="font-medium text-[var(--text-primary)]">{template.name}</div>
                <div className="text-sm text-[var(--text-secondary)]">{template.description}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  {template.slots.length} time slots: {template.slots.map(s => s.start_time).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSetupTemplates}
          loading={isLoading}
          disabled={isLoading}
          className="w-full mb-4"
        >
          {isLoading ? 'Setting up templates...' : 'Setup Templates'}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.startsWith('✅') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  )
}