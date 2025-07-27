'use client'

import { ReactNode, useState } from 'react'
import { CustomerSidebar } from '@/components/navigation/CustomerSidebar'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'

interface CustomerLayoutProps {
  children: ReactNode
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar */}
      <CustomerSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader 
          onMenuClick={() => setIsSidebarOpen(true)}
          userType="customer"
        />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}