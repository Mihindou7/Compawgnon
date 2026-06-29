import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AnimalStatusBadge } from '@/components/animal/AnimalStatusBadge'

describe('AnimalStatusBadge', () => {
  it('affiche "Disponible" pour le statut published', () => {
    render(<AnimalStatusBadge status="published" />)
    expect(screen.getByText('Disponible')).toBeInTheDocument()
  })

  it('affiche "En validation" pour le statut pending_review', () => {
    render(<AnimalStatusBadge status="pending_review" />)
    expect(screen.getByText('En validation')).toBeInTheDocument()
  })

  it('affiche "Réservé" pour le statut reserved', () => {
    render(<AnimalStatusBadge status="reserved" />)
    expect(screen.getByText('Réservé')).toBeInTheDocument()
  })

  it('affiche "Vendu" pour le statut sold', () => {
    render(<AnimalStatusBadge status="sold" />)
    expect(screen.getByText('Vendu')).toBeInTheDocument()
  })

  it('affiche "Brouillon" pour le statut draft', () => {
    render(<AnimalStatusBadge status="draft" />)
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
  })

  it('affiche "Archivé" pour le statut archived', () => {
    render(<AnimalStatusBadge status="archived" />)
    expect(screen.getByText('Archivé')).toBeInTheDocument()
  })

  it('applique la classe text-brand-green pour published', () => {
    render(<AnimalStatusBadge status="published" />)
    expect(screen.getByText('Disponible')).toHaveClass('text-brand-green')
  })

  it('applique la classe text-amber-700 pour reserved', () => {
    render(<AnimalStatusBadge status="reserved" />)
    expect(screen.getByText('Réservé')).toHaveClass('text-amber-700')
  })

  it('applique la classe text-blue-700 pour pending_review', () => {
    render(<AnimalStatusBadge status="pending_review" />)
    expect(screen.getByText('En validation')).toHaveClass('text-blue-700')
  })

  it('applique la classe text-gray-600 pour draft, sold et archived', () => {
    const { unmount } = render(<AnimalStatusBadge status="draft" />)
    expect(screen.getByText('Brouillon')).toHaveClass('text-gray-600')
    unmount()

    render(<AnimalStatusBadge status="sold" />)
    expect(screen.getByText('Vendu')).toHaveClass('text-gray-600')
  })

  it('ne rend rien pour un statut inconnu', () => {
    // @ts-expect-error test de statut invalide
    const { container } = render(<AnimalStatusBadge status="unknown" />)
    expect(container.firstChild).toBeNull()
  })
})
