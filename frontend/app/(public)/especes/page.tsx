'use client'

import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Clock, Heart, Layers, Leaf, PawPrint, Sparkles, Wallet } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'

import { speciesApi } from '@/lib/api/species.api'
import type { Species } from '@/lib/types/api.types'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/ui/Skeleton'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

const MAINTENANCE_LABELS: Record<string, string> = {
  low:    'Entretien facile',
  medium: 'Entretien moyen',
  high:   'Entretien exigeant',
}

function maintenanceLabel(level?: string) {
  return level ? MAINTENANCE_LABELS[level] ?? level : null
}

function SpeciesMeta({ s }: { s: Species }) {
  const maint = maintenanceLabel(s.maintenance_level)
  return (
    <div className="flex flex-wrap gap-1.5">
      {s.breeds_count !== undefined && s.breeds_count > 0 && (
        <span className="rounded-lg bg-brand-green-lt px-2 py-0.5 text-xs font-medium text-brand-green">
          {s.breeds_count} race{s.breeds_count > 1 ? 's' : ''}
        </span>
      )}
      {s.life_span && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-surface-cream px-2 py-0.5 text-xs text-text-subtle">
          <Clock className="h-3 w-3" /> {s.life_span}
        </span>
      )}
      {maint && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-surface-cream px-2 py-0.5 text-xs text-text-subtle">
          <Leaf className="h-3 w-3" /> {maint}
        </span>
      )}
      {s.budget && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-surface-cream px-2 py-0.5 text-xs text-text-subtle">
          <Wallet className="h-3 w-3" /> {s.budget}
        </span>
      )}
    </div>
  )
}

