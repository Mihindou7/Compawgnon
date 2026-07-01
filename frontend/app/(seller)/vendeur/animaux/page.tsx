'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Edit,
  Eye,
  MapPin,
  PawPrint,
  Plus,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { sellerAnimalsApi } from '@/lib/api/seller_animals.api'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { AccountHeader } from '@/components/account/AccountHeader'
import { FilterTabs } from '@/components/admin/FilterTabs'
import { AnimalStatusBadge } from '@/components/animal/AnimalStatusBadge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/utils/formatters'
import type { Animal, AnimalStatus } from '@/lib/types/api.types'

const STATUS_FILTERS = [
  { value: 'all',            label: 'Toutes' },
  { value: 'published',      label: 'Publiées' },
  { value: 'pending_review', label: 'En validation' },
  { value: 'draft',          label: 'Brouillons' },
  { value: 'reserved',       label: 'Réservées' },
  { value: 'sold',           label: 'Vendues' },
  { value: 'archived',       label: 'Archivées' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']

function countByStatus(animals: Animal[], status: AnimalStatus) {
  return animals.filter((a) => a.status === status).length
}

export default function SellerAnimauxPage() {
  const reduce = useReducedMotion()
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['seller-animals'],
    queryFn: () => sellerAnimalsApi.list(),
    select: (res) => res.data,
  })

  const { data: dashboard } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => sellerAnimalsApi.dashboard(),
    select: (res) => res.data,
    staleTime: 60_000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sellerAnimalsApi.delete(id),
    onSuccess: () => {
      toast.success('Annonce supprimée.')
      queryClient.invalidateQueries({ queryKey: ['seller-animals'] })
      queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Impossible de supprimer l\'annonce.'),
  })

  const filtered = useMemo(() => {
    if (!data) return []
    if (statusFilter === 'all') return data
    return data.filter((a) => a.status === statusFilter)
  }, [data, statusFilter])

  const filterTabs = STATUS_FILTERS.map((f) => ({
    ...f,
    count: data
      ? f.value === 'all'
        ? data.length
        : countByStatus(data, f.value as AnimalStatus)
      : undefined,
  }))

  const stats = dashboard
    ? [
        { label: 'Publiées', value: dashboard.published_count, color: 'text-brand-green' },
        { label: 'En attente', value: dashboard.pending_count, color: 'text-amber-600' },
        { label: 'Réservées', value: dashboard.reserved_count, color: 'text-blue-600' },
        { label: 'Vendues', value: dashboard.sold_count, color: 'text-purple-600' },
      ]
    : []

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <AccountHeader
          icon={PawPrint}
          title="Mes annonces"
          description="Créez, modifiez et suivez le statut de vos annonces."
          count={data?.length ?? 0}
          countLabel={(data?.length ?? 0) > 1 ? 'annonces' : 'annonce'}
          className="mb-0 flex-1"
        />
        <Button asChild className="shrink-0">
          <Link href="/vendeur/animaux/nouvelle">
            <Plus className="h-4 w-4" />
            Nouvelle annonce
          </Link>
        </Button>
      </div>

      {dashboard && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-surface-white px-4 py-3 text-center"
            >
              <p className={`font-serif text-2xl leading-none ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-xs text-text-subtle">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {!isLoading && data && data.length > 0 && (
        <FilterTabs
          filters={filterTabs}
          value={statusFilter}
          onChange={setStatusFilter}
          className="mb-5"
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Aucune annonce"
          description="Créez votre première annonce pour commencer à vendre."
          action={{ label: 'Créer une annonce', href: '/vendeur/animaux/nouvelle' }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Aucune annonce dans cette catégorie"
          description="Essayez un autre filtre ou créez une nouvelle annonce."
          action={{ label: 'Voir toutes', onClick: () => setStatusFilter('all') }}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
          className="space-y-3"
        >
          {filtered.map((animal) => {
            const cover = resolveUploadUrl(animal.cover_url)

            return (
              <motion.div
                key={animal.id}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface-white p-4 transition-all duration-200 hover:border-brand-green/30 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.06)] sm:flex-row sm:items-center"
              >
                <Link
                  href={`/vendeur/animaux/${animal.id}`}
                  className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-surface-cream sm:h-20 sm:w-20"
                >
                  {cover ? (
                    <Image
                      src={cover}
                      alt={animal.title}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🐾</div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/vendeur/animaux/${animal.id}`}
                      className="truncate font-medium text-text-ink transition-colors hover:text-brand-green"
                    >
                      {animal.title}
                    </Link>
                    <AnimalStatusBadge status={animal.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-semibold text-brand-green">{formatPrice(animal.price)}</p>
                    {animal.species && (
                      <p className="text-sm text-text-subtle">
                        {animal.species.name}
                        {animal.breed ? ` · ${animal.breed.name}` : ''}
                      </p>
                    )}
                    {animal.city && (
                      <p className="flex items-center gap-1 text-sm text-text-subtle">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {animal.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <Button variant="outline" size="icon-sm" asChild title="Prévisualiser">
                    <Link href={`/animaux/${animal.id}`} target="_blank">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon-sm" asChild title="Modifier">
                    <Link href={`/vendeur/animaux/${animal.id}`}>
                      <Edit className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="danger-outline"
                    size="icon-sm"
                    onClick={() => setDeleteId(animal.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer l'annonce"
        description="Cette action est irréversible. L'annonce sera définitivement supprimée."
        confirmLabel="Supprimer"
        onConfirm={() => { if (deleteId !== null) deleteMutation.mutate(deleteId) }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
