import { AdminRoute } from '@/components/ProtectedRoute'
import CustomerDetailClient from './CustomerDetailClient'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <AdminRoute>
      <CustomerDetailClient customerId={id} />
    </AdminRoute>
  )
}