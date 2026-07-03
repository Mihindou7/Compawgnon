'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils/cn'
import type { SidebarItem } from './Sidebar'

export function MobileNavPills({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border bg-surface-white px-4 py-2.5 lg:hidden">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/vendeur' && item.href !== '/admin' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
              isActive
                ? 'border-brand-green bg-brand-green text-white'
                : 'border-border bg-surface-white text-text-body',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={cn(
                  'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  isActive ? 'bg-white text-brand-green' : 'bg-brand-green text-white',
                )}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
