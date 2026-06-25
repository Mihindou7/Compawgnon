'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/lib/utils/cn'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideClose?: boolean
}

const sizes = {
  sm:  'max-w-sm',
  md:  'max-w-lg',
  lg:  'max-w-2xl',
  xl:  'max-w-4xl',
}

export function Modal({ open, onOpenChange, title, description, children, size = 'md', hideClose }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 px-4',
                  sizes[size],
                )}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="relative rounded-2xl border border-border bg-surface-white shadow-2xl">
                  {!hideClose && (
                    <Dialog.Close
                      className="absolute right-4 top-4 rounded-lg p-1.5 text-text-subtle transition-colors hover:bg-surface-cream hover:text-text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                      aria-label="Fermer"
                    >
                      <X className="h-4 w-4" />
                    </Dialog.Close>
                  )}
                  {(title || description) && (
                    <div className="border-b border-border px-6 py-5">
                      {title && (
                        <Dialog.Title className="font-serif text-xl text-text-ink">{title}</Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1 text-sm text-text-subtle">{description}</Dialog.Description>
                      )}
                    </div>
                  )}
                  <div className="p-6">{children}</div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
