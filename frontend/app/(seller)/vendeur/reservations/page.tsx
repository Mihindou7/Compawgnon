'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Ban,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  PartyPopper,
  X,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { sellerAnimalsApi } from '@/lib/api/seller_animals.api'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { AccountHeader } from '@/components/account/AccountHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatPrice } from '@/lib/utils/formatters'
import type { Reservation, ReservationStatus } from '@/lib/types/api.types'

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

function ResponseModal({
  reservation,
  action,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  reservation: Reservation | null
  action: 'accept' | 'reject'
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (message: string) => void
  isLoading: boolean
}) {
  const [message, setMessage] = useState('')

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={action === 'accept' ? 'Accepter la demande' : 'Refuser la demande'}
      size="sm"
    >
      <div className="space-y-4">
        {reservation && (
          <p className="text-sm text-text-body">
            Demande de{' '}
            <span className="font-medium">{reservation.buyer?.first_name ?? "l'acheteur"}</span>
            {' '}pour <span className="font-medium">{reservation.animal.title}</span>.
          </p>
        )}
        <textarea
          placeholder={action === 'accept' ? 'Message de confirmation (optionnel)…' : 'Raison du refus (optionnel)…'}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-none rounded-xl border border-border bg-surface-cream px-4 py-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
        />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant={action === 'accept' ? 'primary' : 'danger'}
            className="flex-1"
            isLoading={isLoading}
            onClick={() => { onSubmit(message); setMessage('') }}
          >
            {action === 'accept' ? 'Accepter' : 'Refuser'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function SellerReservationsPage() {
  const reduce = useReducedMotion()
  const queryClient = useQueryClient()
  const [modalState, setModalState] = useState<{ res: Reservation; action: 'accept' | 'reject' } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['seller-reservations'],
    queryFn: () => sellerAnimalsApi.listReservations(),
    select: (res) => res.data,
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, action, message }: { id: number; action: 'accept' | 'reject'; message: string }) =>
      action === 'accept'
        ? sellerAnimalsApi.acceptReservation(id, message || undefined)
        : sellerAnimalsApi.rejectReservation(id, message || undefined),
    onSuccess: (_, vars) => {
      toast.success(vars.action === 'accept' ? 'Demande acceptée !' : 'Demande refusée.')
      queryClient.invalidateQueries({ queryKey: ['seller-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] })
      setModalState(null)
    },
    onError: () => toast.error('Impossible de répondre à la demande.'),
  })

  const count = data?.length ?? 0
  const pendingCount = data?.filter((r) => r.status === 'pending').length ?? 0

  return (
    <div>
      <AccountHeader
        icon={Bell}
        title="Réservations"
        description="Consultez et répondez aux demandes de réservation pour vos annonces."
        count={count}
        countLabel={count > 1 ? 'demandes' : 'demande'}
      />

      {!isLoading && pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <Clock className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{pendingCount}</span>
            {' '}demande{pendingCount > 1 ? 's' : ''} en attente de votre réponse.
          </p>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune réservation"
          description="Les demandes de réservation pour vos annonces apparaîtront ici."
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
            const cover = resolveUploadUrl(res.animal.cover_url)

            return (
              <motion.div
                key={res.id}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-surface-white p-5 transition-all duration-200 hover:border-brand-green/30 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.06)]"
              >
                <Link
                  href={`/animaux/${res.animal.id}`}
                  target="_blank"
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-cream"
                >
                  {cover ? (
                    <Image
                      src={cover}
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
                        target="_blank"
                      >
                        {res.animal.title}
                      </Link>
                      <p className="text-sm font-semibold text-brand-green">{formatPrice(res.animal.price)}</p>
                    </div>
                    <Badge variant={cfg.variant} className="inline-flex items-center gap-1">
                      <StatusIcon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-text-subtle">
                    Acheteur&nbsp;:{' '}
                    <span className="font-medium text-text-ink">
                      {res.buyer?.first_name ?? 'Anonyme'}
                      {res.buyer?.last_name ? ` ${res.buyer.last_name}` : ''}
                    </span>
                  </p>

                  {res.message && (
                    <div className="mt-2 rounded-lg border-l-2 border-brand-green/40 bg-surface-cream p-3 text-sm text-text-body">
                      <span className="font-medium">Message de l&apos;acheteur&nbsp;:</span> &ldquo;{res.message}&rdquo;
                    </div>
                  )}

                  <p className="mt-1.5 text-xs text-text-subtle">
                    Reçue le {formatDate(res.created_at)}
                  </p>

                  {res.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        leftIcon={Check}
                        onClick={() => setModalState({ res, action: 'accept' })}
                      >
                        Accepter
                      </Button>
                      <Button
                        variant="danger-outline"
                        size="sm"
                        leftIcon={X}
                        onClick={() => setModalState({ res, action: 'reject' })}
                      >
                        Refuser
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <ResponseModal
        reservation={modalState?.res ?? null}
        action={modalState?.action ?? 'accept'}
        open={modalState !== null}
        onOpenChange={(open) => !open && setModalState(null)}
        onSubmit={(message) => {
          if (!modalState) return
          respondMutation.mutate({ id: modalState.res.id, action: modalState.action, message })
        }}
        isLoading={respondMutation.isPending}
      />
    </div>
  )
}
