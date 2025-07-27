'use client'

import { ReactNode } from 'react'
import { MainHeader } from '@/components/navigation/MainHeader'
import { MainFooter } from '@/components/navigation/MainFooter'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <MainHeader />
      <main className="flex-1">
        {children}
      </main>
      <MainFooter />
    </div>
  )
}