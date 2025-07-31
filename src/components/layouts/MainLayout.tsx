'use client'

import { ReactNode } from 'react'
import { MinimalHeader } from '@/components/navigation/MinimalHeader'
import { MainFooter } from '@/components/navigation/MainFooter'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <MinimalHeader />
      <main className="flex-1">
        {children}
      </main>
      <MainFooter />
    </div>
  )
}