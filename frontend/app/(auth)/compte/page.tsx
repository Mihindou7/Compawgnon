'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Calendar, CheckCircle2, ChevronRight, Clock, Heart, LayoutDashboard, RotateCcw, ShieldCheck, Star, Store, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { useAuth } from '@/hooks/useAuth'
import { useFavorites } from '@/hooks/useFavorites'
import { reservationsApi } from '@/lib/api/reservations.api'
import { reviewsApi } from '@/lib/api/reviews.api'
import { sellerApplyApi } from '@/lib/api/sellers_apply.api'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  color,
}: {
  icon: LucideIcon
  label: string
  value: number
  hint?: string
  href: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="group relative block h-full rounded-2xl border border-border bg-surface-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.06)]"
    >
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-serif text-3xl font-bold text-text-ink">{value}</p>
      <p className="text-sm text-text-subtle">{label}</p>
      {hint && <p className="mt-0.5 text-xs font-medium text-brand-green">{hint}</p>}
      <ChevronRight className="absolute right-4 top-5 h-4 w-4 text-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}

function QuickLink({
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

function SellerStatusBanner({ status }: { status: 'pending' | 'approved' | 'rejected' | null | undefined }) {
  // Vendeur certifié
  if (status === 'approved') {
    return (
      <div className="flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-brand-green/20 bg-brand-green-lt p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-text-ink">Vous êtes vendeur certifié 🎉</h3>
            <p className="text-sm text-text-body">
              Gérez vos annonces et vos réservations depuis votre espace vendeur.
            </p>
          </div>
        </div>
        <Link
          href="/vendeur"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-green-dk"
        >
          Mon espace vendeur <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // Demande en cours d'examen
  if (status === 'pending') {
    return (
      <div className="flex items-start gap-3 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Clock className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg text-text-ink">Demande vendeur en cours d&apos;examen</h3>
            <Badge variant="amber" size="sm">En attente</Badge>
          </div>
          <p className="mt-0.5 text-sm text-text-body">
            Votre candidature a bien été reçue. Notre équipe l&apos;étudie et reviendra vers vous
            sous 48h ouvrables — pas besoin d&apos;en déposer une nouvelle.
          </p>
        </div>
      </div>
    )
  }

  // Demande refusée — possibilité de retenter
  if (status === 'rejected') {
    return (
      <div className="flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-text-ink">Votre demande n&apos;a pas été retenue</h3>
            <p className="text-sm text-text-body">
              Vous pouvez corriger vos informations et soumettre une nouvelle candidature.
            </p>
          </div>
        </div>
        <Link
          href="/compte/devenir-vendeur"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-red-300 bg-surface-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
        >
          Refaire une demande <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // Aucune demande — invitation à postuler
  return (
    <div className="relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-brand-green/20 bg-brand-green-lt p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green text-white">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-text-ink">Vous êtes éleveur ou animalerie&nbsp;?</h3>
          <p className="text-sm text-text-body">
            Publiez vos annonces et touchez des milliers d&apos;adoptants potentiels.
          </p>
        </div>
      </div>
      <Link
        href="/compte/devenir-vendeur"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-green-dk"
      >
        Déposer une demande <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export default function CompteHomePage() {
  const reduce = useReducedMotion()
  const { user, isVerified, isSeller, isAdmin, sellerStatus } = useAuth()

  const { data: favorites } = useFavorites()
  const { data: reservations } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsApi.list(),
    select: (res) => res.data,
  })
  const { data: reviews } = useQuery({
    queryKey: ['me-reviews'],
    queryFn: () => reviewsApi.list(),
    select: (res) => res.data,
  })
  const { data: myStore } = useQuery({
    queryKey: ['seller-me'],
    queryFn: () => sellerApplyApi.getMyStore(),
    retry: false,
  })

  // Statut vendeur le plus fiable : la candidature en base prime sur le JWT
  const effectiveSellerStatus = myStore?.data?.verified_status ?? sellerStatus

  const favCount = favorites?.length ?? 0
  const resCount = reservations?.length ?? 0
  const pendingRes = reservations?.filter((r) => r.status === 'pending').length ?? 0
  const reviewCount = reviews?.length ?? 0

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ')
  const greetingName = user?.first_name || fullName || 'à vous'
  const avatarUrl = resolveUploadUrl(user?.avatar_url ?? null)
  const initials =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .map((s) => s![0].toUpperCase())
      .join('') || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="font-serif text-3xl text-text-ink">Bonjour {greetingName} 👋</h1>
        <p className="mt-1 text-text-subtle">Bienvenue sur votre espace personnel Compawgnon.</p>
      </motion.div>

      {/* Carte profil */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface-white p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-green-lt">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="font-serif text-xl font-bold text-brand-green">{initials}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-text-ink">{fullName || 'Profil incomplet'}</p>
            <p className="text-sm text-text-subtle">{user?.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {isVerified ? (
                <Badge variant="green" size="sm" dot>Email vérifié</Badge>
              ) : (
                <Badge variant="amber" size="sm" dot>Email non vérifié</Badge>
              )}
              {isAdmin && <Badge variant="purple" size="sm">Administrateur</Badge>}
              {isSeller && <Badge variant="blue" size="sm">Vendeur</Badge>}
            </div>
          </div>
        </div>
        <Link
          href="/compte/profil"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-body transition-colors hover:border-brand-green/30 hover:bg-brand-green-lt hover:text-brand-green"
        >
          <User className="h-4 w-4" /> Modifier le profil
        </Link>
      </motion.div>

      {/* Statistiques */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { delayChildren: 0.1, staggerChildren: reduce ? 0 : 0.08 } } }}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[
          { icon: Heart, label: 'Favoris', value: favCount, href: '/compte/favoris', color: 'bg-red-50 text-red-500', hint: undefined as string | undefined },
          { icon: Calendar, label: 'Réservations', value: resCount, href: '/compte/reservations', color: 'bg-amber-50 text-amber-600', hint: pendingRes > 0 ? `${pendingRes} en attente` : undefined },
          { icon: Star, label: 'Avis publiés', value: reviewCount, href: '/compte/avis', color: 'bg-blue-50 text-blue-600', hint: undefined },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: reduce ? 0 : 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
            }}
          >
            <StatCard
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              href={stat.href}
              color={stat.color}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Accès rapides */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
        className="mt-10"
      >
        <h2 className="mb-4 font-serif text-xl text-text-ink">Accès rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickLink icon={User} label="Mon profil" description="Coordonnées et photo" href="/compte/profil" color="bg-violet-50 text-violet-600" />
          <QuickLink icon={Heart} label="Mes favoris" description="Vos animaux sauvegardés" href="/compte/favoris" color="bg-red-50 text-red-500" />
          <QuickLink icon={Calendar} label="Mes réservations" description="Suivi de vos demandes" href="/compte/reservations" color="bg-amber-50 text-amber-600" />
          <QuickLink icon={Star} label="Mes avis" description="Vos évaluations" href="/compte/avis" color="bg-blue-50 text-blue-600" />
          {isSeller && (
            <QuickLink icon={LayoutDashboard} label="Espace vendeur" description="Gérez vos annonces" href="/vendeur" color="bg-brand-green-lt text-brand-green" />
          )}
          {isAdmin && (
            <QuickLink icon={ShieldCheck} label="Administration" description="Back-office" href="/admin" color="bg-purple-50 text-purple-600" />
          )}
        </div>
      </motion.div>

      {/* Bloc vendeur — adapté au statut de la candidature */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
        className="mt-8"
      >
        <SellerStatusBanner status={isSeller ? 'approved' : effectiveSellerStatus} />
      </motion.div>
    </div>
  )
}
