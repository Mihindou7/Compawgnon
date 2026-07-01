'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Heart } from 'lucide-react'

import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { AccountHeader } from '@/components/account/AccountHeader'
import { AnimalCard } from '@/components/animal/AnimalCard'
import { AnimalCardSkeleton } from '@/components/animal/AnimalCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function FavorisPage() {
  const reduce = useReducedMotion()
  const { data: favorites, isLoading } = useFavorites()
  const toggleMutation = useToggleFavorite()

  const count = favorites?.length ?? 0

  return (
    <div>
      <AccountHeader
        icon={Heart}
        title="Mes favoris"
        description="Retrouvez en un clin d'œil les animaux qui ont retenu votre attention."
        count={count}
        countLabel={count > 1 ? 'animaux' : 'animal'}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <AnimalCardSkeleton key={i} />)}
        </div>
      ) : !favorites || favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucun favori pour l'instant"
          description="Ajoutez des animaux à vos favoris pour les retrouver facilement."
          action={{ label: 'Parcourir les annonces', href: '/animaux' }}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.05 } } }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {favorites.map((animal) => (
            <motion.div
              key={animal.id}
              variants={{
                hidden: { opacity: 0, y: reduce ? 0 : 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
            >
              <AnimalCard
                animal={animal}
                isFavorite
                onToggleFavorite={() =>
                  toggleMutation.mutate({ animalId: animal.id, isFav: true })
                }
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
