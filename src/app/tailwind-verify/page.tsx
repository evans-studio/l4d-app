'use client'

import React from 'react'

export default function TailwindVerify() {
  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Basic Colors Test */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">Tailwind CSS Verification</h1>
          <p className="text-gray-300">Testing basic Tailwind utilities</p>
        </div>

        {/* Background Colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">Red</span>
          </div>
          <div className="h-20 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">Blue</span>
          </div>
          <div className="h-20 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">Green</span>
          </div>
          <div className="h-20 bg-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-semibold">Yellow</span>
          </div>
        </div>

        {/* Gray Scale */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Gray Scale Test</h2>
          <div className="grid grid-cols-5 gap-2">
            <div className="h-16 rounded flex items-center justify-center bg-gray-50">
              <span className="text-black">50</span>
            </div>
            <div className="h-16 rounded flex items-center justify-center bg-gray-200">
              <span className="text-black">200</span>
            </div>
            <div className="h-16 rounded flex items-center justify-center bg-gray-400">
              <span className="text-black">400</span>
            </div>
            <div className="h-16 rounded flex items-center justify-center bg-gray-600">
              <span className="text-white">600</span>
            </div>
            <div className="h-16 rounded flex items-center justify-center bg-gray-800">
              <span className="text-white">800</span>
            </div>
          </div>
        </div>

        {/* Responsive Test */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Responsive Test</h2>
          <div className="bg-blue-500 p-4 rounded-lg">
            <div className="text-white text-center">
              <span className="block sm:hidden">Mobile (default)</span>
              <span className="hidden sm:block md:hidden">Small (sm:)</span>
              <span className="hidden md:block lg:hidden">Medium (md:)</span>
              <span className="hidden lg:block xl:hidden">Large (lg:)</span>
              <span className="hidden xl:block">Extra Large (xl:)</span>
            </div>
          </div>
        </div>

        {/* Flexbox Test */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Flexbox Test</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-purple-500 text-white px-4 py-2 rounded">Item 1</div>
            <div className="bg-purple-600 text-white px-4 py-2 rounded">Item 2</div>
            <div className="bg-purple-700 text-white px-4 py-2 rounded">Item 3</div>
          </div>
        </div>

        {/* Custom Colors Test */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Custom Colors Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-16 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">Primary</span>
            </div>
            <div className="h-16 bg-success rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">Success</span>
            </div>
            <div className="h-16 bg-warning rounded-lg flex items-center justify-center">
              <span className="text-black font-semibold">Warning</span>
            </div>
            <div className="h-16 bg-error rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold">Error</span>
            </div>
          </div>
        </div>

        {/* Animation Test */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Animation Test</h2>
          <div className="flex gap-4">
            <div className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200">
              Hover me
            </div>
            <div className="bg-green-500 text-white px-4 py-2 rounded animate-pulse">
              Pulsing
            </div>
            <div className="bg-red-500 text-white px-4 py-2 rounded hover:scale-105 transform transition-transform duration-200">
              Scale on hover
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}