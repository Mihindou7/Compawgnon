'use client'

import { useQuery } from '@tanstack/react-query'
import { MapPin, Shield, Star, Store } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { sellersApi } from '@/lib/api/sellers.api'
import { AnimalCard } from '@/components/animal/AnimalCard'
import { AnimalCardSkeleton } from '@/components/animal/AnimalCardSkeleton'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-gold text-gold' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-text-ink">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-sm text-text-subtle">({count} avis)</span>
      )}
    </div>
  )
}

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => sellersApi.get(Number(id)),
    enabled: !!id,
  })

  const seller = data?.data

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-8 h-5 w-48" />
        <div className="rounded-2xl border border-border bg-surface-white p-6">
          <Skeleton className="mb-4 h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <p className="text-text-subtle">Vendeur introuvable.</p>
        <Button variant="outline" asChild>
          <Link href="/animaux">Retour au catalogue</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Animaux', href: '/animaux' },
          { label: seller.name },
        ]}
        className="mb-8"
      />

      {/* Seller hero card */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-surface-white">
        <div className="h-24 bg-gradient-to-r from-brand-green-lt to-surface-cream" />
        <div className="p-6">
          <div className="-mt-14 mb-4 flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-surface-white bg-brand-green-lt shadow-sm">
              <Store className="h-9 w-9 text-brand-green" />
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl text-text-ink">{seller.name}</h1>
                {seller.verified_status === 'approved' && (
                  <div className="flex items-center gap-1 rounded-full bg-brand-green-lt px-2.5 py-0.5 text-xs font-medium text-brand-green">
                    <Shield className="h-3.5 w-3.5" />
                    Certifié
                  </div>
                )}
              </div>
              <p className="text-sm text-text-subtle">
                {seller.type === 'breeder' ? 'Éleveur' : 'Animalerie'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <p className="flex items-center gap-1.5 text-sm text-text-subtle">
              <MapPin className="h-4 w-4" />
              {seller.city} {seller.postal_code}
            </p>
            {seller.rating !== null && seller.rating !== undefined && (
              <StarRating rating={seller.rating} count={seller.reviews_count} />
            )}
            {seller.animals_count !== undefined && (
              <Badge variant="gray">{seller.animals_count} annonces</Badge>
            )}
          </div>

          {seller.description && (
            <p className="mt-4 text-sm leading-relaxed text-text-body">{seller.description}</p>
          )}
        </div>
      </div>

      {/* Active animals */}
      {seller.active_animals && seller.active_animals.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-2xl text-text-ink">Annonces actives</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {seller.active_animals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {seller.reviews && seller.reviews.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl text-text-ink">Avis clients</h2>
          <div className="space-y-4">
            {seller.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border bg-surface-white p-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-text-ink">
                    {review.buyer?.first_name ?? 'Acheteur anonyme'}
                  </p>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-sm text-text-body">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
