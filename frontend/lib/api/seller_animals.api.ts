import { api } from './client'
import type { Animal, AnimalMedia, AnimalDocument, Reservation, SellerDashboard } from '@/lib/types/api.types'
import type { PaginatedResponse } from '@/lib/types/pagination.types'

export interface CreateAnimalData {
  title:           string
  description?:    string
  species_id:      number
  breed_id?:       number
  sex:             'male' | 'female' | 'unknown'
  price:           number
  city:            string
  postal_code?:    string
  birthdate?:      string
  latitude?:       number
  longitude?:      number
  region?:         string
  department?:     string
  department_code?: string
}

export const sellerAnimalsApi = {
  dashboard: () =>
    api.get<{ data: SellerDashboard }>('/api/seller/dashboard'),

  list: () =>
    api.get<{ data: Animal[] }>('/api/seller/animals'),

  show: (id: number) =>
    api.get<{ data: Animal }>(`/api/seller/animals/${id}`),

  create: (data: CreateAnimalData) =>
    api.post<{ data: Animal }>('/api/seller/animals', data),

  update: (id: number, data: Partial<CreateAnimalData>) =>
    api.patch<{ data: Animal }>(`/api/seller/animals/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/api/seller/animals/${id}`),

  publish: (id: number) =>
    api.post<{ data: Animal }>(`/api/seller/animals/${id}/publish`, {}),

  uploadMedia: (id: number, file: File, isCover?: boolean) => {
    const form = new FormData()
    form.append('photo', file)
    if (isCover) form.append('is_cover', '1')
    return api.upload<{ data: AnimalMedia }>(`/api/seller/animals/${id}/media`, form)
  },

  deleteMedia: (animalId: number, mediaId: number) =>
    api.delete<void>(`/api/seller/animals/${animalId}/media/${mediaId}`),

  uploadDocument: (id: number, file: File, type: string) => {
    const form = new FormData()
    form.append('document', file)
    form.append('type', type)
    return api.upload<{ data: AnimalDocument }>(`/api/seller/animals/${id}/documents`, form)
  },

  deleteDocument: (animalId: number, docId: number) =>
    api.delete<void>(`/api/seller/animals/${animalId}/documents/${docId}`),

  listReservations: (params?: { page?: number }) => {
    const qs = params?.page ? `?page=${params.page}` : ''
    return api.get<PaginatedResponse<Reservation>>(`/api/seller/reservations${qs}`)
  },

  acceptReservation: (id: number, message?: string) =>
    api.patch<{ data: Reservation }>(`/api/seller/reservations/${id}/accept`, { sellerResponse: message }),

  rejectReservation: (id: number, message?: string) =>
    api.patch<{ data: Reservation }>(`/api/seller/reservations/${id}/reject`, { sellerResponse: message }),
}
