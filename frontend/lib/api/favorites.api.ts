import { api } from './client'
import type { Animal } from '@/lib/types/api.types'

export interface FavoriteItem {
  id: number
  animal: Animal
  created_at: string
}

export const favoritesApi = {
  list: () =>
    api.get<{ data: FavoriteItem[] }>('/api/me/favorites'),

  add: (animalId: number) =>
    api.post<{ data: { message: string } }>(`/api/me/favorites/${animalId}`, {}),

  remove: (animalId: number) =>
    api.delete<void>(`/api/me/favorites/${animalId}`),

  ids: () =>
    api.get<{ data: number[] }>('/api/me/favorites/ids'),
}
