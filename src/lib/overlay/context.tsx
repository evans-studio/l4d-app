'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { OverlayConfig, OverlayContextValue, OverlayType } from './types'

const OverlayContext = createContext<OverlayContextValue | null>(null)

export const useOverlay = () => {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider')
  }
  return context
}

interface OverlayProviderProps {
  children: React.ReactNode
}

export const OverlayProvider: React.FC<OverlayProviderProps> = ({ children }) => {
  const [activeOverlays, setActiveOverlays] = useState<OverlayConfig[]>([])

  const openOverlay = useCallback((config: OverlayConfig) => {
    setActiveOverlays(prev => {
      // Remove existing overlay of the same type to prevent duplicates
      const filtered = prev.filter(overlay => overlay.type !== config.type)
      return [...filtered, {
        ...config,
        closable: config.closable !== false // Default to true
      }]
    })
  }, [])

  const closeOverlay = useCallback((type?: OverlayType) => {
    setActiveOverlays(prev => {
      if (type) {
        return prev.filter(overlay => overlay.type !== type)
      } else {
        // Close the most recent overlay
        return prev.slice(0, -1)
      }
    })
  }, [])

  const closeAllOverlays = useCallback(() => {
    setActiveOverlays([])
  }, [])

  const value: OverlayContextValue = {
    activeOverlays,
    openOverlay,
    closeOverlay,
    closeAllOverlays
  }

  return (
    <OverlayContext.Provider value={value}>
      {children}
    </OverlayContext.Provider>
  )
}