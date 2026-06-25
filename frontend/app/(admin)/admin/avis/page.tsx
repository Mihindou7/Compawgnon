'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, MessageSquare, Star } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Suspense } from 'react'

import { adminApi } from '@/lib/api/admin.api'
import { AccountHeader } from '@/components/account/AccountHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { FilterTabs } from '@/components/admin/FilterTabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate, truncate } from '@/lib/utils/formatters'
import type { Review, ReviewStatus } from '@/lib/types/api.types'

const STATUS_VARIANT: Record<ReviewStatus, 'amber' | 'green' | 'gray'> = {
  pending:   'amber',
  published: 'green',
  hidden:    'gray',
}

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending:   'En attente',
  published: 'Publié',
  hidden:    'Masqué',
}

const STATUS_FILTERS = [
  { value: 'all',       label: 'Tous' },
  { value: 'pending',   label: 'En attente' },
  { value: 'published', label: 'Publiés' },
  { value: 'hidden',    label: 'Masqués' },
] as const

function AvisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const statusParam = searchParams.get('status')
  const statusFilter = (statusParam === 'pending' || statusParam === 'published' || statusParam === 'hidden')
    ? statusParam
    : 'all'
  const status = statusFilter === 'all' ? undefined : statusFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, status],
    queryFn: () => adminApi.listReviews({ page, status }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
  }

  const publishMutation = useMutation({
    mutationFn: (id: number) => adminApi.publishReview(id),
    onSuccess: () => { toast.success('Avis publié.'); invalidate() },
    onError: () => toast.error('Erreur.'),
  })

  const hideMutation = useMutation({
    mutationFn: (id: number) => adminApi.hideReview(id),
    onSuccess: () => { toast.success('Avis masqué.'); invalidate() },
    onError: () => toast.error('Erreur.'),
  })

  const columns: Column<Review>[] = [
    {
      key: 'buyer',
      header: 'Acheteur',
      render: (r) => <span>{r.buyer?.first_name ?? 'Anonyme'}</span>,
    },
    {
      key: 'seller',
      header: 'Vendeur',
      render: (r) => <span>{r.seller?.name ?? '—'}</span>,
    },
    {
      key: 'rating',
      header: 'Note',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="font-medium">{r.rating}/5</span>
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Commentaire',
      render: (r) => (
        <p className="max-w-xs text-sm italic text-text-subtle">
          {r.comment ? `"${truncate(r.comment, 80)}"` : '—'}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (r) => <span className="text-xs">{formatDate(r.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '160px',
      render: (r) => (
        <div className="flex gap-1.5">
          {r.status !== 'published' && (
            <Button size="sm" leftIcon={Eye} onClick={() => publishMutation.mutate(r.id)}>Publier</Button>
          )}
          {r.status !== 'hidden' && (
            <Button variant="outline" size="sm" leftIcon={EyeOff} onClick={() => hideMutation.mutate(r.id)}>Masquer</Button>
          )}
        </div>
      ),
    },
  ]

  const total = data?.meta?.total ?? data?.data?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={MessageSquare}
        title="Avis"
        description="Modérez les avis laissés par les acheteurs sur les vendeurs."
        count={total}
        countLabel={total > 1 ? 'avis' : 'avis'}
      />

      <FilterTabs
        filters={[...STATUS_FILTERS]}
        value={statusFilter}
        onChange={(v) => {
          setPage(1)
          router.replace(v === 'all' ? '/admin/avis' : `/admin/avis?status=${v}`)
        }}
        className="mb-5"
      />

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="Aucun avis trouvé"
      />

      {data?.meta && data.meta.total_pages > 1 && (
        <Pagination meta={data.meta} onPageChange={setPage} className="mt-6" />
      )}
    </div>
  )
}

export default function AdminAvisPage() {
  return (
    <Suspense>
      <AvisContent />
    </Suspense>
  )
}
