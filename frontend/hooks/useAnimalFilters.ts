'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import type { AnimalFilters } from '@/lib/api/animals.api'

export function useAnimalFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const filters: AnimalFilters = {
    q:               searchParams.get('q')          ?? undefined,
    species_id:      searchParams.get('espece')      ?? undefined,
    breed_id:        searchParams.get('race')        ?? undefined,
    price_min:       searchParams.get('prix_min')    ?? undefined,
    price_max:       searchParams.get('prix_max')    ?? undefined,
    age_min:         searchParams.get('age_min')     ?? undefined,
    age_max:         searchParams.get('age_max')     ?? undefined,
    sex:             searchParams.get('sexe')        ?? undefined,
    city:            searchParams.get('ville')       ?? undefined,
    seller_type:     searchParams.get('vendeur')     ?? undefined,
    region:          searchParams.get('region')      ?? undefined,
    department_code: searchParams.get('dept')        ?? undefined,
    lat:             searchParams.get('lat')         ?? undefined,
    lng:             searchParams.get('lng')         ?? undefined,
    radius_km:       searchParams.get('rayon')       ?? undefined,
    sort:            searchParams.get('tri')         ?? 'published_at_desc',
    page:            Number(searchParams.get('page') ?? 1),
  }

  const setFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.set('page', '1')
    router.push(`/animaux?${params.toString()}`)
  }

  const setFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, v)
      else params.delete(k)
    })
    params.set('page', '1')
    router.push(`/animaux?${params.toString()}`)
  }

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/animaux?${params.toString()}`)
  }

  const clearFilters = () => router.push('/animaux')

  const activeFilterCount = [
    filters.q, filters.species_id, filters.breed_id, filters.price_min,
    filters.price_max, filters.age_min, filters.age_max, filters.sex,
    filters.city, filters.seller_type, filters.region, filters.department_code,
    filters.lat,
  ].filter(Boolean).length

  return { filters, setFilter, setFilters, setPage, clearFilters, activeFilterCount }
}
