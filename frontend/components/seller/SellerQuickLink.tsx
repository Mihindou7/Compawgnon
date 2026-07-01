'use client'

import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

export function SellerQuickLink({
  icon: Icon,
  label,
  description,
  href,
  color,
}: {
  icon: LucideIcon
  label: string
  description: string
  href: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.06)]"
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110',
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-ink">{label}</p>
        <p className="truncate text-xs text-text-subtle">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-subtle transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
