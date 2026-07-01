'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Settings,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { sellerAnimalsApi } from '@/lib/api/seller_animals.api'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { MessageBell } from '@/components/layout/MessageBell'
import { useAuth } from '@/hooks/useAuth'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { cn } from '@/lib/utils/cn'
import { useUiStore } from '@/stores/ui.store'

const NAV_LINKS = [
  { href: '/animaux', label: 'Animaux' },
  { href: '/especes', label: 'Espèces' },
]

const PAGE_TITLES: Record<string, string> = {
  '/vendeur':              'Tableau de bord',
  '/vendeur/animaux':      'Mes annonces',
  '/vendeur/reservations': 'Réservations',
  '/vendeur/profil':       'Mon profil',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/vendeur/animaux/nouvelle')) return 'Nouvelle annonce'
  if (/\/vendeur\/animaux\/\d+/.test(pathname)) return 'Modifier l\'annonce'
  return 'Espace vendeur'
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const base = name.includes('@') ? name.split('@')[0] : name
  const parts = base.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function UserAvatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const resolved = resolveUploadUrl(avatarUrl)
  if (resolved) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={resolved} alt={name ?? 'Avatar'} className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-green/20" />
    )
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-white ring-2 ring-brand-green/30">
      <span className="text-xs font-bold leading-none">{getInitials(name)}</span>
    </div>
  )
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { toggleSidebar } = useUiStore()
  const { user, logout } = useAuth()
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || null
  const firstName = user?.first_name?.trim() || null

  const { data: dashboard } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => sellerAnimalsApi.dashboard(),
    select: (res) => res.data,
    staleTime: 60_000,
  })

  const pendingReservations = dashboard?.pending_reservations_count ?? 0

  const sellerItems = [
    { label: 'Dashboard',     href: '/vendeur',              icon: LayoutDashboard },
    { label: 'Mes annonces',  href: '/vendeur/animaux',      icon: PawPrint },
    {
      label: 'Réservations',
      href: '/vendeur/reservations',
      icon: Bell,
      badge: pendingReservations > 0 ? pendingReservations : undefined,
    },
    { label: 'Mon profil',    href: '/vendeur/profil',       icon: User },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-surface-cream">
      <Sidebar items={sellerItems} title="Espace vendeur" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-surface-white px-6">
          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-1.5 text-text-subtle hover:bg-surface-cream lg:flex"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title — left */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-lg text-text-ink">{getPageTitle(pathname)}</h2>
            <p className="truncate text-xs text-text-subtle">Gérez votre activité de vente</p>
          </div>

          {/* Nav links — center */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-brand-green-lt text-brand-green'
                    : 'text-text-subtle hover:bg-surface-cream hover:text-text-body',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions — right */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <MessageBell />
            <NotificationBell />

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm text-text-body transition-all hover:border-brand-green/30 hover:bg-brand-green-lt">
                  <UserAvatar name={fullName ?? user?.email ?? null} avatarUrl={user?.avatar_url ?? null} />
                  <span className="hidden max-w-[120px] truncate font-medium sm:block">{firstName ?? 'Vendeur'}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-text-subtle" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-surface-white shadow-xl animate-scale-in"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-medium text-text-ink">{fullName ?? 'Vendeur'}</p>
                    <p className="truncate text-xs text-text-subtle">{user?.email}</p>
                  </div>

                  <div className="p-1">
                    <DropdownMenu.Item asChild>
                      <Link href="/compte" className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-body outline-none transition-colors hover:bg-brand-green-lt hover:text-brand-green">
                        <User className="h-4 w-4" /> Mon compte
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link href="/vendeur/profil" className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-body outline-none transition-colors hover:bg-brand-green-lt hover:text-brand-green">
                        <Settings className="h-4 w-4" /> Profil vendeur
                      </Link>
                    </DropdownMenu.Item>
                  </div>

                  <div className="border-t border-border p-1">
                    <DropdownMenu.Item asChild>
                      <button onClick={logout} className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50">
                        <LogOut className="h-4 w-4" /> Se déconnecter
                      </button>
                    </DropdownMenu.Item>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
