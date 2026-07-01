'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { adminApi } from '@/lib/api/admin.api'
import { AccountHeader } from '@/components/account/AccountHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { FilterTabs } from '@/components/admin/FilterTabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils/formatters'
import type { Seller } from '@/lib/types/api.types'

const STATUS_VARIANT = {
  pending:  'amber',
  approved: 'green',
  rejected: 'red',
} as const

const STATUS_FILTERS = [
  { value: 'all',      label: 'Tous' },
  { value: 'pending',  label: 'En attente' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Refusés' },
] as const

function VendeursContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)
  const [rejectModal, setRejectModal] = useState<Seller | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const statusParam = searchParams.get('status')
  const statusFilter = (statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected')
    ? statusParam
    : 'all'
  const status = statusFilter === 'all' ? undefined : statusFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sellers', page, status],
    queryFn: () => adminApi.listSellers({ page, status }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveSeller(id),
    onSuccess: () => {
      toast.success('Vendeur approuvé !')
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: () => toast.error('Impossible d\'approuver le vendeur.'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.rejectSeller(id, reason || undefined),
    onSuccess: () => {
      toast.success('Vendeur refusé.')
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setRejectModal(null)
      setRejectReason('')
    },
    onError: () => toast.error('Impossible de refuser le vendeur.'),
  })

  const columns: Column<Seller>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (s) => (
        <div>
          <p className="font-medium text-text-ink">{s.name}</p>
          <p className="text-xs text-text-subtle capitalize">{s.type === 'breeder' ? 'Éleveur' : 'Animalerie'}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Localisation',
      render: (s) => <span>{s.city} {s.postal_code}</span>,
    },
    {
      key: 'siret',
      header: 'SIRET',
      render: (s) => <span className="font-mono text-xs">{s.siret}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (s) => (
        <Badge variant={STATUS_VARIANT[s.verified_status] ?? 'gray'}>
          {s.verified_status === 'pending' ? 'En attente' : s.verified_status === 'approved' ? 'Approuvé' : 'Refusé'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '160px',
      render: (s) =>
        s.verified_status === 'pending' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              leftIcon={Check}
              isLoading={approveMutation.isPending && approveMutation.variables === s.id}
              onClick={() => approveMutation.mutate(s.id)}
            >
              Approuver
            </Button>
            <Button
              variant="danger-outline"
              size="sm"
              leftIcon={X}
              onClick={() => setRejectModal(s)}
            >
              Refuser
            </Button>
          </div>
        ) : null,
    },
  ]

  const total = data?.meta?.total ?? data?.data?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={ShieldCheck}
        title="Vendeurs"
        description="Validez les candidatures et gérez les profils vendeurs certifiés."
        count={total}
        countLabel={total > 1 ? 'vendeurs' : 'vendeur'}
      />

      <FilterTabs
        filters={[...STATUS_FILTERS]}
        value={statusFilter}
        onChange={(v) => { setPage(1); router.replace(v === 'all' ? '/admin/vendeurs' : `/admin/vendeurs?status=${v}`) }}
        className="mb-5"
      />

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        keyExtractor={(s) => s.id}
        emptyMessage="Aucun vendeur trouvé"
      />

      {data?.meta && data.meta.total_pages > 1 && (
        <Pagination meta={data.meta} onPageChange={setPage} className="mt-6" />
      )}

      <Modal
        open={rejectModal !== null}
        onOpenChange={(open) => !open && setRejectModal(null)}
        title="Refuser le vendeur"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-body">
            Raison du refus pour <span className="font-medium">{rejectModal?.name}</span> (optionnel).
          </p>
          <textarea
            placeholder="Ex: Informations insuffisantes, SIRET invalide…"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full resize-none rounded-xl border border-border bg-surface-cream px-4 py-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Annuler</Button>
            <Button
              variant="danger"
              className="flex-1"
              isLoading={rejectMutation.isPending}
              onClick={() => rejectModal && rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason })}
            >
              Confirmer le refus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function AdminVendeursPage() {
  return (
    <Suspense>
      <VendeursContent />
    </Suspense>
  )
}
