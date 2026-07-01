'use client'

import { useQuery } from '@tanstack/react-query'
import { LocateFixed, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'
import { speciesApi } from '@/lib/api/species.api'
import { Select } from '@/components/ui/Select'
import { useAnimalFilters } from '@/hooks/useAnimalFilters'

const SEX_OPTIONS = [
  { value: 'male',   label: 'Mâle' },
  { value: 'female', label: 'Femelle' },
]

const SELLER_TYPES = [
  { value: 'breeder',  label: 'Éleveur' },
  { value: 'pet_shop', label: 'Animalerie' },
]

const SORT_OPTIONS = [
  { value: 'published_at_desc', label: 'Plus récent' },
  { value: 'price_asc',         label: 'Prix croissant' },
  { value: 'price_desc',        label: 'Prix décroissant' },
  { value: 'age_asc',           label: 'Plus jeune' },
]

const RADIUS_OPTIONS = [
  { value: '5',   label: '5 km' },
  { value: '10',  label: '10 km' },
  { value: '20',  label: '20 km' },
  { value: '50',  label: '50 km' },
  { value: '100', label: '100 km' },
]

const REGIONS_FR = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Guadeloupe',
  'Guyane',
  'Hauts-de-France',
  'Île-de-France',
  'La Réunion',
  'Martinique',
  'Mayotte',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur",
]

const REGION_OPTIONS = [
  { value: '__all__', label: 'Toutes les régions' },
  ...REGIONS_FR.map((r) => ({ value: r, label: r })),
]

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm font-medium transition-all duration-150',
        active
          ? 'border-brand-green bg-brand-green text-white shadow-sm'
          : 'border-border bg-surface-white text-text-body hover:border-brand-green/40 hover:bg-brand-green-lt',
      )}
    >
      {children}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">{children}</p>
  )
}

