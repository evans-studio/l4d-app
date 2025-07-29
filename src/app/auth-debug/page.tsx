'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-compat'
import { supabase } from '@/lib/supabase/client'

export default function AuthDebugPage() {
  const { user, profile, isLoading, isAuthenticated } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSessionInfo(session)
    }
    getSession()
  }, [])

  const testLogin = async () => {
    try {
      setTestResult('Testing login...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com', // Replace with your test email
        password: 'testpassword123'
      })
      
      if (error) {
        setTestResult(`Login error: ${error.message}`)
      } else {
        setTestResult(`Login success: ${JSON.stringify(data.user?.email)}`)
      }
    } catch (err) {
      setTestResult(`Login exception: ${err}`)
    }
  }

  const testProfile = async () => {
    try {
      setTestResult('Testing profile fetch...')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setTestResult('No session found')
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        setTestResult(`Profile error: ${error.message}`)
      } else {
        setTestResult(`Profile success: ${JSON.stringify(data)}`)
      }
    } catch (err) {
      setTestResult(`Profile exception: ${err}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Auth Debug Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Auth Context State</h2>
          <div className="space-y-2">
            <p><strong>isLoading:</strong> {isLoading.toString()}</p>
            <p><strong>isAuthenticated:</strong> {isAuthenticated.toString()}</p>
            <p><strong>user:</strong> {user ? user.email : 'null'}</p>
            <p><strong>profile:</strong> {profile ? JSON.stringify(profile) : 'null'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Direct Session Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'Loading...'}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4 mb-4">
            <button 
              onClick={testLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Login
            </button>
            <button 
              onClick={testProfile}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Profile Fetch
            </button>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <strong>Test Result:</strong> {testResult}
          </div>
        </div>
      </div>
    </div>
  )
}