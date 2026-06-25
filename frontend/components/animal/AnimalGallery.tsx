'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { resolveUploadUrl } from '@/lib/utils/urls'
import type { AnimalMedia } from '@/lib/types/api.types'

interface AnimalGalleryProps {
  cover?: string | null
  media?: AnimalMedia[]
  title?: string
}

export function AnimalGallery({ cover, media, title = "Photo de l'animal" }: AnimalGalleryProps) {
  const all = useMemo(() => {
    if (media && media.length > 0) return media
    if (cover) return [{ id: 0, file_url: cover, is_cover: true, position: 0 }]
    return []
  }, [cover, media])

  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const go = useCallback((dir: 1 | -1) => {
    setDirection(dir)
    setActive((prev) => (prev + dir + all.length) % all.length)
  }, [all.length])

  useEffect(() => {
    if (!lightbox) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, go])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -40 }),
  }

  if (all.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green-lt to-surface-cream">
        <span className="text-6xl">🐾</span>
      </div>
    )
  }

  const currentSrc = resolveUploadUrl(all[active].file_url) ?? all[active].file_url

  return (
    <>
      <div className="space-y-3">
        <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-cream shadow-[0_4px_24px_0_rgb(0_0_0/0.06)] ring-1 ring-border/60">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={currentSrc}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {all.length > 1 && (
            <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {active + 1} / {all.length}
            </div>
          )}

          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
            aria-label="Agrandir"
          >
            <Expand className="h-4 w-4" />
          </button>

          {all.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text-ink opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-white group-hover:opacity-100"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text-ink opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-white group-hover:opacity-100"
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {all.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {all.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setDirection(i > active ? 1 : -1); setActive(i) }}
                className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                  i === active
                    ? 'border-brand-green scale-[1.02] shadow-md ring-2 ring-brand-green/20'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={resolveUploadUrl(m.file_url) ?? m.file_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setLightbox(false)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            {all.length > 1 && (
              <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {active + 1} / {all.length}
              </div>
            )}

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={active}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="relative h-[85vh] w-[90vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image src={currentSrc} alt="" fill className="object-contain" sizes="90vw" />
              </motion.div>
            </AnimatePresence>

            {all.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(-1) }}
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(1) }}
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {all.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDirection(i > active ? 1 : -1); setActive(i) }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function getCoverFromAnimal(cover?: string | null, media?: AnimalMedia[]) {
  if (cover) return cover
  const coverMedia = media?.find((m) => m.is_cover)
  return coverMedia?.file_url ?? media?.[0]?.file_url ?? null
}

export { getCoverFromAnimal }
