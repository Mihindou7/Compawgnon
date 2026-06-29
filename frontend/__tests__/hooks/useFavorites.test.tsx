import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFavoriteIds, useFavorites, useToggleFavorite } from '@/hooks/useFavorites'

// ---------------------------------------------------------------------------
// Mock favoritesApi
// ---------------------------------------------------------------------------

const mockAdd    = vi.fn()
const mockRemove = vi.fn()
const mockList   = vi.fn()
const mockIds    = vi.fn()

vi.mock('@/lib/api/favorites.api', () => ({
  favoritesApi: {
    add:    (...args: unknown[]) => mockAdd(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
    list:   (...args: unknown[]) => mockList(...args),
    ids:    (...args: unknown[]) => mockIds(...args),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper(client?: QueryClient) {
  const qc = client ?? new QueryClient({
    defaultOptions: {
      queries:   { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

let queryClient: QueryClient

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries:   { retry: false },
      mutations: { retry: false },
    },
  })
  mockAdd.mockResolvedValue({ data: { message: 'ok' } })
  mockRemove.mockResolvedValue(undefined)
  mockList.mockResolvedValue({ data: [] })
  mockIds.mockResolvedValue({ data: [] })
})

afterEach(() => {
  queryClient.clear()
  vi.clearAllMocks()
})

// =============================================================================
// useFavoriteIds
// =============================================================================

describe('useFavoriteIds', () => {
  it('retourne un Set vide quand l\'API renvoie un tableau vide', async () => {
    mockIds.mockResolvedValue({ data: [] })
    const wrapper = makeWrapper(queryClient)

    const { result } = renderHook(() => useFavoriteIds(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(new Set())
  })

  it('retourne un Set avec les IDs retournés par l\'API', async () => {
    mockIds.mockResolvedValue({ data: [1, 3, 7] })
    const wrapper = makeWrapper(queryClient)

    const { result } = renderHook(() => useFavoriteIds(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(new Set([1, 3, 7]))
  })

  it('appelle favoritesApi.ids', async () => {
    const wrapper = makeWrapper(queryClient)
    renderHook(() => useFavoriteIds(), { wrapper })

    await waitFor(() => expect(mockIds).toHaveBeenCalledOnce())
  })
})

// =============================================================================
// useFavorites
// =============================================================================

describe('useFavorites', () => {
  it('retourne un tableau vide quand l\'API renvoie une liste vide', async () => {
    mockList.mockResolvedValue({ data: [] })
    const wrapper = makeWrapper(queryClient)

    const { result } = renderHook(() => useFavorites(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('projette les FavoriteItem en Animal via select', async () => {
    const animal = { id: 10, title: 'Rex', price: 500 }
    mockList.mockResolvedValue({ data: [{ id: 1, animal, created_at: '2024-01-01' }] })
    const wrapper = makeWrapper(queryClient)

    const { result } = renderHook(() => useFavorites(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([animal])
  })
})

// =============================================================================
// useToggleFavorite — ajout
// =============================================================================

describe('useToggleFavorite — ajout (isFav = false)', () => {
  it('appelle favoritesApi.add avec le bon animalId', async () => {
    const wrapper = makeWrapper(queryClient)
    const { result } = renderHook(() => useToggleFavorite(), { wrapper })

    await act(async () => {
      result.current.mutate({ animalId: 5, isFav: false })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockAdd).toHaveBeenCalledWith(5)
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('met à jour le cache de manière optimiste en ajoutant l\'id', async () => {
    // Données initiales : IDs 1 et 2
    queryClient.setQueryData(['favorite-ids'], { data: [1, 2] })
    const wrapper = makeWrapper(queryClient)

    // Bloquer la résolution de l'API pour observer l'état optimiste
    mockAdd.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500)))

    const { result } = renderHook(() => useToggleFavorite(), { wrapper })

    act(() => { result.current.mutate({ animalId: 3, isFav: false }) })

    // L'update optimiste se produit avant que l'API réponde
    await waitFor(() => {
      const cache = queryClient.getQueryData<{ data: number[] }>(['favorite-ids'])
      return cache?.data.includes(3) === true
    })

    const cache = queryClient.getQueryData<{ data: number[] }>(['favorite-ids'])
    expect(cache?.data).toContain(3)
    expect(cache?.data).toContain(1)
    expect(cache?.data).toContain(2)
  })
})

// =============================================================================
// useToggleFavorite — suppression
// =============================================================================

describe('useToggleFavorite — suppression (isFav = true)', () => {
  it('appelle favoritesApi.remove avec le bon animalId', async () => {
    const wrapper = makeWrapper(queryClient)
    const { result } = renderHook(() => useToggleFavorite(), { wrapper })

    await act(async () => {
      result.current.mutate({ animalId: 7, isFav: true })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRemove).toHaveBeenCalledWith(7)
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('retire l\'id du cache de manière optimiste', async () => {
    queryClient.setQueryData(['favorite-ids'], { data: [5, 6, 7] })
    mockRemove.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500)))

    const wrapper = makeWrapper(queryClient)
    const { result } = renderHook(() => useToggleFavorite(), { wrapper })

    act(() => { result.current.mutate({ animalId: 6, isFav: true }) })

    await waitFor(() => {
      const cache = queryClient.getQueryData<{ data: number[] }>(['favorite-ids'])
      return cache?.data.includes(6) === false
    })

    const cache = queryClient.getQueryData<{ data: number[] }>(['favorite-ids'])
    expect(cache?.data).not.toContain(6)
    expect(cache?.data).toContain(5)
    expect(cache?.data).toContain(7)
  })
})

// =============================================================================
// useToggleFavorite — rollback sur erreur
// =============================================================================

describe('useToggleFavorite — rollback sur erreur API', () => {
  it('restaure les données précédentes si l\'API échoue', async () => {
    queryClient.setQueryData(['favorite-ids'], { data: [1, 2, 3] })
    mockAdd.mockRejectedValue(new Error('réseau indisponible'))

    const wrapper = makeWrapper(queryClient)
    const { result } = renderHook(() => useToggleFavorite(), { wrapper })

    await act(async () => {
      result.current.mutate({ animalId: 4, isFav: false })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Le cache est restauré à son état précédent
    await waitFor(() => {
      const cache = queryClient.getQueryData<{ data: number[] }>(['favorite-ids'])
      return !cache?.data.includes(4)
    })

    const cache = queryClient.getQueryData<{ data: number[] }>(['favorite-ids'])
    expect(cache?.data).not.toContain(4)
  })
})
