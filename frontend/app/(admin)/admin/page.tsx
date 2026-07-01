'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  PawPrint,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { adminApi } from '@/lib/api/admin.api'
import { SellerQuickLink } from '@/components/seller/SellerQuickLink'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  alert,
  href,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
  alert?: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full items-center gap-3.5 rounded-2xl border border-border bg-surface-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.06)]"
    >
      {alert && (
        <span className="absolute right-4 top-4 flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
      )}
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-serif text-2xl leading-none text-text-ink">{value}</p>
        <p className="mt-1 text-xs text-text-subtle">{label}</p>
      </div>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const reduce = useReducedMotion()
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard(),
    select: (res) => res.data,
  })

  const stats = data
    ? [
        { label: 'Utilisateurs',    value: data.users.total,       icon: Users,         color: 'bg-blue-50 text-blue-600',              href: '/admin/utilisateurs' },
        { label: 'Vendeurs',        value: data.sellers.total,     icon: ShieldCheck,   color: 'bg-brand-green-lt text-brand-green',    alert: data.sellers.pending > 0,         href: '/admin/vendeurs' },
        { label: 'Annonces actives', value: data.animals.published, icon: PawPrint,     color: 'bg-purple-50 text-purple-600',          alert: data.animals.pending_review > 0,  href: '/admin/annonces' },
        { label: 'Avis',            value: data.reviews.published, icon: MessageSquare, color: 'bg-amber-50 text-amber-600',            alert: data.reviews.pending > 0,         href: '/admin/avis' },
      ]
    : []

  const pendingTotal = data
    ? data.sellers.pending + data.animals.pending_review + data.reviews.pending
    : 0

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
          Administration
        </span>
        <h1 className="mt-3 font-serif text-3xl text-text-ink sm:text-4xl">
          Bonjour{user?.first_name ? `, ${user.first_name}` : ''} 👋
        </h1>
        <p className="mt-2 max-w-xl text-text-body">
          Vue d&apos;ensemble de la plateforme — modération, utilisateurs et activité en temps réel.
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
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
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

          {pendingTotal > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-8"
            >
              <h2 className="mb-4 font-serif text-xl text-text-ink">Actions requises</h2>
              <div className="space-y-3">
                {data.sellers.pending > 0 && (
                  <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-medium text-amber-900">
                          {data.sellers.pending} vendeur{data.sellers.pending > 1 ? 's' : ''} à valider
                        </p>
                        <p className="text-sm text-amber-700">Vérifiez les dossiers en attente de certification.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" asChild>
                      <Link href="/admin/vendeurs?status=pending">
                        Traiter <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
                {data.animals.pending_review > 0 && (
                  <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                        <PawPrint className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-medium text-purple-900">
                          {data.animals.pending_review} annonce{data.animals.pending_review > 1 ? 's' : ''} à modérer
                        </p>
                        <p className="text-sm text-purple-700">Publiez ou refusez les annonces en attente.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100" asChild>
                      <Link href="/admin/annonces?status=pending_review">
                        Traiter <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
                {data.reviews.pending > 0 && (
                  <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <MessageSquare className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-medium text-blue-900">
                          {data.reviews.pending} avis à modérer
                        </p>
                        <p className="text-sm text-blue-700">Publiez ou masquez les avis en attente.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100" asChild>
                      <Link href="/admin/avis?status=pending">
                        Traiter <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
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
        <h2 className="mb-4 font-serif text-xl text-text-ink">Accès rapide</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SellerQuickLink
            icon={Users}
            label="Utilisateurs"
            description="Gérer les comptes"
            href="/admin/utilisateurs"
            color="bg-blue-50 text-blue-600"
          />
          <SellerQuickLink
            icon={ShieldCheck}
            label="Vendeurs"
            description="Valider les candidatures"
            href="/admin/vendeurs"
            color="bg-brand-green-lt text-brand-green"
          />
          <SellerQuickLink
            icon={PawPrint}
            label="Annonces"
            description="Modérer le catalogue"
            href="/admin/annonces"
            color="bg-purple-50 text-purple-600"
          />
          <SellerQuickLink
            icon={Inbox}
            label="Contacts"
            description="Répondre aux messages"
            href="/admin/contacts"
            color="bg-amber-50 text-amber-600"
          />
          <SellerQuickLink
            icon={FileText}
            label="Espèces"
            description="Catalogue des espèces"
            href="/admin/especes"
            color="bg-violet-50 text-violet-600"
          />
          <SellerQuickLink
            icon={ScrollText}
            label="Journal d'audit"
            description="Historique des actions"
            href="/admin/audit"
            color="bg-slate-100 text-slate-600"
          />
        </div>
      </motion.div>
    </div>
  )
}
