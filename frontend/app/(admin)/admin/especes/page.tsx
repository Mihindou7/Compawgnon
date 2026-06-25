'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import Link from 'next/link'

import { speciesApi } from '@/lib/api/species.api'
import { AccountHeader } from '@/components/account/AccountHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import type { Species } from '@/lib/types/api.types'

const SPECIES_EMOJIS: Record<string, string> = {
  chien: '🐕', chat: '🐈', lapin: '🐇', oiseau: '🦜',
  rongeur: '🐹', reptile: '🦎', poisson: '🐠', autre: '🐾',
}

export default function AdminEspecesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesApi.list(),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  })

  const columns: Column<Species>[] = [
    {
      key: 'name',
      header: 'Espèce',
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{SPECIES_EMOJIS[s.slug] ?? '🐾'}</span>
          <div>
            <p className="font-medium text-text-ink">{s.name}</p>
            <p className="text-xs text-text-subtle">{s.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'breeds',
      header: 'Races',
      render: (s) => <Badge variant="gray">{s.breeds_count ?? 0}</Badge>,
    },
    {
      key: 'animals',
      header: 'Annonces',
      render: (s) => (
        <Link href={`/admin/annonces?species_slug=${s.slug}`} className="font-medium text-brand-green hover:underline">
          {s.available_animals_count ?? 0}
        </Link>
      ),
    },
    {
      key: 'lifespan',
      header: 'Durée de vie',
      render: (s) => <span className="text-sm text-text-subtle">{s.life_span ?? '—'}</span>,
    },
    {
      key: 'maintenance',
      header: 'Entretien',
      render: (s) => (
        s.maintenance_level ? (
          <Badge variant={s.maintenance_level === 'low' ? 'green' : s.maintenance_level === 'medium' ? 'amber' : 'red'}>
            {s.maintenance_level === 'low' ? 'Facile' : s.maintenance_level === 'medium' ? 'Moyen' : 'Exigeant'}
          </Badge>
        ) : <span className="text-text-subtle">—</span>
      ),
    },
  ]

  const count = data?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={FileText}
        title="Espèces"
        description="Catalogue des espèces et races disponibles sur la plateforme."
        count={count}
        countLabel={count > 1 ? 'espèces' : 'espèce'}
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        keyExtractor={(s) => s.id}
        emptyMessage="Aucune espèce trouvée"
      />
    </div>
  )
}
