import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnimalFilters } from '@/hooks/useAnimalFilters'

// ---------------------------------------------------------------------------
// Mocks next/navigation
// ---------------------------------------------------------------------------

const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter:       () => ({ push: mockPush }),
}))

beforeEach(() => {
  mockSearchParams = new URLSearchParams()
  mockPush.mockClear()
})

// =============================================================================
// Lecture des filtres depuis l'URL
// =============================================================================

describe('useAnimalFilters — lecture des paramètres URL', () => {
  it('retourne des filtres vides et le tri par défaut sans paramètres', () => {
    const { result } = renderHook(() => useAnimalFilters())

    expect(result.current.filters.q).toBeUndefined()
    expect(result.current.filters.species_id).toBeUndefined()
    expect(result.current.filters.sex).toBeUndefined()
    expect(result.current.filters.sort).toBe('published_at_desc')
    expect(result.current.filters.page).toBe(1)
  })

  it('lit espece, sexe et page depuis les params URL', () => {
    mockSearchParams = new URLSearchParams('espece=3&sexe=female&page=2')
    const { result } = renderHook(() => useAnimalFilters())

    expect(result.current.filters.species_id).toBe('3')
    expect(result.current.filters.sex).toBe('female')
    expect(result.current.filters.page).toBe(2)
  })

  it('lit q (recherche textuelle) depuis les params URL', () => {
    mockSearchParams = new URLSearchParams('q=golden+retriever')
    const { result } = renderHook(() => useAnimalFilters())

    expect(result.current.filters.q).toBe('golden retriever')
  })

  it('lit prix_min et prix_max depuis les params URL', () => {
    mockSearchParams = new URLSearchParams('prix_min=100&prix_max=500')
    const { result } = renderHook(() => useAnimalFilters())

    expect(result.current.filters.price_min).toBe('100')
    expect(result.current.filters.price_max).toBe('500')
  })

  it('lit le tri depuis les params URL', () => {
    mockSearchParams = new URLSearchParams('tri=price_asc')
    const { result } = renderHook(() => useAnimalFilters())

    expect(result.current.filters.sort).toBe('price_asc')
  })
})

// =============================================================================
// activeFilterCount
// =============================================================================

describe('useAnimalFilters — activeFilterCount', () => {
  it('retourne 0 sans filtres actifs', () => {
    const { result } = renderHook(() => useAnimalFilters())
    expect(result.current.activeFilterCount).toBe(0)
  })

  it('compte correctement les filtres actifs', () => {
    mockSearchParams = new URLSearchParams('espece=1&sexe=male&prix_max=500')
    const { result } = renderHook(() => useAnimalFilters())
    expect(result.current.activeFilterCount).toBe(3)
  })

  it('n\'inclut pas page ni tri dans le décompte', () => {
    mockSearchParams = new URLSearchParams('page=3&tri=price_asc')
    const { result } = renderHook(() => useAnimalFilters())
    expect(result.current.activeFilterCount).toBe(0)
  })
})

// =============================================================================
// setFilter
// =============================================================================

describe('useAnimalFilters — setFilter', () => {
  it('navigue vers la bonne URL avec le filtre et page=1', () => {
    const { result } = renderHook(() => useAnimalFilters())

    act(() => { result.current.setFilter('espece', '2') })

    expect(mockPush).toHaveBeenCalledOnce()
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('espece=2')
    expect(url).toContain('page=1')
  })

  it('supprime le paramètre si value est undefined', () => {
    mockSearchParams = new URLSearchParams('espece=1&sexe=male')
    const { result } = renderHook(() => useAnimalFilters())

    act(() => { result.current.setFilter('espece', undefined) })

    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('espece')
    expect(url).toContain('sexe=male')
    expect(url).toContain('page=1')
  })

  it('remet toujours page à 1 lors d\'un changement de filtre', () => {
    mockSearchParams = new URLSearchParams('page=5')
    const { result } = renderHook(() => useAnimalFilters())

    act(() => { result.current.setFilter('sexe', 'male') })

    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('page=1')
    expect(url).not.toContain('page=5')
  })
})

// =============================================================================
// setFilters (mise à jour multiple)
// =============================================================================

describe('useAnimalFilters — setFilters', () => {
  it('applique plusieurs filtres en une seule navigation', () => {
    const { result } = renderHook(() => useAnimalFilters())

    act(() => { result.current.setFilters({ espece: '2', sexe: 'female', prix_max: '800' }) })

    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('espece=2')
    expect(url).toContain('sexe=female')
    expect(url).toContain('prix_max=800')
    expect(url).toContain('page=1')
    expect(mockPush).toHaveBeenCalledOnce() // une seule navigation
  })

  it('supprime les clés dont la valeur est undefined', () => {
    mockSearchParams = new URLSearchParams('espece=1&sexe=male')
    const { result } = renderHook(() => useAnimalFilters())

    act(() => { result.current.setFilters({ espece: undefined }) })

    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('espece')
    expect(url).toContain('sexe=male')
  })
})

// =============================================================================
// setPage
// =============================================================================

describe('useAnimalFilters — setPage', () => {
  it('navigue vers la bonne page en conservant les filtres', () => {
    mockSearchParams = new URLSearchParams('espece=1&sexe=male')
    const { result } = renderHook(() => useAnimalFilters())

    act(() => { result.current.setPage(4) })

    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('page=4')
    expect(url).toContain('espece=1')
    expect(url).toContain('sexe=male')
  })
})

// =============================================================================
// clearFilters
// =============================================================================

describe('useAnimalFilters — clearFilters', () => {
  it('navigue vers /animaux sans aucun paramètre', () => {
    mockSearchParams = new URLSearchParams('espece=1&sexe=male&page=3')
    const { result } = renderHook(() => useAnimalFilters())

    act(() => { result.current.clearFilters() })

    expect(mockPush).toHaveBeenCalledWith('/animaux')
  })
})
