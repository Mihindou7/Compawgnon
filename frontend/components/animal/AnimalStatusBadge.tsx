import { Badge } from '@/components/ui/Badge'
import type { AnimalStatus } from '@/lib/types/api.types'
import { cn } from '@/lib/utils/cn'

const STATUS_CONFIG: Record<AnimalStatus, { label: string; variant: 'green' | 'amber' | 'gray' | 'blue' | 'red' }> = {
  published:     { label: 'Disponible',    variant: 'green' },
  reserved:      { label: 'Réservé',       variant: 'amber' },
  sold:          { label: 'Vendu',         variant: 'gray' },
  pending_review:{ label: 'En validation', variant: 'blue' },
  draft:         { label: 'Brouillon',     variant: 'gray' },
  archived:      { label: 'Archivé',       variant: 'gray' },
}

interface AnimalStatusBadgeProps {
  status: AnimalStatus
  className?: string
}

export function AnimalStatusBadge({ status, className }: AnimalStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  if (!config) return null
  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  )
}
