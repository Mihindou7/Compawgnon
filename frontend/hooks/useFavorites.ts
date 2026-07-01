'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { favoritesApi, type FavoriteItem } from '@/lib/api/favorites.api'

export function useFavoriteIds() {
  return useQuery({
    queryKey: ['favorite-ids'],
    queryFn: () => favoritesApi.ids(),
    select: (res) => new Set<number>(res.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.list(),
    select: (res) => res.data.map((f: FavoriteItem) => f.animal),
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ animalId, isFav }: { animalId: number; isFav: boolean }) => {
      if (isFav) await favoritesApi.remove(animalId)
      else await favoritesApi.add(animalId)
    },

    onMutate: async ({ animalId, isFav }) => {
      await queryClient.cancelQueries({ queryKey: ['favorite-ids'] })
      const previous = queryClient.getQueryData<{ data: number[] }>(['favorite-ids'])

      queryClient.setQueryData<{ data: number[] }>(['favorite-ids'], (old) => {
        if (!old) return old
        return {
          data: isFav
            ? old.data.filter((id) => id !== animalId)
            : [...old.data, animalId],
        }
      })

      return { previous }
    },

    onError: (_, __, context) => {
      queryClient.setQueryData(['favorite-ids'], (context as { previous?: unknown })?.previous)
      toast.error('Impossible de mettre à jour les favoris.')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
