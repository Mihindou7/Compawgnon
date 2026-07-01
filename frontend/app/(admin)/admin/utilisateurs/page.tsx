'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ShieldOff, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { adminApi } from '@/lib/api/admin.api'
import { AccountHeader } from '@/components/account/AccountHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils/formatters'
import type { User } from '@/lib/types/api.types'

export default function AdminUtilisateursPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminApi.listUsers({ page }),
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateUser(id, { status }),
    onSuccess: () => {
      toast.success('Statut mis à jour.')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Impossible de modifier le statut.'),
  })

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'Utilisateur',
      render: (u) => (
        <div>
          <p className="font-medium text-text-ink">
            {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email}
          </p>
          <p className="text-xs text-text-subtle">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Rôle',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.includes('ROLE_ADMIN')  && <Badge variant="purple">Admin</Badge>}
          {u.roles.includes('ROLE_SELLER') && <Badge variant="green">Vendeur</Badge>}
          {u.roles.includes('ROLE_USER')   && !u.roles.includes('ROLE_ADMIN') && !u.roles.includes('ROLE_SELLER') && (
            <Badge variant="gray">Utilisateur</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (u) => (
        <Badge variant={u.status === 'active' ? 'green' : 'red'}>
          {u.status === 'active' ? 'Actif' : 'Désactivé'}
        </Badge>
      ),
    },
    {
      key: 'verified',
      header: 'Email vérifié',
      render: (u) => (
        <Badge variant={u.is_verified ? 'green' : 'amber'}>
          {u.is_verified ? 'Vérifié' : 'Non vérifié'}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Inscription',
      render: (u) => <span className="text-xs">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (u) => (
        !u.roles.includes('ROLE_ADMIN') ? (
          <Button
            variant={u.status === 'active' ? 'danger-outline' : 'outline'}
            size="sm"
            leftIcon={u.status === 'active' ? ShieldOff : ShieldCheck}
            isLoading={toggleStatus.isPending && (toggleStatus.variables as { id: number })?.id === u.id}
            onClick={() => toggleStatus.mutate({ id: u.id, status: u.status === 'active' ? 'disabled' : 'active' })}
          >
            {u.status === 'active' ? 'Désactiver' : 'Activer'}
          </Button>
        ) : null
      ),
    },
  ]

  const total = data?.meta?.total ?? data?.data?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={Users}
        title="Utilisateurs"
        description="Consultez et gérez les comptes inscrits sur la plateforme."
        count={total}
        countLabel={total > 1 ? 'utilisateurs' : 'utilisateur'}
      />

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        keyExtractor={(u) => u.id}
        emptyMessage="Aucun utilisateur trouvé"
      />

      {data?.meta && data.meta.total_pages > 1 && (
        <Pagination meta={data.meta} onPageChange={setPage} className="mt-6" />
      )}
    </div>
  )
}
