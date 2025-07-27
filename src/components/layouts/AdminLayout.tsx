'use client'

import { ReactNode, useState } from 'react'
import { AdminSidebar } from '@/components/navigation/AdminSidebar'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader 
          onMenuClick={() => setIsSidebarOpen(true)}
          userType="admin"
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