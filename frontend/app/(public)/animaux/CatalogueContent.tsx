'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { Filter, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

import { animalsApi } from '@/lib/api/animals.api'
import { speciesApi } from '@/lib/api/species.api'
import { AnimalFilters } from '@/components/animal/AnimalFilters'
import { AnimalFiltersDrawer } from '@/components/animal/AnimalFiltersDrawer'
import { AnimalGrid } from '@/components/animal/AnimalGrid'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { useAnimalFilters } from '@/hooks/useAnimalFilters'

const SEX_LABELS: Record<string, string> = { male: 'Mâle', female: 'Femelle' }
const SELLER_LABELS: Record<string, string> = { breeder: 'Éleveur', pet_shop: 'Animalerie' }

export function CatalogueContent() {
  const reduce = useReducedMotion()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { filters, setFilter, setPage, clearFilters, activeFilterCount } = useAnimalFilters()

  const { data, isLoading } = useQuery({
    queryKey: ['animals', filters],
    queryFn: () => animalsApi.list({ ...filters, limit: 12 }),
    placeholderData: (prev) => prev,
  })

  const { data: speciesData } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesApi.list(),
    staleTime: 10 * 60 * 1000,
  })

  const animals = data?.data ?? []
  const meta = data?.meta

  const speciesName = (id?: string) =>
    speciesData?.data.find((s) => String(s.id) === id)?.name ?? 'Espèce'

  // Chips de filtres actifs (clé = paramètre URL pour la suppression)
  const chips: { key: string; label: string }[] = []
  if (filters.q) chips.push({ key: 'q', label: `« ${filters.q} »` })
  if (filters.species_id) chips.push({ key: 'espece', label: speciesName(filters.species_id) })
  if (filters.sex) chips.push({ key: 'sexe', label: SEX_LABELS[filters.sex] ?? filters.sex })
  if (filters.city) chips.push({ key: 'ville', label: filters.city })
  if (filters.price_min) chips.push({ key: 'prix_min', label: `≥ ${filters.price_min} €` })
  if (filters.price_max) chips.push({ key: 'prix_max', label: `≤ ${filters.price_max} €` })
  if (filters.seller_type)
    chips.push({ key: 'vendeur', label: SELLER_LABELS[filters.seller_type] ?? filters.seller_type })
  if (filters.age_min) chips.push({ key: 'age_min', label: `≥ ${filters.age_min} mois` })
  if (filters.age_max) chips.push({ key: 'age_max', label: `≤ ${filters.age_max} mois` })
  if (filters.region)  chips.push({ key: 'region', label: filters.region })
  if (filters.lat)     chips.push({ key: 'lat', label: `Rayon ${filters.radius_km ?? '20'} km` })

  return (
    <div className="relative overflow-hidden">
      {/* Halo décoratif */}
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-80 w-80 rounded-full bg-brand-green/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[{ label: 'Accueil', href: '/' }, { label: 'Animaux' }]}
          className="mb-8"
        />

        {/* ─── En-tête ─── */}
        <motion.header
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/20 bg-brand-green-lt px-3 py-1 text-sm font-medium text-brand-green">
            <Sparkles className="h-3.5 w-3.5" />
            Annonces
          </span>
          <h1 className="mt-3 font-serif text-4xl text-text-ink sm:text-5xl">
            Nos compagnons{' '}
            <span className="relative inline-block text-brand-green">
              disponibles
              <span className="absolute -bottom-1 left-0 h-2.5 w-full -skew-x-3 overflow-hidden rounded">
                <motion.span
                  className="block h-full w-full bg-brand-green/25"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                />
                {!reduce && (
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                    initial={{ x: '-130%' }}
                    animate={{ x: '230%' }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 1.6, delay: 1 }}
                  />
                )}
              </span>
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-text-body">
            Chiots, chatons, lapins, oiseaux et bien d&apos;autres vous attendent. Affinez votre
            recherche par espèce, race, âge, budget ou localisation et trouvez le compagnon idéal —
            tous proposés par des éleveurs et animaleries vérifiés.
          </p>
        </motion.header>

        {/* Toolbar mobile */}
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <p className="text-sm text-text-subtle">
            {meta ? `${meta.total} annonce${meta.total > 1 ? 's' : ''}` : '…'}
          </p>
          <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)} leftIcon={Filter}>
            Filtres
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar desktop */}
          <div className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-surface-white p-5">
              <AnimalFilters />
            </div>
          </div>

          {/* Main */}
          <div className="min-w-0 flex-1">
            {/* Compteur + chips de filtres actifs */}
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <p className="text-sm text-text-subtle">
                {isLoading && !meta
                  ? 'Chargement…'
                  : meta
                    ? <><span className="font-semibold text-text-ink">{meta.total}</span> annonce{meta.total > 1 ? 's' : ''} trouvée{meta.total > 1 ? 's' : ''}</>
                    : ''}
              </p>

              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((chip) => (
                    <motion.button
                      key={chip.key}
                      type="button"
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      onClick={() => setFilter(chip.key, undefined)}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-brand-green/30 bg-brand-green-lt py-1 pl-3 pr-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green hover:text-white"
                    >
                      {chip.label}
                      <X className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
                    </motion.button>
                  ))}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-text-subtle underline-offset-2 transition-colors hover:text-brand-green hover:underline"
                  >
                    Tout effacer
                  </button>
                </div>
              )}
            </div>

            <AnimalGrid animals={animals} isLoading={isLoading} />

            {meta && meta.total_pages > 1 && (
              <Pagination meta={meta} onPageChange={setPage} />
            )}
          </div>
        </div>
      </div>

      <AnimalFiltersDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
