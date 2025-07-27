'use client';

import React from 'react';
import { ButtonDemo } from '@/components/ui/primitives/Button';
import { InputDemo } from '@/components/ui/primitives/Input';
import { SkeletonDemo } from '@/components/ui/primitives/Skeleton';
import { BadgeDemo } from '@/components/ui/primitives/Badge';
import { CardDemo } from '@/components/ui/composites/Card';
import { ToastDemo, ToastProvider } from '@/components/ui/composites/Toast';
import { TableDemo } from '@/components/ui/composites/Table';
import { FormDemo } from '@/components/ui/composites/Form';
import { Container, Section } from '@/components/layout/templates/PageLayout';

export default function ComponentLibraryPage() {
  const [activeDemo, setActiveDemo] = React.useState<string>('overview');

  const demos = [
    { id: 'overview', name: 'Overview', component: <OverviewDemo /> },
    { id: 'primitives', name: 'Primitives', component: <PrimitivesDemo /> },
    { id: 'composites', name: 'Composites', component: <CompositesDemo /> },
    { id: 'patterns', name: 'Patterns', component: <PatternsDemo /> },
    { id: 'layouts', name: 'Layouts', component: <LayoutsDemo /> },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <Section background="muted" padding="md">
          <Container>
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-100">
                Love4Detailing Component Library
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                A comprehensive responsive design system built with Tailwind CSS, featuring mobile-first components 
                that work seamlessly across all device sizes from 320px to 2560px+
              </p>
            </div>
          </Container>
        </Section>

        {/* Navigation */}
        <Section background="default" padding="sm">
          <Container>
            <nav className="flex justify-center">
              <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                {demos.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => setActiveDemo(demo.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      activeDemo === demo.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    {demo.name}
                  </button>
                ))}
              </div>
            </nav>
          </Container>
        </Section>

        {/* Content */}
        <Section background="default" padding="lg">
          <Container size="full">
            {demos.find(demo => demo.id === activeDemo)?.component}
          </Container>
        </Section>
      </div>
    </ToastProvider>
  );
}

const OverviewDemo: React.FC = () => (
  <div className="space-y-8">
    <div className="text-center space-y-4 mb-12">
      <h2 className="text-3xl font-bold text-gray-100">Design System Overview</h2>
      <p className="text-gray-400 max-w-2xl mx-auto">
        Our three-tier architecture ensures consistent, scalable, and maintainable UI components
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">🔧 Primitives</h3>
        <p className="text-gray-400 mb-4">
          Core building blocks with consistent styling and behavior patterns.
        </p>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• Button components with variants</li>
          <li>• Input fields with validation</li>
          <li>• Typography system</li>
          <li>• Icons and badges</li>
          <li>• Loading skeletons</li>
        </ul>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">🧩 Composites</h3>
        <p className="text-gray-400 mb-4">
          Complex components built from primitives with advanced functionality.
        </p>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• Card layouts</li>
          <li>• Modal dialogs</li>
          <li>• Navigation systems</li>
          <li>• Data tables</li>
          <li>• Form wrappers</li>
        </ul>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">🎨 Patterns</h3>
        <p className="text-gray-400 mb-4">
          Complete UI patterns and page layouts for specific use cases.
        </p>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• Booking cards</li>
          <li>• Dashboard layouts</li>
          <li>• Page templates</li>
          <li>• Content sections</li>
          <li>• Application shells</li>
        </ul>
      </div>
    </div>

    <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
      <h3 className="text-2xl font-semibold text-gray-100 mb-6">Responsive Design Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-medium text-gray-200 mb-3">📱 Mobile-First Approach</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• 320px - 640px: Mobile devices</li>
            <li>• 641px - 1024px: Tablets</li>
            <li>• 1025px+: Desktop screens</li>
            <li>• Touch-friendly 44px minimum targets</li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-medium text-gray-200 mb-3">🎯 Accessibility</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• WCAG 2.1 AA compliance</li>
            <li>• Keyboard navigation support</li>
            <li>• Screen reader compatibility</li>
            <li>• Focus management</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const PrimitivesDemo: React.FC = () => (
  <div className="space-y-12">
    <ButtonDemo />
    <InputDemo />
    <SkeletonDemo />
    <BadgeDemo />
  </div>
);

const CompositesDemo: React.FC = () => (
  <div className="space-y-12">
    <CardDemo />
    <ToastDemo />
    <TableDemo />
    <FormDemo />
  </div>
);

const PatternsDemo: React.FC = () => (
  <div className="space-y-12">
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-gray-100 mb-4">Booking Pattern</h3>
      <p className="text-gray-400 mb-4">
        Complete booking card pattern with service selection and pricing.
      </p>
      <div className="h-48 bg-gray-700 rounded border-2 border-dashed border-gray-600 flex items-center justify-center">
        <p className="text-gray-400">Booking Card Pattern Preview</p>
      </div>
    </div>
  </div>
);

const LayoutsDemo: React.FC = () => (
  <div className="space-y-12">
    <div>
      <h3 className="text-2xl font-semibold text-gray-100 mb-6">Dashboard Layout</h3>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400 mb-4">
          Complete dashboard with sidebar navigation, header, and responsive content areas.
        </p>
        <div className="h-96 bg-gray-700 rounded border-2 border-dashed border-gray-600 flex items-center justify-center">
          <p className="text-gray-400">Dashboard Layout Preview</p>
        </div>
      </div>
    </div>
  </div>
);