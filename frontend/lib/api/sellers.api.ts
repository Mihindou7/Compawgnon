import { api } from './client'
import type { Seller } from '@/lib/types/api.types'
import type { PaginatedResponse } from '@/lib/types/pagination.types'

export const sellersApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const qs = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return api.get<PaginatedResponse<Seller>>(`/api/sellers${qs ? `?${qs}` : ''}`)
  },

  get: (id: number) =>
    api.get<{ data: Seller }>(`/api/sellers/${id}`),
}
