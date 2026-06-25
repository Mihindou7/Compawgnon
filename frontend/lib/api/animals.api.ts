import { api } from './client'
import type { Animal } from '@/lib/types/api.types'
import type { PaginatedResponse } from '@/lib/types/pagination.types'

export interface AnimalFilters {
  q?:              string
  species_id?:     string
  species_slug?:   string
  breed_id?:       string
  breed_slug?:     string
  price_min?:      string
  price_max?:      string
  age_min?:        string
  age_max?:        string
  sex?:            string
  city?:           string
  seller_type?:    string
  region?:         string
  department_code?: string
  lat?:            string
  lng?:            string
  radius_km?:      string
  sort?:           string
  page?:           number
  limit?:          number
}

export const animalsApi = {
  list: (filters: AnimalFilters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
    })
    const qs = params.toString()
    return api.get<PaginatedResponse<Animal>>(`/api/animals${qs ? `?${qs}` : ''}`)
  },

  get: (id: number) =>
    api.get<{ data: Animal }>(`/api/animals/${id}`),
}
