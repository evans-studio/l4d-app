'use client'

import { ReactNode, useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/navigation/AdminSidebar'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      // Prevent scrolling on mount
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Re-enable scrolling when component unmounts or sidebar closes
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isSidebarOpen])

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isSidebarOpen])

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
        
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          onTouchStart={() => setIsSidebarOpen(false)}
          aria-hidden="true"
          role="button"
          tabIndex={-1}
        />
      )}
    </div>
  )
}