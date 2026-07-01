'use client'

import { LayoutDashboard, LogOut, PawPrint, ShieldCheck, User, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'

const NAV_LINKS = [
  { href: '/animaux',  label: 'Animaux' },
  { href: '/especes',  label: 'Espèces' },
]

interface NavbarMobileProps {
  open: boolean
  onClose: () => void
}

export function NavbarMobile({ open, onClose }: NavbarMobileProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth()

  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  React.useEffect(() => {
    onClose()
  }, [pathname])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface-white shadow-2xl md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-green">
                  <PawPrint className="h-4 w-4 text-white" />
                </div>
                <span className="font-serif text-xl text-text-ink">Compawgnon</span>
              </Link>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-cream"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      pathname.startsWith(link.href)
                        ? 'bg-brand-green-lt text-brand-green'
                        : 'text-text-body hover:bg-surface-cream',
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {isAuthenticated && (
                <div className="mt-6 space-y-1 border-t border-border pt-6">
                  <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-text-subtle">Mon espace</p>
                  <Link href="/compte" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-text-body hover:bg-surface-cream">
                    <User className="h-4 w-4" /> Mon compte
                  </Link>
                  {isSeller && (
                    <Link href="/vendeur" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-text-body hover:bg-surface-cream">
                      <LayoutDashboard className="h-4 w-4" /> Espace vendeur
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-text-body hover:bg-surface-cream">
                      <ShieldCheck className="h-4 w-4" /> Administration
                    </Link>
                  )}
                </div>
              )}
            </nav>

            {/* Footer */}
            <div className="border-t border-border p-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-xl bg-surface-cream px-3 py-2">
                    {user?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar_url}
                        alt="Avatar"
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-white">
                        <span className="text-xs font-bold leading-none">
                          {(() => {
                            const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || ''
                            if (!name) return '?'
                            const base = name.includes('@') ? name.split('@')[0] : name
                            const parts = base.trim().split(/\s+/).filter(Boolean)
                            if (parts.length === 1) return parts[0][0].toUpperCase()
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                          })()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-ink">
                        {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Mon compte'}
                      </p>
                      <p className="truncate text-xs text-text-subtle">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button variant="primary" className="w-full" asChild>
                    <Link href="/inscription">S&apos;inscrire</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/connexion">Se connecter</Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
