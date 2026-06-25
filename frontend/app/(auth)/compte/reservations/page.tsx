'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { Ban, Calendar, CheckCircle2, Clock, PartyPopper, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

import { reservationsApi } from '@/lib/api/reservations.api'
import { AccountHeader } from '@/components/account/AccountHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatPrice } from '@/lib/utils/formatters'
import { resolveUploadUrl } from '@/lib/utils/urls'
import type { ReservationStatus } from '@/lib/types/api.types'

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; variant: 'gray' | 'amber' | 'green' | 'red' | 'blue'; icon: LucideIcon }
> = {
  pending:   { label: 'En attente', variant: 'amber', icon: Clock },
  accepted:  { label: 'Acceptée',   variant: 'green', icon: CheckCircle2 },
  rejected:  { label: 'Refusée',    variant: 'red',   icon: XCircle },
  cancelled: { label: 'Annulée',    variant: 'gray',  icon: Ban },
  completed: { label: 'Terminée',   variant: 'blue',  icon: PartyPopper },
}

export default function ReservationsPage() {
  const reduce = useReducedMotion()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsApi.list(),
    select: (res) => res.data,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => reservationsApi.cancel(id),
    onSuccess: () => {
      toast.success('Réservation annulée.')
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: () => toast.error('Impossible d\'annuler la réservation.'),
  })

  const count = data?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={Calendar}
        title="Mes réservations"
        description="Suivez l'état de vos demandes d'adoption et les réponses des vendeurs."
        count={count}
        countLabel={count > 1 ? 'demandes' : 'demande'}
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucune réservation"
          description="Vous n'avez pas encore fait de demande de réservation."
          action={{ label: 'Trouver un animal', href: '/animaux' }}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
          className="space-y-4"
        >
          {data.map((res) => {
            const cfg = STATUS_CONFIG[res.status]
            const StatusIcon = cfg.icon
            return (
              <motion.div
                key={res.id}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-surface-white p-5 transition-all duration-200 hover:border-brand-green/30 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.06)]"
              >
                {/* Animal image */}
                <Link
                  href={`/animaux/${res.animal.id}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-cream"
                >
                  {res.animal.cover_url ? (
                    <Image
                      src={resolveUploadUrl(res.animal.cover_url) ?? res.animal.cover_url}
                      alt={res.animal.title}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🐾</div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/animaux/${res.animal.id}`}
                        className="font-medium text-text-ink transition-colors hover:text-brand-green"
                      >
                        {res.animal.title}
                      </Link>
                      <p className="text-sm font-semibold text-brand-green">
                        {formatPrice(res.animal.price)}
                      </p>
                    </div>
                    <Badge variant={cfg.variant} className="inline-flex items-center gap-1">
                      <StatusIcon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </Badge>
                  </div>

                  {res.seller && (
                    <p className="mt-1 text-sm text-text-subtle">
                      Vendeur&nbsp;: {res.seller.name}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-text-subtle">
                    Demande envoyée le {formatDate(res.created_at)}
                  </p>

                  {res.seller_response && (
                    <div className="mt-2 rounded-lg border-l-2 border-brand-green/40 bg-surface-cream p-3 text-sm text-text-body">
                      <span className="font-medium">Réponse du vendeur&nbsp;:</span> {res.seller_response}
                    </div>
                  )}

                  {res.status === 'pending' && (
                    <Button
                      variant="danger-outline"
                      size="sm"
                      className="mt-3"
                      isLoading={cancelMutation.isPending && cancelMutation.variables === res.id}
                      onClick={() => cancelMutation.mutate(res.id)}
                    >
                      Annuler la demande
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