export function AnimalFilters({ className }: { className?: string }) {
  const { filters, setFilter, setFilters, clearFilters, activeFilterCount } = useAnimalFilters()

  const [priceMin, setPriceMin] = React.useState(filters.price_min ?? '')
  const [priceMax, setPriceMax] = React.useState(filters.price_max ?? '')
  const [ageMin, setAgeMin]     = React.useState(filters.age_min ?? '')
  const [ageMax, setAgeMax]     = React.useState(filters.age_max ?? '')
  const [searchText, setSearchText] = React.useState(filters.q ?? '')
  const [prevQ, setPrevQ] = React.useState(filters.q)
  const [geoLoading, setGeoLoading] = React.useState(false)

  if (prevQ !== filters.q) {
    setPrevQ(filters.q)
    setSearchText(filters.q ?? '')
  }

  const applySearch = () => setFilter('q', searchText.trim() || undefined)

  const { data: speciesData } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesApi.list(),
    staleTime: 10 * 60 * 1000,
  })

  const { data: breedsData } = useQuery({
    queryKey: ['breeds', filters.species_id],
    queryFn: () => speciesApi.listBreeds({ species_id: filters.species_id }),
    enabled: !!filters.species_id,
  })

  const breedOptions = [
    { value: 'all', label: 'Toutes les races' },
    ...(breedsData?.data ?? []).map((b) => ({ value: String(b.id), label: b.name })),
  ]

  const applyPrice = () => {
    setFilter('prix_min', priceMin || undefined)
    setFilter('prix_max', priceMax || undefined)
  }

  const applyAge = () => {
    setFilter('age_min', ageMin || undefined)
    setFilter('age_max', ageMax || undefined)
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        setFilters({
          lat:   String(pos.coords.latitude),
          lng:   String(pos.coords.longitude),
          rayon: filters.radius_km ?? '20',
        })
      },
      () => setGeoLoading(false),
      { timeout: 8000 },
    )
  }

  function clearGeo() {
    setFilters({ lat: undefined, lng: undefined, rayon: undefined })
  }

  const hasGeo = !!filters.lat && !!filters.lng

  return (
    <aside className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-text-ink">
          <SlidersHorizontal className="h-4 w-4 text-brand-green" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-text-subtle transition-colors hover:text-brand-green"
          >
            <X className="h-3.5 w-3.5" />
            Effacer
          </button>
        )}
      </div>

      {/* Recherche */}
      <div className="space-y-2">
        <SectionLabel>Recherche</SectionLabel>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <input
            type="text"
            placeholder="Espèce, race, mot-clé…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onBlur={applySearch}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="w-full rounded-xl border border-border bg-surface-white py-2 pl-9 pr-3 text-sm text-text-ink placeholder:text-text-subtle focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
      </div>

      {/* Tri */}
      <div className="space-y-2">
        <SectionLabel>Trier par</SectionLabel>
        <Select
          options={SORT_OPTIONS}
          value={filters.sort ?? 'published_at_desc'}
          onValueChange={(v) => setFilter('tri', v)}
        />
      </div>

      {/* Géolocalisation */}
      <div className="space-y-2.5">
        <SectionLabel>Autour de moi</SectionLabel>
        {hasGeo ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-brand-green/30 bg-brand-green-lt px-3 py-2">
              <MapPin className="h-4 w-4 shrink-0 text-brand-green" />
              <span className="flex-1 text-sm font-medium text-brand-green">Géolocalisation active</span>
              <button type="button" onClick={clearGeo} className="text-brand-green/60 hover:text-brand-green">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <Select
              options={RADIUS_OPTIONS}
              value={filters.radius_km ?? '20'}
              onValueChange={(v) => setFilter('rayon', v)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geoLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-text-subtle transition-all hover:border-brand-green/40 hover:bg-brand-green-lt hover:text-brand-green disabled:opacity-50"
          >
            <LocateFixed className={cn('h-4 w-4', geoLoading && 'animate-pulse')} />
            {geoLoading ? 'Localisation…' : 'Utiliser ma position'}
          </button>
        )}
      </div>

      {/* Espèce */}
      <div className="space-y-2.5">
        <SectionLabel>Espèce</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {(speciesData?.data ?? []).map((s) => (
            <Pill
              key={s.id}
              active={filters.species_id === String(s.id)}
              onClick={() =>
                setFilter('espece', filters.species_id === String(s.id) ? undefined : String(s.id))
              }
            >
              {s.name}
            </Pill>
          ))}
        </div>
      </div>

      {/* Race */}
      {breedsData?.data && breedsData.data.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Race</SectionLabel>
          <Select
            placeholder="Toutes les races"
            options={breedOptions}
            value={filters.breed_id ?? 'all'}
            onValueChange={(v) => setFilter('race', v === 'all' ? undefined : v)}
          />
        </div>
      )}

      {/* Sexe */}
      <div className="space-y-2.5">
        <SectionLabel>Sexe</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {SEX_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              active={filters.sex === opt.value}
              onClick={() => setFilter('sexe', filters.sex === opt.value ? undefined : opt.value)}
            >
              {opt.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Âge */}
      <div className="space-y-2.5">
        <SectionLabel>Âge (mois)</SectionLabel>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            min={0}
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            onBlur={applyAge}
            onKeyDown={(e) => e.key === 'Enter' && applyAge()}
            className="w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-subtle focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <span className="shrink-0 text-text-subtle">–</span>
          <input
            type="number"
            placeholder="Max"
            min={0}
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            onBlur={applyAge}
            onKeyDown={(e) => e.key === 'Enter' && applyAge()}
            className="w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-subtle focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
      </div>

      {/* Prix */}
      <div className="space-y-2.5">
        <SectionLabel>Prix (€)</SectionLabel>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-subtle focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <span className="shrink-0 text-text-subtle">–</span>
          <input
            type="number"
            placeholder="Max"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-subtle focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
      </div>

      {/* Région */}
      <div className="space-y-2">
        <SectionLabel>Région</SectionLabel>
        <Select
          options={REGION_OPTIONS}
          value={filters.region ?? '__all__'}
          onValueChange={(v) => setFilter('region', v === '__all__' ? undefined : v)}
        />
      </div>

      {/* Type de vendeur */}
      <div className="space-y-2.5">
        <SectionLabel>Type de vendeur</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {SELLER_TYPES.map((opt) => (
            <Pill
              key={opt.value}
              active={filters.seller_type === opt.value}
              onClick={() =>
                setFilter('vendeur', filters.seller_type === opt.value ? undefined : opt.value)
              }
            >
              {opt.label}
            </Pill>
          ))}
        </div>
      </div>
    </aside>
  )
}
