import { api } from './client'
import type { Breed, Species } from '@/lib/types/api.types'

export const speciesApi = {
  list: () =>
    api.get<{ data: Species[] }>('/api/species'),

  get: (slug: string) =>
    api.get<{ data: Species }>(`/api/species/${slug}`),

  listBreeds: (params?: { species_id?: number | string; species_slug?: string }) => {
    const qs = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return api.get<{ data: Breed[] }>(`/api/breeds${qs ? `?${qs}` : ''}`)
  },

  getBreed: (slug: string) =>
    api.get<{ data: Breed }>(`/api/breeds/${slug}`),
}
