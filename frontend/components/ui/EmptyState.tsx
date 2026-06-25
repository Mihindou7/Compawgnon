import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils/cn'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green-lt">
          <Icon className="h-8 w-8 text-brand-green" />
        </div>
      )}
      <h3 className="font-serif text-xl text-text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-text-subtle">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Button variant="primary" asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
