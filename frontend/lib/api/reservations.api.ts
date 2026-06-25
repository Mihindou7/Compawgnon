import { api } from './client'
import type { Reservation } from '@/lib/types/api.types'
import type { PaginatedResponse } from '@/lib/types/pagination.types'

export interface CreateReservationData {
  animal_id: number
  message?: string
}

export const reservationsApi = {
  count: () =>
    api.get<{ data: { pending: number; accepted: number } }>('/api/me/reservations/count'),

  list: (params?: { page?: number; status?: string }) => {
    const qs = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return api.get<PaginatedResponse<Reservation>>(`/api/me/reservations${qs ? `?${qs}` : ''}`)
  },

  create: (data: CreateReservationData) =>
    api.post<{ data: Reservation }>('/api/me/reservations', {
      animalId: data.animal_id,
      message: data.message,
    }),

  cancel: (id: number) =>
    api.patch<{ data: Reservation }>(`/api/me/reservations/${id}/cancel`, {}),
}