export default function EspecesPage() {
  const reduce = useReducedMotion()
  const [filter, setFilter] = useState<string>('all')

  const { scrollY } = useScroll()
  const blobY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 140])
  const blobY2 = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -90])
  const featuredImgY = useTransform(scrollY, [0, 900], [0, reduce ? 0 : -60])

  const { data, isLoading } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesApi.list(),
    staleTime: 10 * 60 * 1000,
  })

  const species = data?.data ?? []

  const totals = useMemo(() => {
    return species.reduce(
      (acc, s) => ({
        breeds: acc.breeds + (s.breeds_count ?? 0),
        available: acc.available + (s.available_animals_count ?? 0),
      }),
      { breeds: 0, available: 0 },
    )
  }, [species])

  const featured = useMemo<Species | null>(() => {
    if (!species.length) return null
    return [...species].sort(
      (a, b) => (b.available_animals_count ?? 0) - (a.available_animals_count ?? 0),
    )[0]
  }, [species])

  const stats = [
    { icon: PawPrint, value: species.length, label: 'Espèces' },
    { icon: Layers,   value: totals.breeds, label: 'Races référencées' },
    { icon: Heart,    value: totals.available, label: 'Animaux disponibles' },
  ]

  const showFeatured = filter === 'all' && featured
  const gridSpecies =
    filter === 'all'
      ? species.filter((s) => s.id !== featured?.id)
      : species.filter((s) => s.slug === filter)

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
  }
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  }

  return (
    <div className="relative overflow-hidden">
      {/* ─── Décor d'arrière-plan (parallax) ─── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          style={{ y: blobY }}
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ y: blobY2 }}
          className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
          animate={reduce ? undefined : { scale: [1.1, 1, 1.1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut' }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[{ label: 'Accueil', href: '/' }, { label: 'Espèces & races' }]}
          className="mb-8"
        />

        {/* ─── Hero ─── */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-12 max-w-3xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/20 bg-brand-green-lt px-3 py-1 text-sm font-medium text-brand-green">
            <Sparkles className="h-3.5 w-3.5" />
            Catalogue
          </span>

          <h1 className="mt-4 font-serif text-4xl leading-tight text-text-ink sm:text-5xl">
            Trouvez l&apos;espèce qui fera{' '}
            <span className="relative inline-block text-brand-green">
              battre votre cœur
              {/* Barre soulignée animée (trace + shine en boucle) */}
              <span className="absolute -bottom-1 left-0 h-2.5 w-full -skew-x-3 overflow-hidden rounded">
                <motion.span
                  className="block h-full w-full bg-brand-green/25"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
                />
                {!reduce && (
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                    initial={{ x: '-130%' }}
                    animate={{ x: '230%' }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 1.4, delay: 1.1 }}
                  />
                )}
              </span>
            </span>
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-text-body">
            Du chien fidèle au chat indépendant, du lapin tout en câlins à l&apos;oiseau chanteur :
            chaque espèce possède sa personnalité, ses besoins et sa manière bien à elle de remplir
            un foyer de bonheur. Parcourez nos familles d&apos;animaux, découvrez leurs races, leur
            tempérament, leur espérance de vie et leur niveau d&apos;entretien — puis laissez-vous
            guider vers le compagnon qui partagera votre quotidien.
          </p>
          <p className="mt-3 text-sm text-text-subtle">
            Tous nos animaux proviennent d&apos;éleveurs et d&apos;animaleries vérifiés par notre équipe.
          </p>

          {/* ─── Panneau de stats ─── */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface-white/70 shadow-[0_4px_24px_-12px_rgb(0_0_0/0.12)] backdrop-blur sm:inline-grid sm:w-auto sm:grid-cols-3"
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  'flex items-center gap-3.5 px-6 py-4',
                  i < stats.length - 1 && 'border-b border-border sm:border-b-0 sm:border-r',
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green-lt text-brand-green">
                  <stat.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-serif text-2xl leading-none text-text-ink">
                    {isLoading ? '—' : stat.value}
                  </p>
                  <p className="mt-1 text-xs text-text-subtle">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : (
          <>
            {/* ─── Coup de cœur ─── */}
            <AnimatePresence mode="wait">
              {showFeatured && featured && (
                <motion.div
                  key="featured"
                  initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-10"
                >
                  <Link
                    href={`/especes/${featured.slug}`}
                    className="group relative grid overflow-hidden rounded-3xl border border-border bg-surface-white shadow-[0_10px_40px_-16px_rgb(0_0_0/0.2)] transition-all duration-300 hover:shadow-[0_24px_60px_-20px_rgb(0_0_0/0.28)] md:grid-cols-2"
                  >
                    {/* Image avec parallax */}
                    <div className="relative h-64 overflow-hidden md:h-auto">
                      {resolveUploadUrl(featured.image_url) ? (
                        <motion.div style={{ y: featuredImgY }} className="absolute -inset-x-0 -inset-y-12">
                          <Image
                            src={resolveUploadUrl(featured.image_url)!}
                            alt={featured.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        </motion.div>
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-green-lt to-surface-cream">
                          <PawPrint className="h-16 w-16 text-brand-green/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r" />
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-brand-green shadow-lg">
                        <Heart className="h-3.5 w-3.5 fill-brand-green" />
                        Coup de cœur
                      </span>
                    </div>

                    {/* Contenu */}
                    <div className="flex flex-col justify-center gap-4 p-7 sm:p-9">
                      <div>
                        <h2 className="font-serif text-3xl text-text-ink">{featured.name}</h2>
                        {featured.available_animals_count !== undefined &&
                          featured.available_animals_count > 0 && (
                            <p className="mt-1 text-sm font-medium text-brand-green">
                              {featured.available_animals_count} animaux disponibles dès maintenant
                            </p>
                          )}
                      </div>
                      {featured.description && (
                        <p className="line-clamp-3 text-text-body">{featured.description}</p>
                      )}
                      <SpeciesMeta s={featured} />
                      <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-sm font-medium text-white transition-all group-hover:gap-2.5">
                        Découvrir l&apos;espèce <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Filtres rapides par espèce ─── */}
            {species.length > 1 && (
              <div className="mb-8 flex flex-wrap gap-2">
                <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
                  Toutes les espèces
                </FilterPill>
                {species.map((s) => (
                  <FilterPill key={s.id} active={filter === s.slug} onClick={() => setFilter(s.slug)}>
                    {s.name}
                  </FilterPill>
                ))}
              </div>
            )}

            {/* ─── Grille ─── */}
            <motion.div
              key={filter}
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {gridSpecies.map((s) => {
                const cover = resolveUploadUrl(s.image_url)
                return (
                  <motion.div key={s.id} variants={item}>
                    <Link
                      href={`/especes/${s.slug}`}
                      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface-white shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/30 hover:shadow-[0_18px_40px_-12px_rgb(0_0_0/0.18)]"
                    >
                      {/* Photo */}
                      <div className="relative h-48 w-full overflow-hidden bg-surface-cream">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={s.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-green-lt to-surface-cream">
                            <PawPrint className="h-12 w-12 text-brand-green/40" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                        <h2 className="absolute bottom-3 left-4 right-4 font-serif text-2xl text-white drop-shadow-sm">
                          {s.name}
                        </h2>

                        {s.available_animals_count !== undefined && s.available_animals_count > 0 && (
                          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand-green px-2.5 py-0.5 text-xs font-semibold text-white shadow-lg">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            {s.available_animals_count} dispo
                          </span>
                        )}
                      </div>

                      {/* Corps */}
                      <div className="flex flex-1 flex-col p-5">
                        {s.description && (
                          <p className="line-clamp-2 text-sm text-text-subtle">{s.description}</p>
                        )}

                        <div className="mt-4">
                          <SpeciesMeta s={s} />
                        </div>

                        <div className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-brand-green">
                          <span>Voir les annonces</span>
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200',
        active
          ? 'border-brand-green text-white'
          : 'border-border bg-surface-white text-text-body hover:border-brand-green/40 hover:bg-brand-green-lt',
      )}
    >
      {active && (
        <motion.span
          layoutId="species-filter-pill"
          className="absolute inset-0 -z-10 rounded-full bg-brand-green"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      {children}
    </button>
  )
}
