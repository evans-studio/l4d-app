import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useSessionRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshSession = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        setError(error.message)
        return false
      }
      
      return true
    } catch (err) {
      setError('Failed to refresh session')
      return false
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh session on mount if needed
  useEffect(() => {
    const checkAndRefreshSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error?.message?.includes('Invalid Refresh Token') || 
          error?.message?.includes('Refresh Token Not Found')) {
        await refreshSession()
      }
    }

    checkAndRefreshSession()
  }, [])

  return {
    isRefreshing,
    error,
    refreshSession
  }
}