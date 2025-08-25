'use client'

import React from 'react'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className, side = 'top', delay = 250 }) => {
  const [open, setOpen] = React.useState(false)
  const timer = React.useRef<number | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setOpen(false)
  }

  const triggerProps = {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    ref: (node: HTMLElement) => { triggerRef.current = node },
    'aria-describedby': open ? 'tooltip' : undefined,
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }[side]

  return (
    <span className="relative inline-flex" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      {React.cloneElement(children, triggerProps)}
      {open && (
        <span
          role="tooltip"
          id="tooltip"
          className={cn(
            'pointer-events-none absolute z-[var(--z-popover,40)] rounded-md bg-black/80 px-2 py-1 text-xs text-white shadow-lg backdrop-blur-sm',
            positionClasses,
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}

export default Tooltip
