'use client'

import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import * as React from 'react'

import { api } from '@/lib/api/client'

interface PublicReview {
  id: number
  rating: number
  comment: string
  buyer_name: string
  created_at: string
}

const FALLBACK: PublicReview[] = [
  {
    id: -1,
    rating: 5,
    comment: "Grâce à Compawgnon, j'ai trouvé mon Golden Retriever en moins de 48h auprès d'un éleveur certifié. Le processus était simple et rassurant.",
    buyer_name: 'Marie D.',
    created_at: '',
  },
  {
    id: -2,
    rating: 5,
    comment: "Super plateforme, vendeurs sérieux et vérifiés. Mon chaton Maine Coon est arrivé en parfaite santé avec tous ses documents.",
    buyer_name: 'Thomas B.',
    created_at: '',
  },
  {
    id: -3,
    rating: 4,
    comment: "Très bonne expérience ! J'ai pu comparer plusieurs annonces facilement et contacter les éleveurs directement. Je recommande.",
    buyer_name: 'Sophie M.',
    created_at: '',
  },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < rating ? 'fill-gold text-gold' : 'fill-none text-gold/30'}`}
        />
      ))}
    </div>
  )
}

function getInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? '?'
}

export function TestimonialsSection() {
  const { data } = useQuery<PublicReview[]>({
    queryKey: ['public-reviews'],
    queryFn: () => api.get<PublicReview[]>('/api/reviews'),
    staleTime: 5 * 60 * 1000,
  })

  const reviews = data && data.length > 0 ? data : FALLBACK

  const [index, setIndex] = React.useState(0)
  const [direction, setDirection] = React.useState(1)

  const go = React.useCallback((dir: 1 | -1) => {
    setDirection(dir)
    setIndex((prev) => (prev + dir + reviews.length) % reviews.length)
  }, [reviews.length])

  React.useEffect(() => {
    const id = setInterval(() => go(1), 6000)
    return () => clearInterval(id)
  }, [go])

  const current = reviews[index]

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -40 }),
  }

  return (
    <section className="bg-brand-green-lt py-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">Témoignages</p>
          <h2 className="mt-2 font-serif text-3xl text-text-ink">Ce que disent nos adoptants</h2>
        </div>

        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="px-8"
            >
              <Stars rating={current.rating} />

              <blockquote className="mt-6 font-serif text-xl leading-relaxed text-text-ink sm:text-2xl">
                &ldquo;{current.comment}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-semibold text-white">
                  {getInitial(current.buyer_name)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-ink">{current.buyer_name}</p>
                  <p className="text-sm text-text-subtle">Adoptant(e) vérifié(e)</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => go(-1)}
            className="rounded-full p-2 text-brand-green transition-colors hover:bg-brand-green/10"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i) }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-brand-green' : 'w-2 bg-brand-green/30 hover:bg-brand-green/60'
                }`}
                aria-label={`Témoignage ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => go(1)}
            className="rounded-full p-2 text-brand-green transition-colors hover:bg-brand-green/10"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
