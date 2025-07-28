'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/primitives/Button'

export default function LoginRedirectTestPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Checking authentication...')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setStatus('Getting session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus(`Session error: ${error.message}`)
          return
        }
        
        if (!session) {
          setStatus('No session found - need to login')
          return
        }
        
        setStatus(`Session found for: ${session.user.email}`)
        
        // Try to get profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          setStatus(`Profile error: ${profileError.message}`)
          return
        }
        
        setStatus(`Profile found: ${profile.email} (${profile.role})`)
        
        // Auto-redirect after successful check
        setTimeout(() => {
          setStatus('Redirecting to dashboard...')
          router.push('/dashboard')
        }, 2000)
        
      } catch (error) {
        setStatus(`Unexpected error: ${error}`)
      }
    }
    
    checkAuth()
  }, [router])
  
  const manualRedirect = () => {
    router.push('/dashboard')
  }
  
  const manualWindowRedirect = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-secondary rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          Login Redirect Test
        </h1>
        
        <div className="bg-surface-primary rounded-md p-4 mb-6">
          <p className="text-text-secondary text-sm">{status}</p>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={manualRedirect}
            variant="primary"
            className="w-full"
          >
            Manual Router Redirect
          </Button>
          
          <Button 
            onClick={manualWindowRedirect}
            variant="secondary"
            className="w-full"
          >
            Manual Window Redirect
          </Button>
          
          <Button 
            onClick={() => router.push('/auth/login')}
            variant="outline"
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  )
}