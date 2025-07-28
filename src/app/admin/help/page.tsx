'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  HelpCircleIcon, 
  BookOpenIcon, 
  MessageSquareIcon, 
  PhoneIcon,
  MailIcon,
  ExternalLinkIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  VideoIcon,
  FileTextIcon
} from 'lucide-react'

interface FAQ {
  question: string
  answer: string
  category: string
}

interface HelpResource {
  title: string
  description: string
  type: 'video' | 'article' | 'guide'
  url: string
  duration?: string
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const faqs: FAQ[] = [
    {
      question: "How do I add new services to the system?",
      answer: "Go to Admin > Services, click 'Add New Service', fill in the service details including name, description, base price, and estimated duration. You can also set different pricing for different vehicle sizes.",
      category: "services"
    },
    {
      question: "How do I manage my schedule and availability?",
      answer: "Navigate to Admin > Schedule to view your calendar. You can create time slots by clicking 'Add Time Slots', select multiple dates, and define available time periods. Unavailable slots will show as blocked on your calendar.",
      category: "scheduling"
    },
    {
      question: "How do I confirm or cancel customer bookings?",
      answer: "In Admin > Bookings, you'll see all pending bookings. Click the green checkmark to confirm or the red X to cancel. You can also view detailed booking information by clicking the eye icon.",
      category: "bookings"
    },
    {
      question: "How do I view business reports and analytics?",
      answer: "Go to Admin > Reports to access comprehensive business analytics including revenue reports, customer statistics, popular services, and booking trends. You can export reports as CSV or PDF files.",
      category: "reports"
    },
    {
      question: "How do I update my business settings?",
      answer: "Visit Admin > Settings to configure business information, operating hours, booking rules, notification preferences, and system settings. Remember to save your changes.",
      category: "settings"
    },
    {
      question: "How do I manage customer information?",
      answer: "In Admin > Customers, you can view all registered customers, their booking history, contact information, and account status. You can also export customer data for marketing purposes.",
      category: "customers"
    },
    {
      question: "What should I do if a customer wants to reschedule?",
      answer: "Find the booking in Admin > Bookings, click to view details, and use the reschedule option. The system will check availability and send confirmation emails to the customer.",
      category: "bookings"
    },
    {
      question: "How do I set different prices for different vehicle sizes?",
      answer: "Go to Admin > Services > Pricing. You can set base prices and multipliers for Small, Medium, Large, and XL vehicles. The system will automatically calculate final prices based on customer's vehicle size.",
      category: "pricing"
    }
  ]

  const helpResources: HelpResource[] = [
    {
      title: "Getting Started Guide",
      description: "Complete walkthrough of setting up your Love 4 Detailing admin system",
      type: "guide",
      url: "#",
      duration: "10 min read"
    },
    {
      title: "Managing Your First Booking",
      description: "Step-by-step tutorial on handling bookings from inquiry to completion",
      type: "video",
      url: "#",
      duration: "8 min"
    },
    {
      title: "Setting Up Services and Pricing",
      description: "How to configure your service offerings and pricing structure",
      type: "article",
      url: "#",
      duration: "5 min read"
    },
    {
      title: "Understanding Reports and Analytics",
      description: "Make data-driven decisions with business insights and reporting",
      type: "guide",
      url: "#",
      duration: "12 min read"
    },
    {
      title: "Customer Communication Best Practices",
      description: "Tips for maintaining excellent customer relationships",
      type: "article",
      url: "#",
      duration: "7 min read"
    },
    {
      title: "Troubleshooting Common Issues",
      description: "Solutions to frequently encountered problems",
      type: "guide",
      url: "#",
      duration: "15 min read"
    }
  ]

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'services', label: 'Services' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'scheduling', label: 'Scheduling' },
    { id: 'customers', label: 'Customers' },
    { id: 'reports', label: 'Reports' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'settings', label: 'Settings' }
  ]

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getResourceIcon = (type: HelpResource['type']) => {
    switch (type) {
      case 'video':
        return VideoIcon
      case 'article':
        return FileTextIcon
      case 'guide':
        return BookOpenIcon
      default:
        return FileTextIcon
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Help & Support</h1>
          <p className="text-text-secondary mt-2">
            Find answers to common questions and learn how to make the most of your admin system
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquareIcon className="w-8 h-8 text-brand-purple mx-auto mb-3" />
              <h3 className="font-semibold text-text-primary mb-2">Live Chat</h3>
              <p className="text-text-secondary text-sm mb-4">
                Get instant help from our support team
              </p>
              <Button variant="outline" size="sm">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <MailIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-text-primary mb-2">Email Support</h3>
              <p className="text-text-secondary text-sm mb-4">
                Send us a detailed message
              </p>
              <Button variant="outline" size="sm">
                <MailIcon className="w-4 h-4 mr-2" />
                support@love4detailing.com
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <PhoneIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-text-primary mb-2">Phone Support</h3>
              <p className="text-text-secondary text-sm mb-4">
                Speak directly with our team
              </p>
              <Button variant="outline" size="sm">
                <PhoneIcon className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Resources */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">Getting Started Resources</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {helpResources.map((resource, index) => {
                const Icon = getResourceIcon(resource.type)
                return (
                  <div key={index} className="flex items-start space-x-3 p-4 border border-border-secondary rounded-lg hover:bg-surface-hover transition-colors">
                    <Icon className="w-5 h-5 text-brand-purple mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary">{resource.title}</h3>
                      <p className="text-text-secondary text-sm mt-1">{resource.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-text-muted text-xs">{resource.duration}</span>
                        <Button variant="outline" size="sm">
                          <ExternalLinkIcon className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">Frequently Asked Questions</h2>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border-secondary rounded-md"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border-secondary rounded-md"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* FAQ List */}
            <div className="space-y-2">
              {filteredFAQs.map((faq, index) => (
                <div key={index} className="border border-border-secondary rounded-lg">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-hover transition-colors"
                  >
                    <span className="font-medium text-text-primary">{faq.question}</span>
                    {expandedFAQ === index ? (
                      <ChevronDownIcon className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-4 pb-4">
                      <p className="text-text-secondary">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-8">
                <HelpCircleIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No FAQs found matching your search.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">System Status</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-text-primary">API Services</div>
                  <div className="text-text-secondary text-sm">Operational</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-text-primary">Database</div>
                  <div className="text-text-secondary text-sm">Connected</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-text-primary">Email System</div>
                  <div className="text-text-secondary text-sm">Active</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="text-center p-4 bg-surface-secondary rounded-lg border border-border-secondary">
          <p className="text-text-secondary">
            Still need help? Our support team is available Monday-Friday, 9 AM - 5 PM GMT.
          </p>
          <div className="flex justify-center items-center space-x-6 mt-3">
            <a 
              href="mailto:support@love4detailing.com" 
              className="text-brand-purple hover:text-brand-purple-dark transition-colors"
            >
              support@love4detailing.com
            </a>
            <span className="text-border-secondary">|</span>
            <span className="text-text-secondary">+44 (0) 123 456 7890</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}