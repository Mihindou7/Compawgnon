import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AnimalCard } from '@/components/animal/AnimalCard'
import type { Animal } from '@/lib/types/api.types'

// ---------------------------------------------------------------------------
// Mocks infrastructure Next.js
// ---------------------------------------------------------------------------

// Link → simple <a> (pattern établi dans EmptyState.test.tsx)
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

// Image → <img> natif pour jsdom
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string
    alt: string
    className?: string
  }) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

// ---------------------------------------------------------------------------
// Fixture de base
// ---------------------------------------------------------------------------

function makeAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    id:        42,
    title:     'Golden Retriever adulte',
    status:    'published',
    sex:       'male',
    price:     800,
    city:      'Lyon',
    cover_url: '',
    species:   { id: 1, name: 'Chien', slug: 'chien' },
    breed:     { id: 5, name: 'Golden Retriever', slug: 'golden-retriever' },
    ...overrides,
  }
}

// =============================================================================
// Rendu — contenu textuel
// =============================================================================

describe('AnimalCard — contenu textuel', () => {
  it('affiche le titre de l\'animal', () => {
    render(<AnimalCard animal={makeAnimal()} />)
    expect(screen.getByText('Golden Retriever adulte')).toBeInTheDocument()
  })

  it('affiche le prix formaté', () => {
    render(<AnimalCard animal={makeAnimal({ price: 800 })} />)
    // Intl.NumberFormat (fr-FR) insère des espaces insécables (U+202F/U+00A0)
    // → on cherche uniquement le chiffre pour éviter les problèmes d'encodage
    expect(screen.getByRole('link')).toHaveTextContent(/800/)
    expect(screen.getByRole('link')).toHaveTextContent(/€/)
  })

  it('affiche la ville', () => {
    render(<AnimalCard animal={makeAnimal({ city: 'Bordeaux' })} />)
    expect(screen.getByText('Bordeaux')).toBeInTheDocument()
  })

  it('affiche la race quand elle est disponible', () => {
    render(<AnimalCard animal={makeAnimal()} />)
    // Chaîne exacte pour ne pas matcher le titre "Golden Retriever adulte"
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument()
  })

  it('affiche l\'espèce quand la race est null', () => {
    render(<AnimalCard animal={makeAnimal({ breed: null })} />)
    expect(screen.getByText(/chien/i)).toBeInTheDocument()
  })

  it('affiche le badge de statut "Disponible" pour published', () => {
    render(<AnimalCard animal={makeAnimal({ status: 'published' })} />)
    expect(screen.getByText('Disponible')).toBeInTheDocument()
  })

  it('affiche le badge "Réservé" pour le statut reserved', () => {
    render(<AnimalCard animal={makeAnimal({ status: 'reserved' })} />)
    expect(screen.getByText('Réservé')).toBeInTheDocument()
  })
})

// =============================================================================
// Lien de navigation
// =============================================================================

describe('AnimalCard — lien', () => {
  it('le lien pointe vers /animaux/{id}', () => {
    render(<AnimalCard animal={makeAnimal({ id: 99 })} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/animaux/99')
  })
})

// =============================================================================
// Image et fallback
// =============================================================================

describe('AnimalCard — image', () => {
  it('affiche le fallback 🐾 quand cover_url est vide', () => {
    render(<AnimalCard animal={makeAnimal({ cover_url: '' })} />)
    expect(screen.getByText('🐾')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('affiche une <img> quand cover_url est défini', () => {
    render(<AnimalCard animal={makeAnimal({ cover_url: '/uploads/animals/dog.jpg' })} />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', 'Golden Retriever adulte')
  })

  it('ne rend pas le fallback quand une image est présente', () => {
    render(<AnimalCard animal={makeAnimal({ cover_url: '/uploads/animals/dog.jpg' })} />)
    expect(screen.queryByText('🐾')).not.toBeInTheDocument()
  })
})

// =============================================================================
// Bouton favori
// =============================================================================

describe('AnimalCard — bouton favori', () => {
  it('affiche le bouton "Ajouter aux favoris" par défaut', () => {
    render(<AnimalCard animal={makeAnimal()} />)
    expect(
      screen.getByRole('button', { name: 'Ajouter aux favoris' }),
    ).toBeInTheDocument()
  })

  it('affiche "Retirer des favoris" quand isFavorite=true', () => {
    render(<AnimalCard animal={makeAnimal()} isFavorite />)
    expect(
      screen.getByRole('button', { name: 'Retirer des favoris' }),
    ).toBeInTheDocument()
  })

  it('appelle onToggleFavorite au clic', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<AnimalCard animal={makeAnimal()} onToggleFavorite={onToggle} />)
    await user.click(screen.getByRole('button', { name: 'Ajouter aux favoris' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('n\'appelle pas onToggleFavorite si le handler n\'est pas fourni', async () => {
    const user = userEvent.setup()
    render(<AnimalCard animal={makeAnimal()} />)
    // Ne doit pas planter
    await expect(
      user.click(screen.getByRole('button', { name: 'Ajouter aux favoris' })),
    ).resolves.not.toThrow()
  })

  it('n\'affiche pas de bouton favori si showFavoriteButton=false', () => {
    render(<AnimalCard animal={makeAnimal()} showFavoriteButton={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
