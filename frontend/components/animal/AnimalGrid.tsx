'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { PawPrint } from 'lucide-react'

import type { Animal } from '@/lib/types/api.types'
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { AnimalCard } from './AnimalCard'
import { AnimalCardSkeleton } from './AnimalCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface AnimalGridProps {
  animals?: Animal[]
  isLoading?: boolean
  skeletonCount?: number
}

export function AnimalGrid({ animals, isLoading, skeletonCount = 12 }: AnimalGridProps) {
  const reduce = useReducedMotion()
  const { isAuthenticated } = useAuth()
  const { data: favoriteIds } = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <AnimalCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!animals || animals.length === 0) {
    return (
      <EmptyState
        icon={PawPrint}
        title="Aucun animal trouvé"
        description="Essayez d'ajuster vos filtres pour voir plus de résultats."
      />
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.05 } } }}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {animals.map((animal) => {
        const isFav = favoriteIds?.has(animal.id) ?? false
        return (
          <motion.div
            key={animal.id}
            variants={{
              hidden: { opacity: 0, y: reduce ? 0 : 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
            }}
          >
            <AnimalCard
              animal={animal}
              isFavorite={isFav}
              showFavoriteButton={isAuthenticated}
              onToggleFavorite={() =>
                toggleFavorite.mutate({ animalId: animal.id, isFav })
              }
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}
