'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Check, PawPrint, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Suspense } from 'react'

import { adminApi } from '@/lib/api/admin.api'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { AccountHeader } from '@/components/account/AccountHeader'
import { AnimalStatusBadge } from '@/components/animal/AnimalStatusBadge'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { FilterTabs } from '@/components/admin/FilterTabs'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { formatPrice } from '@/lib/utils/formatters'
import type { Animal, AnimalStatus } from '@/lib/types/api.types'

const STATUS_FILTERS = [
  { value: 'all',            label: 'Toutes' },
  { value: 'pending_review', label: 'En attente' },
  { value: 'published',      label: 'Publiées' },
  { value: 'reserved',       label: 'Réservées' },
  { value: 'sold',           label: 'Vendues' },
  { value: 'archived',       label: 'Archivées' },
] as const

function AnnoncesContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)

  const statusParam = searchParams.get('status')
  const validStatuses: AnimalStatus[] = ['pending_review', 'published', 'reserved', 'sold', 'archived', 'draft']
  const statusFilter = statusParam && validStatuses.includes(statusParam as AnimalStatus)
    ? (statusParam as AnimalStatus)
    : 'all'
  const status = statusFilter === 'all' ? undefined : statusFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-animals', page, status],
    queryFn: () => adminApi.listAnimals({ page, status }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-animals'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
  }

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveAnimal(id),
    onSuccess: () => { toast.success('Annonce publiée !'); invalidate() },
    onError: () => toast.error('Impossible de publier l\'annonce.'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminApi.rejectAnimal(id),
    onSuccess: () => { toast.success('Annonce refusée.'); invalidate() },
    onError: () => toast.error('Impossible de refuser l\'annonce.'),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: number) => adminApi.archiveAnimal(id),
    onSuccess: () => { toast.success('Annonce archivée.'); invalidate() },
    onError: () => toast.error('Impossible d\'archiver l\'annonce.'),
  })

  const columns: Column<Animal>[] = [
    {
      key: 'animal',
      header: 'Annonce',
      render: (a) => {
        const cover = resolveUploadUrl(a.cover_url)
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-cream">
              {cover ? (
                <Image src={cover} alt={a.title} fill sizes="48px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm">🐾</div>
              )}
            </div>
            <div>
              <Link href={`/animaux/${a.id}`} target="_blank" className="font-medium text-text-ink transition-colors hover:text-brand-green">
                {a.title}
              </Link>
              <p className="text-xs text-text-subtle">{a.species?.name}{a.breed ? ` · ${a.breed.name}` : ''}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'seller',
      header: 'Vendeur',
      render: (a) => <span className="text-sm">{a.seller?.name ?? '—'}</span>,
    },
    {
      key: 'price',
      header: 'Prix',
      render: (a) => <span className="font-medium text-brand-green">{formatPrice(a.price)}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (a) => <AnimalStatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (a) => (
        <div className="flex gap-1.5">
          {a.status === 'pending_review' && (
            <>
              <Button size="sm" leftIcon={Check} onClick={() => approveMutation.mutate(a.id)}
                isLoading={approveMutation.isPending && approveMutation.variables === a.id}>
                Valider
              </Button>
              <Button variant="danger-outline" size="sm" leftIcon={X} onClick={() => rejectMutation.mutate(a.id)}>
                Refuser
              </Button>
            </>
          )}
          {a.status === 'published' && (
            <Button variant="outline" size="sm" leftIcon={Archive} onClick={() => archiveMutation.mutate(a.id)}>
              Archiver
            </Button>
          )}
        </div>
      ),
    },
  ]

  const total = data?.meta?.total ?? data?.data?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={PawPrint}
        title="Annonces"
        description="Modérez, publiez ou archivez les annonces de la plateforme."
        count={total}
        countLabel={total > 1 ? 'annonces' : 'annonce'}
      />

      <FilterTabs
        filters={[...STATUS_FILTERS]}
        value={statusFilter}
        onChange={(v) => {
          setPage(1)
          router.replace(v === 'all' ? '/admin/annonces' : `/admin/annonces?status=${v}`)
        }}
        className="mb-5"
      />

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        keyExtractor={(a) => a.id}
        emptyMessage="Aucune annonce trouvée"
      />

      {data?.meta && data.meta.total_pages > 1 && (
        <Pagination meta={data.meta} onPageChange={setPage} className="mt-6" />
      )}
    </div>
  )
}

export default function AdminAnnoncesPage() {
  return (
    <Suspense>
      <AnnoncesContent />
    </Suspense>
  )
}
