'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle,
  LayoutDashboard,
  PawPrint,
  Star,
  TrendingUp,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { sellerAnimalsApi } from '@/lib/api/seller_animals.api'
import { SellerQuickLink } from '@/components/seller/SellerQuickLink'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
}) {
  return (
    <div className="flex h-full items-center gap-3.5 rounded-2xl border border-border bg-surface-white p-5 transition-all duration-200 hover:border-brand-green/30 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.06)]">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-serif text-2xl leading-none text-text-ink">{value}</p>
        <p className="mt-1 text-xs text-text-subtle">{label}</p>
      </div>
    </div>
  )
}

export default function SellerDashboardPage() {
  const reduce = useReducedMotion()
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => sellerAnimalsApi.dashboard(),
    select: (res) => res.data,
  })

  const stats = data
    ? [
        { label: 'Publiées', value: data.published_count, icon: CheckCircle, color: 'bg-brand-green-lt text-brand-green' },
        { label: 'En attente', value: data.pending_count, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
        { label: 'Réservées', value: data.reserved_count, icon: Bell, color: 'bg-blue-50 text-blue-600' },
        { label: 'Vendues', value: data.sold_count, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
      ]
    : []

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-8"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/20 bg-brand-green-lt px-3 py-1 text-sm font-medium text-brand-green">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Tableau de bord
        </span>
        <h1 className="mt-3 font-serif text-3xl text-text-ink sm:text-4xl">
          Bonjour{user?.first_name ? `, ${user.first_name}` : ''} 👋
        </h1>
        <p className="mt-2 max-w-xl text-text-body">
          Pilotez votre activité en un coup d&apos;œil : annonces, réservations en attente et satisfaction clients.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : data ? (
        <>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } }}
            className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))}
          </motion.div>

          {data.pending_reservations_count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-amber-900">
                    {data.pending_reservations_count} demande{data.pending_reservations_count > 1 ? 's' : ''} en attente
                  </p>
                  <p className="text-sm text-amber-700">Répondez rapidement pour rassurer vos acheteurs.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" asChild>
                <Link href="/vendeur/reservations">
                  Voir les demandes <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>
          )}

          {data.average_rating != null && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface-white p-5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                <Star className="h-6 w-6 fill-gold text-gold" />
              </span>
              <div>
                <p className="font-serif text-2xl text-text-ink">{data.average_rating.toFixed(1)} / 5</p>
                <p className="text-sm text-text-subtle">{data.reviews_count} avis client{data.reviews_count > 1 ? 's' : ''}</p>
              </div>
            </motion.div>
          )}
        </>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
        className="mt-10"
      >
        <h2 className="mb-4 font-serif text-xl text-text-ink">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SellerQuickLink
            icon={PawPrint}
            label="Nouvelle annonce"
            description="Publier un nouvel animal"
            href="/vendeur/animaux/nouvelle"
            color="bg-brand-green-lt text-brand-green"
          />
          <SellerQuickLink
            icon={LayoutDashboard}
            label="Mes annonces"
            description="Gérer le catalogue"
            href="/vendeur/animaux"
            color="bg-blue-50 text-blue-600"
          />
          <SellerQuickLink
            icon={Bell}
            label="Réservations"
            description="Répondre aux acheteurs"
            href="/vendeur/reservations"
            color="bg-amber-50 text-amber-600"
          />
          <SellerQuickLink
            icon={User}
            label="Mon profil vendeur"
            description="Informations de la boutique"
            href="/vendeur/profil"
            color="bg-violet-50 text-violet-600"
          />
        </div>
      </motion.div>
    </div>
  )
}
