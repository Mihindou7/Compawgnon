'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import * as React from 'react'

import { resolveUploadUrl } from '@/lib/utils/urls'

const IMAGES = [
  '/uploads/species/hero.jpg',
  '/uploads/species/chien.jpg',
  '/uploads/species/chat.jpg',
  '/uploads/species/lapin.jpg',
  '/uploads/species/oiseau.jpg',
  '/uploads/species/reptile.jpg',
]

const INTERVAL = 6000

export function HeroBackground() {
  const reduce = useReducedMotion()
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setIndex((i) => (i + 1) % IMAGES.length), INTERVAL)
    return () => clearInterval(t)
  }, [reduce])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0d1f0f]">
      <AnimatePresence>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.6, ease: 'easeInOut' },
            scale: { duration: INTERVAL / 1000 + 2, ease: 'linear' },
          }}
        >
          <Image
            src={resolveUploadUrl(IMAGES[index]) ?? IMAGES[index]}
            alt=""
            fill
            priority={index === 0}
            className="object-cover opacity-50"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Voiles dégradés */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d1f0f]/90 via-[#0d1f0f]/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f0f]/70 via-transparent to-transparent" />

      {/* Indicateurs */}
      <div className="absolute bottom-8 right-6 z-10 hidden items-center gap-2 sm:flex">
        {IMAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === index ? 'w-6 bg-brand-green' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
