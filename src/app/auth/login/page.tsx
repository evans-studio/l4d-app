export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Container } from '@/components/layout/templates/PageLayout'
import { AuthLogo } from '@/components/ui/primitives/Logo'
import Link from 'next/link'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
      <Container>
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <AuthLogo />
            </div>
            <h2 className="text-3xl font-bold text-text-primary">Sign In</h2>
            <p className="mt-2 text-text-secondary">Access your Love 4 Detailing account</p>
          </div>

          <LoginForm />

          <div className="text-center">
            <Link href="/" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}