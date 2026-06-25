'use client'

import type { AnimalStatus } from '@/lib/types/api.types'
import { AlertCircle, CheckCircle2, Clock, Eye, FileEdit } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/Button'

const STATUS_BANNERS: Partial<Record<AnimalStatus, {
  icon: typeof Clock
  title: string
  description: string
  className: string
  iconClassName: string
}>> = {
  draft: {
    icon: FileEdit,
    title: 'Brouillon',
    description: 'Complétez votre annonce puis soumettez-la pour validation par notre équipe.',
    className: 'border-border bg-surface-cream',
    iconClassName: 'bg-surface-white text-text-subtle',
  },
  pending_review: {
    icon: Clock,
    title: 'En cours de validation',
    description: 'Votre annonce est examinée par notre équipe. Vous serez notifié dès qu\'elle sera publiée.',
    className: 'border-blue-200 bg-blue-50',
    iconClassName: 'bg-blue-100 text-blue-600',
  },
  published: {
    icon: CheckCircle2,
    title: 'Annonce publiée',
    description: 'Votre annonce est visible par les acheteurs sur la plateforme.',
    className: 'border-brand-green/30 bg-brand-green-lt',
    iconClassName: 'bg-brand-green/10 text-brand-green',
  },
  reserved: {
    icon: AlertCircle,
    title: 'Animal réservé',
    description: 'Une demande de réservation a été acceptée. L\'annonce reste visible avec le statut « Réservé ».',
    className: 'border-amber-200 bg-amber-50',
    iconClassName: 'bg-amber-100 text-amber-600',
  },
  sold: {
    icon: CheckCircle2,
    title: 'Vendu',
    description: 'Cette annonce est marquée comme vendue et n\'apparaît plus dans le catalogue public.',
    className: 'border-border bg-surface-cream',
    iconClassName: 'bg-surface-white text-text-subtle',
  },
  archived: {
    icon: FileEdit,
    title: 'Archivée',
    description: 'Cette annonce n\'est plus visible. Vous pouvez la soumettre à nouveau pour republication.',
    className: 'border-border bg-surface-cream',
    iconClassName: 'bg-surface-white text-text-subtle',
  },
}

export function AnimalStatusBanner({
  status,
  animalId,
}: {
  status: AnimalStatus
  animalId?: number
}) {
  const cfg = STATUS_BANNERS[status]
  if (!cfg) return null

  const Icon = cfg.icon

  return (
    <div className={`mb-6 flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${cfg.className}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.iconClassName}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium text-text-ink">{cfg.title}</p>
          <p className="mt-0.5 text-sm text-text-body">{cfg.description}</p>
        </div>
      </div>
      {animalId && (
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href={`/animaux/${animalId}`} target="_blank">
            <Eye className="h-3.5 w-3.5" />
            {status === 'published' || status === 'reserved' ? 'Voir en ligne' : 'Prévisualiser'}
          </Link>
        </Button>
      )}
    </div>
  )
}
