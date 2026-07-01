'use client'

import { Eye, Pencil } from 'lucide-react'
import Link from 'next/link'

import { AnimalStatusBadge } from '@/components/animal/AnimalStatusBadge'
import { Button } from '@/components/ui/Button'
import type { AnimalStatus } from '@/lib/types/api.types'

const PREVIEW_STATUSES: AnimalStatus[] = ['draft', 'pending_review', 'archived']

export function AnimalPreviewBanner({
  status,
  animalId,
}: {
  status: AnimalStatus
  animalId: number
}) {
  if (!PREVIEW_STATUSES.includes(status)) return null

  const messages: Partial<Record<AnimalStatus, string>> = {
    draft: 'Brouillon — visible uniquement par vous.',
    pending_review: 'En validation — visible uniquement par vous en attendant la modération.',
    archived: 'Archivée — visible uniquement par vous.',
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Eye className="h-4 w-4" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-amber-900">Mode prévisualisation</p>
            <AnimalStatusBadge status={status} />
          </div>
          <p className="mt-0.5 text-sm text-amber-800">
            {messages[status]} Les acheteurs ne verront cette annonce qu&apos;une fois publiée.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100" asChild>
        <Link href={`/vendeur/animaux/${animalId}`}>
          <Pencil className="h-3.5 w-3.5" />
          Modifier l&apos;annonce
        </Link>
      </Button>
    </div>
  )
}
