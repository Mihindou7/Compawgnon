import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnimalFilters } from '@/components/animal/AnimalFilters'

// ---------------------------------------------------------------------------
// Variables hoistées
// ---------------------------------------------------------------------------

const {
  mockSetFilter,
  mockSetFilters,
  mockClearFilters,
  mockSpeciesList,
  mockListBreeds,
  filterStateRef,
} = vi.hoisted(() => ({
  mockSetFilter:    vi.fn(),
  mockSetFilters:   vi.fn(),
  mockClearFilters: vi.fn(),
  mockSpeciesList:  vi.fn(),
  mockListBreeds:   vi.fn(),
  filterStateRef: {
    current: {
      filters:          {} as Record<string, unknown>,
      activeFilterCount: 0,
    },
  },
}))

// Le hook useAnimalFilters est déjà testé isolément → on le mock entièrement
vi.mock('@/hooks/useAnimalFilters', () => ({
  useAnimalFilters: () => ({
    filters:           filterStateRef.current.filters,
    setFilter:         mockSetFilter,
    setFilters:        mockSetFilters,
    clearFilters:      mockClearFilters,
    activeFilterCount: filterStateRef.current.activeFilterCount,
  }),
}))

vi.mock('@/lib/api/species.api', () => ({
  speciesApi: {
    list:       mockSpeciesList,
    listBreeds: mockListBreeds,
  },
}))

// Radix Select → select natif pour jsdom
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    label,
    options,
    value,
    onValueChange,
    placeholder,
  }: {
    label?: string
    options?: Array<{ value: string; label: string }>
    value?: string
    onValueChange?: (v: string) => void
    placeholder?: string
  }) => (
    <label>
      {label ?? placeholder ?? 'select'}
      <select
        value={value ?? ''}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  ),
}))

// ---------------------------------------------------------------------------
// Wrapper React Query
// ---------------------------------------------------------------------------

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
  return Wrapper
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  filterStateRef.current = {
    filters:           {},
    activeFilterCount: 0,
  }
  mockSpeciesList.mockResolvedValue({ data: [] })
  mockListBreeds.mockResolvedValue({ data: [] })
})

function setup() {
  const user = userEvent.setup()
  render(<AnimalFilters />, { wrapper: makeWrapper() })
  return { user }
}

// =============================================================================
// Rendu de base
// =============================================================================

describe('AnimalFilters — rendu', () => {
  it('affiche le titre "Filtres"', () => {
    setup()
    expect(screen.getByText('Filtres')).toBeInTheDocument()
  })

  it('affiche la barre de recherche', () => {
    setup()
    expect(screen.getByPlaceholderText(/espèce, race/i)).toBeInTheDocument()
  })

  it('affiche les pills de sexe "Mâle" et "Femelle"', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Mâle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Femelle' })).toBeInTheDocument()
  })

  it('n\'affiche pas le bouton "Effacer" si aucun filtre actif', () => {
    setup()
    expect(screen.queryByRole('button', { name: /effacer/i })).not.toBeInTheDocument()
  })

  it('n\'affiche pas le badge de compteur si activeFilterCount = 0', () => {
    setup()
    // Le compteur n'existe pas dans le DOM quand il vaut 0
    const badge = screen.queryByText('0')
    expect(badge).not.toBeInTheDocument()
  })
})

// =============================================================================
// Filtre par recherche textuelle
// =============================================================================

describe('AnimalFilters — recherche textuelle', () => {
  it('appelle setFilter("q", valeur) après avoir pressé Entrée', async () => {
    const { user } = setup()
    const input = screen.getByPlaceholderText(/espèce, race/i)
    await user.type(input, 'labrador{Enter}')
    expect(mockSetFilter).toHaveBeenCalledWith('q', 'labrador')
  })

  it('appelle setFilter("q", valeur) après avoir perdu le focus', async () => {
    const { user } = setup()
    const input = screen.getByPlaceholderText(/espèce, race/i)
    await user.type(input, 'berger')
    await user.tab()
    expect(mockSetFilter).toHaveBeenCalledWith('q', 'berger')
  })

  it('appelle setFilter("q", undefined) si la saisie est vide', async () => {
    const { user } = setup()
    const input = screen.getByPlaceholderText(/espèce, race/i)
    await user.click(input)
    await user.tab()
    expect(mockSetFilter).toHaveBeenCalledWith('q', undefined)
  })
})

// =============================================================================
// Filtres sexe (pills)
// =============================================================================

