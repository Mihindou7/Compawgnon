'use client'

import { cn } from '@/lib/utils/cn'

export interface FilterTab<T extends string> {
  value: T
  label: string
  count?: number
}

interface FilterTabsProps<T extends string> {
  filters: FilterTab<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function FilterTabs<T extends string>({
  filters,
  value,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((f) => {
        const active = value === f.value
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
              active
                ? 'border-brand-green bg-brand-green-lt text-brand-green shadow-sm'
                : 'border-border bg-surface-white text-text-body hover:border-brand-green/20 hover:bg-surface-cream',
            )}
          >
            {f.label}
            {f.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs font-semibold',
                  active ? 'bg-brand-green text-white' : 'bg-surface-cream text-text-subtle',
                )}
              >
                {f.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
