'use client'

import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import * as React from 'react'

import { AnimalCard } from '@/components/animal/AnimalCard'
import { AnimalCardSkeleton } from '@/components/animal/AnimalCardSkeleton'
import { animalsApi } from '@/lib/api/animals.api'
import type { Animal } from '@/lib/types/api.types'

const VISIBLE = 3
const INTERVAL = 5000

function pickRandom(pool: Animal[], count: number, excludeIds: number[]): Animal[] {
  const candidates = pool.filter((a) => !excludeIds.includes(a.id))
  const source = candidates.length >= count ? candidates : pool
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function RecentAnimalsShowcase() {
  const reduce = useReducedMotion()

  const { data, isLoading } = useQuery({
    queryKey: ['animals', 'recent', 'showcase'],
    queryFn: () => animalsApi.list({ sort: 'published_at_desc', limit: 12 }),
    staleTime: 5 * 60 * 1000,
  })

  const pool = React.useMemo(() => data?.data ?? [], [data])
  const [visible, setVisible] = React.useState<Animal[]>([])
  const [prevPool, setPrevPool] = React.useState(pool)

  if (prevPool !== pool) {
    setPrevPool(pool)
    if (pool.length) setVisible(pool.slice(0, VISIBLE))
  }

  React.useEffect(() => {
    if (reduce || pool.length <= VISIBLE) return
    const t = setInterval(() => {
      setVisible((prev) => pickRandom(pool, VISIBLE, prev.map((a) => a.id)))
    }, INTERVAL)
    return () => clearInterval(t)
  }, [pool, reduce])

  if (isLoading || visible.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: VISIBLE }).map((_, i) => (
          <AnimalCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((animal, slot) => (
        <div key={slot} className="relative [perspective:1200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={animal.id}
              initial={{ opacity: 0, y: 28, rotateX: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.96 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: slot * 0.08 }}
            >
              <span className="absolute -left-2 -top-2 z-10 rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                Nouveau
              </span>
              <AnimalCard animal={animal} showFavoriteButton={false} />
            </motion.div>
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
