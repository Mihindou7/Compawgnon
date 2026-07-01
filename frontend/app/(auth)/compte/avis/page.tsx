'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { Star } from 'lucide-react'

import { reviewsApi } from '@/lib/api/reviews.api'
import { AccountHeader } from '@/components/account/AccountHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils/formatters'

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-gold text-gold' : 'fill-border text-border'}`}
        />
      ))}
    </div>
  )
}

const STATUS_LABELS: Record<string, { label: string; variant: 'amber' | 'green' | 'gray' }> = {
  pending:   { label: 'En attente',  variant: 'amber' },
  published: { label: 'Publié',      variant: 'green' },
  hidden:    { label: 'Masqué',      variant: 'gray' },
}

export default function AvisPage() {
  const reduce = useReducedMotion()
  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewsApi.list(),
    select: (res) => res.data,
  })

  const count = data?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={Star}
        title="Mes avis"
        description="Les évaluations que vous avez laissées après vos adoptions."
        count={count}
        countLabel={count > 1 ? 'avis' : 'avis'}
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Aucun avis pour l'instant"
          description="Vos avis apparaîtront ici après chaque adoption finalisée."
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
          className="space-y-4"
        >
          {data.map((review) => {
            const s = STATUS_LABELS[review.status] ?? STATUS_LABELS.pending
            return (
              <motion.div
                key={review.id}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
                className="rounded-2xl border border-border bg-surface-white p-5 transition-all duration-200 hover:border-brand-green/30 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-text-ink">{review.seller.name}</p>
                    <StarDisplay rating={review.rating} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    <p className="text-xs text-text-subtle">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 border-l-2 border-gold/40 pl-3 text-sm italic text-text-body">
                    “{review.comment}”
                  </p>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
