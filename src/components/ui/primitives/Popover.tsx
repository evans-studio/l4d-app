'use client'

import React from 'react'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { cn } from '@/lib/utils'

export interface PopoverProps {
  trigger: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}

export const Popover: React.FC<PopoverProps> = ({ trigger, children, className, align = 'start' }) => {
  const [open, setOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLSpanElement | null>(null)

  const toggle = () => setOpen((o) => !o)
  const close = () => setOpen(false)

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const wrapper = wrapperRef.current
      if (!wrapper) return
      if (!wrapper.contains(e.target as Node)) close()
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <span ref={wrapperRef} className="relative inline-flex" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      {React.cloneElement(trigger, {
        onClick: () => toggle(),
      })}
      {open && (
        <div
          className={cn(
            'absolute z-[var(--z-popover,40)] mt-2 min-w-40 rounded-md border border-border-secondary bg-surface-card p-2 shadow-lg',
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'end' && 'right-0',
            className
          )}
          role="menu"
        >
          {children}
        </div>
      )}
    </span>
  )
}

export default Popover
