'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import type { PaginationMeta } from '@/lib/types/pagination.types'

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
}

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ meta, onPageChange, className }: PaginationProps) {
  if (meta.total_pages <= 1) return null

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1 mt-8', className)}
    >
      <button
        onClick={() => onPageChange(meta.page - 1)}
        disabled={!meta.has_prev}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-brand-green-lt hover:text-brand-green disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers(meta.page, meta.total_pages).map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-9 text-center text-text-subtle">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(Number(p))}
            aria-current={p === meta.page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 rounded-xl px-2.5 text-sm font-medium transition-colors',
              p === meta.page
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-text-body hover:bg-brand-green-lt hover:text-brand-green',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(meta.page + 1)}
        disabled={!meta.has_next}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-brand-green-lt hover:text-brand-green disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
