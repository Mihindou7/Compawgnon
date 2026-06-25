'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

interface TabItem {
  value: string
  label: string
  badge?: number
}

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  items: TabItem[]
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, value, onValueChange, items, children, className }: TabsProps) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      <RadixTabs.List className="mb-6 flex gap-1 rounded-xl bg-surface-cream p-1">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              'text-text-subtle hover:text-text-body',
              'data-[state=active]:bg-surface-white data-[state=active]:text-text-ink data-[state=active]:shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green',
            )}
          >
            <span className="flex items-center gap-2">
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {item.badge}
                </span>
              )}
            </span>
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  )
}

export const TabsContent = RadixTabs.Content
