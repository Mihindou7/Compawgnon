import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('affiche son contenu texte', () => {
    render(<Button>Envoyer</Button>)
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeInTheDocument()
  })

  it('est désactivé quand disabled est true', () => {
    render(<Button disabled>Envoyer</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('est désactivé quand isLoading est true', () => {
    render(<Button isLoading>Envoyer</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('déclenche onClick quand on clique dessus', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Cliquer</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('ne déclenche pas onClick quand disabled', async () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Cliquer</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applique la variante danger', () => {
    render(<Button variant="danger">Supprimer</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-red-600')
  })

  it('applique la taille lg', () => {
    render(<Button size="lg">Grand</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('h-12')
  })
})
