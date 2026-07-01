'use client'

import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  side?: 'left' | 'right' | 'bottom'
}

const variants = {
  left:   { hidden: { x: '-100%' }, visible: { x: 0 } },
  right:  { hidden: { x: '100%' },  visible: { x: 0 } },
  bottom: { hidden: { y: '100%' },  visible: { y: 0 } },
}

const positionClasses = {
  left:   'inset-y-0 left-0 h-full w-80 max-w-[90vw] rounded-r-2xl',
  right:  'inset-y-0 right-0 h-full w-80 max-w-[90vw] rounded-l-2xl',
  bottom: 'inset-x-0 bottom-0 w-full max-h-[90vh] rounded-t-2xl',
}

export function Drawer({ open, onOpenChange, title, children, side = 'right' }: DrawerProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onOpenChange])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Panel'}
            className={cn(
              'fixed z-50 bg-surface-white shadow-2xl flex flex-col',
              positionClasses[side],
            )}
            initial={variants[side].hidden}
            animate={variants[side].visible}
            exit={variants[side].hidden}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              {title && <p className="font-medium text-text-ink">{title}</p>}
              <button
                onClick={() => onOpenChange(false)}
                className="ml-auto rounded-lg p-1.5 text-text-subtle transition-colors hover:bg-surface-cream hover:text-text-ink"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
