'use client'

import type { LucideIcon } from 'lucide-react'
import { ChevronLeft, ChevronRight, PawPrint } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useUiStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils/cn'

export interface SidebarItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

interface SidebarProps {
  items: SidebarItem[]
  title: string
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUiStore()

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-border bg-surface-white transition-all duration-300 lg:flex',
        sidebarOpen ? 'w-56' : 'w-16',
      )}
    >
      {/* Logo */}
      <Link
        href="/"
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border transition-colors hover:bg-surface-cream',
          sidebarOpen ? 'gap-2.5 px-4' : 'justify-center',
        )}
        title="Retour à l'accueil"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-green">
          <PawPrint className="h-4 w-4 text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-serif text-lg font-semibold text-text-ink">Compawgnon</span>
        )}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        {sidebarOpen && (
          <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
            {title}
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-surface-cream',
            !sidebarOpen && 'mx-auto',
          )}
          aria-label={sidebarOpen ? 'Réduire' : 'Étendre'}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/vendeur' && item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'border-l-2 border-brand-green bg-brand-green-lt text-brand-green'
                      : 'text-text-body hover:bg-surface-cream hover:text-text-ink',
                    !sidebarOpen && 'justify-center px-0',
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-brand-green' : 'text-text-subtle group-hover:text-text-ink')} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {!sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