describe('AnimalFilters — filtre sexe', () => {
  it('appelle setFilter("sexe", "male") au clic sur "Mâle"', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Mâle' }))
    expect(mockSetFilter).toHaveBeenCalledWith('sexe', 'male')
  })

  it('appelle setFilter("sexe", "female") au clic sur "Femelle"', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Femelle' }))
    expect(mockSetFilter).toHaveBeenCalledWith('sexe', 'female')
  })

  it('toggle off — appelle setFilter("sexe", undefined) si déjà actif', async () => {
    // Simuler "female" déjà sélectionné
    filterStateRef.current.filters = { sex: 'female' }
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Femelle' }))
    expect(mockSetFilter).toHaveBeenCalledWith('sexe', undefined)
  })
})

// =============================================================================
// Filtres prix
// =============================================================================

describe('AnimalFilters — filtres prix', () => {
  it('appelle setFilter pour prix_min et prix_max après blur', async () => {
    const { user } = setup()
    // Les inputs "Min" de prix sont les 2ème de leur type (après ceux de l'âge)
    const allMin = screen.getAllByPlaceholderText('Min')
    const priceMin = allMin[1]  // index 1 = prix (index 0 = âge)
    const allMax = screen.getAllByPlaceholderText('Max')
    const priceMax = allMax[1]

    await user.type(priceMin, '200')
    await user.tab()  // blur → applyPrice

    expect(mockSetFilter).toHaveBeenCalledWith('prix_min', '200')

    await user.type(priceMax, '1000')
    await user.tab()

    expect(mockSetFilter).toHaveBeenCalledWith('prix_max', '1000')
  })

  it('appelle setFilter pour prix_min après Entrée', async () => {
    const { user } = setup()
    const priceMin = screen.getAllByPlaceholderText('Min')[1]
    await user.type(priceMin, '500{Enter}')
    expect(mockSetFilter).toHaveBeenCalledWith('prix_min', '500')
  })
})

// =============================================================================
// Bouton "Effacer" et badge de compteur
// =============================================================================

describe('AnimalFilters — effacer filtres', () => {
  it('affiche le bouton "Effacer" quand activeFilterCount > 0', () => {
    filterStateRef.current.activeFilterCount = 2
    setup()
    expect(screen.getByRole('button', { name: /effacer/i })).toBeInTheDocument()
  })

  it('affiche le badge avec le bon nombre de filtres actifs', () => {
    filterStateRef.current.activeFilterCount = 3
    setup()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('appelle clearFilters() au clic sur "Effacer"', async () => {
    filterStateRef.current.activeFilterCount = 1
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /effacer/i }))
    expect(mockClearFilters).toHaveBeenCalledOnce()
  })
})

// =============================================================================
// Pills d'espèce (chargées via API)
// =============================================================================

describe('AnimalFilters — espèces depuis l\'API', () => {
  it('affiche une pill par espèce retournée', async () => {
    mockSpeciesList.mockResolvedValue({
      data: [
        { id: 1, name: 'Chien', slug: 'chien' },
        { id: 2, name: 'Chat', slug: 'chat' },
      ],
    })
    setup()
    expect(await screen.findByRole('button', { name: 'Chien' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Chat' })).toBeInTheDocument()
  })

  it('appelle setFilter("espece", id) au clic sur une espèce', async () => {
    mockSpeciesList.mockResolvedValue({
      data: [{ id: 3, name: 'Lapin', slug: 'lapin' }],
    })
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Lapin' }))
    expect(mockSetFilter).toHaveBeenCalledWith('espece', '3')
  })

  it('toggle off — appelle setFilter("espece", undefined) si déjà actif', async () => {
    mockSpeciesList.mockResolvedValue({
      data: [{ id: 3, name: 'Lapin', slug: 'lapin' }],
    })
    filterStateRef.current.filters = { species_id: '3' }
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Lapin' }))
    expect(mockSetFilter).toHaveBeenCalledWith('espece', undefined)
  })
})

// =============================================================================
// Pills de type vendeur
// =============================================================================

describe('AnimalFilters — type de vendeur', () => {
  it('affiche les options "Éleveur" et "Animalerie"', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Éleveur' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Animalerie' })).toBeInTheDocument()
  })

  it('appelle setFilter("vendeur", "breeder") au clic sur "Éleveur"', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Éleveur' }))
    expect(mockSetFilter).toHaveBeenCalledWith('vendeur', 'breeder')
  })
})
