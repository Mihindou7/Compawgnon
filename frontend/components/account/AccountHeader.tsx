'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

interface AccountHeaderProps {
  icon: LucideIcon
  title: string
  description?: string
  count?: number
  countLabel?: string
  className?: string
}

export function AccountHeader({
  icon: Icon,
  title,
  description,
  count,
  countLabel,
  className,
}: AccountHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('mb-7 flex items-center gap-4', className)}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green-lt text-brand-green">
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <h1 className="font-serif text-3xl text-text-ink">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-text-subtle">{description}</p>}
      </div>
      {count != null && count > 0 && (
        <span className="ml-auto shrink-0 rounded-full bg-brand-green-lt px-3 py-1 text-sm font-semibold text-brand-green">
          {count}
          {countLabel ? ` ${countLabel}` : ''}
        </span>
      )}
    </motion.div>
  )
}
