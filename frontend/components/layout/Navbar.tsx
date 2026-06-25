'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils/cn'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { Button } from '@/components/ui/Button'
import { NotificationBell } from './NotificationBell'
import { MessageBell } from './MessageBell'
import { NavbarMobile } from './NavbarMobile'

const NAV_LINKS = [
  { href: '/animaux',  label: 'Animaux' },
  { href: '/especes',  label: 'Espèces' },
]

function getInitials(name: string | null): string {
  if (!name) return '?'
  // If it looks like an email, take the part before @
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

export function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || null
  const firstName = user?.first_name?.trim() || null

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 w-full transition-all duration-300',
          scrolled
            ? 'border-b border-border bg-surface-white/95 shadow-sm backdrop-blur-md'
            : 'border-b border-transparent bg-surface-white',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-green transition-transform duration-200 group-hover:scale-105">
              <PawPrint className="h-4 w-4 text-white" />
            </div>
            <span className="font-serif text-xl font-semibold text-text-ink">Compawgnon</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-brand-green-lt text-brand-green'
                    : 'text-text-body hover:bg-surface-cream hover:text-text-ink',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <MessageBell />
                <NotificationBell />
              </>
            )}
            {isAuthenticated ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="hidden items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm text-text-body transition-all hover:border-brand-green/30 hover:bg-brand-green-lt md:flex">
                    <UserAvatar name={fullName ?? user?.email ?? null} avatarUrl={user?.avatar_url ?? null} />
                    <span className="max-w-[120px] truncate font-medium">{firstName ?? 'Mon compte'}</span>
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
                      <p className="text-sm font-medium text-text-ink truncate">{fullName ?? 'Mon compte'}</p>
                      <p className="text-xs text-text-subtle truncate">{user?.email}</p>
                    </div>

                    <div className="p-1">
                      <DropdownMenu.Item asChild>
                        <Link href="/compte" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-body outline-none transition-colors hover:bg-brand-green-lt hover:text-brand-green cursor-pointer">
                          <User className="h-4 w-4" /> Mon compte
                        </Link>
                      </DropdownMenu.Item>

                      {isSeller && (
                        <DropdownMenu.Item asChild>
                          <Link href="/vendeur" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-body outline-none transition-colors hover:bg-brand-green-lt hover:text-brand-green cursor-pointer">
                            <LayoutDashboard className="h-4 w-4" /> Espace vendeur
                          </Link>
                        </DropdownMenu.Item>
                      )}

                      {isAdmin && (
                        <DropdownMenu.Item asChild>
                          <Link href="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-body outline-none transition-colors hover:bg-brand-green-lt hover:text-brand-green cursor-pointer">
                            <ShieldCheck className="h-4 w-4" /> Administration
                          </Link>
                        </DropdownMenu.Item>
                      )}

                      <DropdownMenu.Item asChild>
                        <Link href="/compte/profil" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-body outline-none transition-colors hover:bg-brand-green-lt hover:text-brand-green cursor-pointer">
                          <Settings className="h-4 w-4" /> Paramètres
                        </Link>
                      </DropdownMenu.Item>
                    </div>

                    <div className="border-t border-border p-1">
                      <DropdownMenu.Item asChild>
                        <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 cursor-pointer">
                          <LogOut className="h-4 w-4" /> Se déconnecter
                        </button>
                      </DropdownMenu.Item>
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/connexion">Se connecter</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/inscription">S&apos;inscrire</Link>
                </Button>
              </div>
            )}

            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text-body transition-colors hover:bg-surface-cream md:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <NavbarMobile open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
