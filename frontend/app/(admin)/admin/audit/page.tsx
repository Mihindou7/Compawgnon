'use client'

import { useQuery } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { useState } from 'react'

import { adminApi } from '@/lib/api/admin.api'
import { AccountHeader } from '@/components/account/AccountHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils/formatters'
import type { AuditLog } from '@/lib/types/api.types'
import { Badge } from '@/components/ui/Badge'

const ACTION_VARIANT: Record<string, 'green' | 'red' | 'amber' | 'gray'> = {
  create:  'green',
  update:  'amber',
  delete:  'red',
  approve: 'green',
  reject:  'red',
}

const ACTION_LABEL: Record<string, string> = {
  create:  'Création',
  update:  'Modification',
  delete:  'Suppression',
  approve: 'Approbation',
  reject:  'Refus',
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', page],
    queryFn: () => adminApi.listAuditLogs({ page }),
  })

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (l) => (
        <Badge variant={ACTION_VARIANT[l.action] ?? 'gray'}>
          {ACTION_LABEL[l.action] ?? l.action}
        </Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Entité',
      render: (l) => (
        <span className="text-sm">
          {l.entity_type} <span className="text-text-subtle">#{l.entity_id}</span>
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Acteur',
      render: (l) => (
        <div>
          <p className="text-sm font-medium text-text-ink">{l.actor.email}</p>
          {l.ip_address && <p className="text-xs text-text-subtle">{l.ip_address}</p>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (l) => <span className="text-xs">{formatDate(l.created_at)}</span>,
    },
  ]

  const total = data?.meta?.total ?? data?.data?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={ScrollText}
        title="Journal d'audit"
        description="Historique des actions effectuées sur la plateforme."
        count={total}
        countLabel={total > 1 ? 'événements' : 'événement'}
      />

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        keyExtractor={(l) => l.id}
        emptyMessage="Aucun événement enregistré"
      />

      {data?.meta && data.meta.total_pages > 1 && (
        <Pagination meta={data.meta} onPageChange={setPage} className="mt-6" />
      )}
    </div>
  )
}
