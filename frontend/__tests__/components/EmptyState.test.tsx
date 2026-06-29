import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dog } from 'lucide-react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState } from '@/components/ui/EmptyState'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('EmptyState', () => {
  it('affiche le titre', () => {
    render(<EmptyState title="Aucun résultat" />)
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument()
  })

  it('affiche la description quand elle est fournie', () => {
    render(<EmptyState title="Titre" description="Essayez d'autres filtres" />)
    expect(screen.getByText("Essayez d'autres filtres")).toBeInTheDocument()
  })

  it("n'affiche pas de description si elle est absente", () => {
    const { container } = render(<EmptyState title="Titre" />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('affiche une icône SVG quand elle est fournie', () => {
    const { container } = render(<EmptyState title="Titre" icon={Dog} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it("n'affiche pas d'icône si elle est absente", () => {
    const { container } = render(<EmptyState title="Titre" />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('affiche un bouton avec onClick et déclenche le handler au clic', async () => {
    const handler = vi.fn()
    render(<EmptyState title="Titre" action={{ label: 'Réessayer', onClick: handler }} />)
    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('affiche un lien quand action.href est fourni', () => {
    render(<EmptyState title="Titre" action={{ label: 'Voir tout', href: '/animaux' }} />)
    expect(screen.getByRole('link', { name: /voir tout/i })).toHaveAttribute('href', '/animaux')
  })

  it("n'affiche pas de bouton d'action si action est absent", () => {
    render(<EmptyState title="Titre" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('applique la className personnalisée sur le conteneur', () => {
    const { container } = render(<EmptyState title="Titre" className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
