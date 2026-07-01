'use client'

import { Heart, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils/cn'
import { formatAge, formatAgeMonths, formatPrice } from '@/lib/utils/formatters'
import { resolveUploadUrl } from '@/lib/utils/urls'
import type { Animal } from '@/lib/types/api.types'
import { AnimalStatusBadge } from './AnimalStatusBadge'

interface AnimalCardProps {
  animal: Animal
  className?: string
  showFavoriteButton?: boolean
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export function AnimalCard({
  animal,
  className,
  showFavoriteButton = true,
  isFavorite = false,
  onToggleFavorite,
}: AnimalCardProps) {
  return (
    <Link
      href={`/animaux/${animal.id}`}
      className={cn(
        'group relative block rounded-2xl border border-border bg-surface-white overflow-hidden',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.06)]',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_0_rgb(0_0_0/0.10)]',
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-cream">
        {animal.cover_url ? (
          <Image
            src={resolveUploadUrl(animal.cover_url) ?? animal.cover_url}
            alt={animal.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-green-lt">
            <span className="text-4xl">🐾</span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <AnimalStatusBadge status={animal.status} />
        </div>

        {/* Favorite button */}
        {showFavoriteButton && (
          <button
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite?.()
            }}
            className={cn(
              'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200',
              isFavorite
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-white/80 text-text-subtle hover:bg-white hover:text-red-400',
            )}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="truncate font-medium text-text-ink">{animal.title}</p>
        <p className="mt-0.5 text-sm text-text-subtle">
          {animal.breed?.name ?? animal.species?.name ?? '—'}
          {(animal.birthdate
            ? ` · ${formatAge(animal.birthdate)}`
            : animal.age_months != null
              ? ` · ${formatAgeMonths(animal.age_months)}`
              : '')}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-brand-green">
            {formatPrice(animal.price)}
          </span>
          <span className="flex items-center gap-1 text-xs text-text-subtle">
            <MapPin className="h-3 w-3" />
            {animal.city}
          </span>
        </div>
      </div>
    </Link>
  )
}
