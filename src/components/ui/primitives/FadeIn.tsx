'use client'

import React from 'react'
import { m } from 'framer-motion'

interface FadeInProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  delayMs?: number
  as?: keyof React.JSX.IntrinsicElements
}

export function FadeIn({ children, delayMs = 0, as = 'div', className, ...rest }: FadeInProps) {
  const ref = React.useRef<HTMLElement | null>(null)

  // Framer Motion path (preferred)
  const motionDict = m as unknown as Record<string, React.ComponentType<any>>
  const MotionTag = motionDict[as] || motionDict.div
  if (MotionTag) {
    return (
      <MotionTag
        ref={ref as unknown as React.Ref<HTMLElement>}
        className={className}
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15, margin: '0px 0px -80px 0px' }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: delayMs / 1000 }}
        {...rest}
      >
        {children}
      </MotionTag>
    )
  }

  const Component = as as keyof React.JSX.IntrinsicElements
  return React.createElement(Component as React.ElementType, { ref: ref as unknown as React.Ref<HTMLElement>, className, ...rest }, children)
}


