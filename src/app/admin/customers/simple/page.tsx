'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/primitives/Button'
import { 
  UsersIcon,
  SearchIcon,
  PhoneIcon,
  MailIcon,
  EyeIcon,
  CalendarIcon
} from 'lucide-react'

interface SimpleCustomer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
  role: string
  is_active: boolean
}

function SimpleCustomersContent() {
  const router = useRouter()
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      console.log('Loading customers...')
      
      const response = await fetch('/api/admin/customers/simple')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        
        if (data.success) {
          setCustomers(data.data)
          console.log('Loaded', data.data.length, 'customers')
        } else {
          console.error('API error:', data.error)
        }
      } else {
        console.error('Request failed:', response.status)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => 
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Customers</h1>
            <p className="text-text-secondary">
              {customers.length} customer{customers.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-primary rounded-lg bg-surface-secondary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-surface-secondary rounded-lg border border-border-primary">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {searchTerm ? 'No Matching Customers' : 'No Customers Found'}
              </h3>
              <p className="text-text-secondary">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'No customers have registered yet.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-primary border-b border-border-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-secondary">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-text-primary">{customer.first_name} {customer.last_name}</div>
                            <div className="text-sm text-text-secondary">ID: {customer.id.substring(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-text-primary"><MailIcon className="w-4 h-4 mr-2 text-text-muted" />{customer.email}</div>
                            {customer.phone && (
                              <div className="flex items-center text-sm text-text-secondary"><PhoneIcon className="w-4 h-4 mr-2 text-text-muted" />{customer.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-text-primary"><CalendarIcon className="w-4 h-4 mr-2 text-text-muted" />{formatDate(customer.created_at)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{customer.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('View customer:', customer.id)}
                            leftIcon={<EyeIcon className="w-4 h-4" />}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="block sm:hidden divide-y divide-border-secondary">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-text-primary">{customer.first_name} {customer.last_name}</div>
                        <div className="text-xs text-text-secondary">ID: {customer.id.substring(0, 8)}...</div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${customer.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{customer.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start text-sm text-text-primary">
                        <MailIcon className="w-4 h-4 mr-2 text-text-muted mt-0.5" />
                        <span className="break-words">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center text-sm text-text-secondary">
                          <PhoneIcon className="w-4 h-4 mr-2 text-text-muted" />{customer.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-text-primary">
                        <CalendarIcon className="w-4 h-4 mr-2 text-text-muted" />{formatDate(customer.created_at)}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => console.log('View customer:', customer.id)}
                        leftIcon={<EyeIcon className="w-4 h-4" />}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default function SimpleCustomersPage() {
  return (
    <AdminRoute>
      <SimpleCustomersContent />
    </AdminRoute>
  )
}