'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, Heart, MessageSquare, Star, Store, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { messagesApi } from '@/lib/api/messages.api'
import { reservationsApi } from '@/lib/api/reservations.api'
import { useAuth } from '@/hooks/useAuth'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { cn } from '@/lib/utils/cn'

const BASE_ITEMS = [
  { href: '/compte/profil',           label: 'Mon profil',       icon: User },
  { href: '/compte/favoris',          label: 'Mes favoris',      icon: Heart },
  { href: '/compte/reservations',     label: 'Mes réservations', icon: Calendar },
  { href: '/compte/messages',         label: 'Messages',         icon: MessageSquare },
  { href: '/compte/avis',             label: 'Mes avis',         icon: Star },
  { href: '/compte/devenir-vendeur',  label: 'Devenir vendeur',  icon: Store },
]

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  const { data: msgData } = useQuery({
    queryKey: ['messages-unread-count'],
    queryFn: () => messagesApi.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 20_000,
    staleTime: 15_000,
    select: (res) => res.data?.unread ?? 0,
  })

  const { data: resData } = useQuery({
    queryKey: ['reservations-count'],
    queryFn: () => reservationsApi.count(),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    staleTime: 30_000,
    select: (res) => res.data,
  })

  const unreadMessages     = msgData ?? 0
  const pendingReservations = resData?.pending ?? 0

  const badges: Record<string, number> = {
    '/compte/messages':     unreadMessages,
    '/compte/reservations': pendingReservations,
  }

  const current = BASE_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  const breadcrumbItems = [
    { label: 'Accueil', href: '/' },
    current
      ? { label: 'Mon compte', href: '/compte' }
      : { label: 'Mon compte' },
    ...(current ? [{ label: current.label }] : []),
  ]

  return (
    <>
      <Breadcrumb items={breadcrumbItems} className="mb-6" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">

        {/* Sidebar nav — desktop */}
        <nav className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-8">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
              Mon espace
            </p>
            <ul className="space-y-0.5">
              {BASE_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const badge  = badges[item.href] ?? 0
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-brand-green-lt text-brand-green'
                          : 'text-text-body hover:bg-surface-cream hover:text-text-ink',
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-brand-green' : 'text-text-subtle')} />
                      {item.label}
                      <Badge count={badge} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {BASE_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const badge  = badges[item.href] ?? 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                  active
                    ? 'border-brand-green bg-brand-green text-white'
                    : 'border-border bg-surface-white text-text-body',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {badge > 0 && (
                  <span className={cn(
                    'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                    active ? 'bg-white text-brand-green' : 'bg-brand-green text-white',
                  )}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  )
}
