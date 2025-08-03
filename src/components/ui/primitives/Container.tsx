'use client'

import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const containerVariants = cva(
  'w-full mx-auto',
  {
    variants: {
      size: {
        sm: 'max-w-2xl',
        md: 'max-w-4xl',
        lg: 'max-w-6xl',
        xl: 'max-w-7xl',
        full: 'max-w-full',
        none: '' // No max-width constraint
      },
      padding: {
        none: '',
        sm: 'px-4 sm:px-6',
        md: 'px-4 sm:px-6 lg:px-8',
        lg: 'px-6 sm:px-8 lg:px-12',
        xl: 'px-8 sm:px-12 lg:px-16'
      },
      centered: {
        true: 'text-center',
        false: ''
      }
    },
    defaultVariants: {
      size: 'lg',
      padding: 'md',
      centered: false
    }
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: 'div' | 'section' | 'main' | 'article' | 'header' | 'footer'
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, centered, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={containerVariants({ size, padding, centered, className })}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'

// Specialized container variants
export const PageContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'as'>>(
  ({ className, ...props }, ref) => (
    <Container
      ref={ref}
      as="main"
      className={`min-h-screen py-8 ${className || ''}`}
      {...props}
    />
  )
)

PageContainer.displayName = 'PageContainer'

export const SectionContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'as'>>(
  ({ className, ...props }, ref) => (
    <Container
      ref={ref}
      as="section"
      className={`py-12 ${className || ''}`}
      {...props}
    />
  )
)

SectionContainer.displayName = 'SectionContainer'

export const ContentContainer = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <Container
      ref={ref}
      size={size}
      className={`prose prose-gray max-w-none ${className || ''}`}
      {...props}
    />
  )
)

ContentContainer.displayName = 'ContentContainer'

// Demo component for documentation
export const ContainerDemo = () => {
  return (
    <div className="space-y-8 p-6 bg-gray-50">
      <div>
        <h3 className="text-lg font-semibold mb-4">Container Sizes</h3>
        
        <div className="space-y-4">
          <Container size="sm" className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Small container (max-w-2xl)</p>
          </Container>
          
          <Container size="md" className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Medium container (max-w-4xl)</p>
          </Container>
          
          <Container size="lg" className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Large container (max-w-6xl)</p>
          </Container>
          
          <Container size="xl" className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Extra large container (max-w-7xl)</p>
          </Container>
          
          <Container size="full" className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Full width container (max-w-full)</p>
          </Container>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Padding Variants</h3>
        
        <div className="space-y-4">
          <Container padding="none" className="bg-white border rounded-lg">
            <div className="bg-blue-100 p-2">
              <p className="text-sm text-gray-600">No padding</p>
            </div>
          </Container>
          
          <Container padding="sm" className="bg-white border rounded-lg">
            <div className="bg-blue-100 -mx-4 sm:-mx-6 p-2">
              <p className="text-sm text-gray-600 px-4 sm:px-6">Small padding (px-4 sm:px-6)</p>
            </div>
          </Container>
          
          <Container padding="md" className="bg-white border rounded-lg">
            <div className="bg-blue-100 -mx-4 sm:-mx-6 lg:-mx-8 p-2">
              <p className="text-sm text-gray-600 px-4 sm:px-6 lg:px-8">Medium padding (px-4 sm:px-6 lg:px-8)</p>
            </div>
          </Container>
          
          <Container padding="lg" className="bg-white border rounded-lg">
            <div className="bg-blue-100 -mx-6 sm:-mx-8 lg:-mx-12 p-2">
              <p className="text-sm text-gray-600 px-6 sm:px-8 lg:px-12">Large padding (px-6 sm:px-8 lg:px-12)</p>
            </div>
          </Container>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Specialized Containers</h3>
        
        <div className="space-y-4">
          <PageContainer size="md" className="bg-white border rounded-lg min-h-32">
            <h4 className="text-lg font-medium mb-2">Page Container</h4>
            <p className="text-sm text-gray-600">
              Main container for page content with min-height and vertical padding
            </p>
          </PageContainer>
          
          <SectionContainer size="lg" className="bg-white border rounded-lg">
            <h4 className="text-lg font-medium mb-2">Section Container</h4>
            <p className="text-sm text-gray-600">
              Container for page sections with consistent vertical spacing
            </p>
          </SectionContainer>
          
          <ContentContainer className="bg-white border rounded-lg p-6">
            <h4 className="text-lg font-medium mb-2">Content Container</h4>
            <p className="text-sm text-gray-600 mb-4">
              Optimized for readable content with typography styling.
            </p>
            <p className="text-sm text-gray-600">
              Perfect for articles, blog posts, and long-form content.
            </p>
          </ContentContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Centered Content</h3>
        
        <Container centered className="bg-white border rounded-lg p-8">
          <h4 className="text-lg font-medium mb-2">Centered Container</h4>
          <p className="text-sm text-gray-600">
            All content within this container is center-aligned
          </p>
        </Container>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Semantic Elements</h3>
        
        <div className="space-y-4">
          <Container as="header" className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-brand-900">Header Container</h4>
            <p className="text-sm text-brand-700">Using semantic &lt;header&gt; element</p>
          </Container>
          
          <Container as="section" className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-green-900">Section Container</h4>
            <p className="text-sm text-green-700">Using semantic &lt;section&gt; element</p>
          </Container>
          
          <Container as="footer" className="bg-gray-100 border border-gray-300 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900">Footer Container</h4>
            <p className="text-sm text-gray-700">Using semantic &lt;footer&gt; element</p>
          </Container>
        </div>
      </div>
    </div>
  )
}