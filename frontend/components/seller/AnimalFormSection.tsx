'use client'

import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils/cn'

interface AnimalFormSectionProps {
  icon: LucideIcon
  title: string
  description?: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
  delay?: number
  id?: string
}

export function AnimalFormSection({
  icon: Icon,
  title,
  description,
  badge,
  children,
  className,
  delay = 0,
  id,
}: AnimalFormSectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      className={cn(
        'rounded-2xl border border-border bg-surface-white p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]',
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-lt text-brand-green">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl text-text-ink">{title}</h2>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-sm text-text-subtle">{description}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  )
}
