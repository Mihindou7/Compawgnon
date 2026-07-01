import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Pagination } from '@/components/ui/Pagination'
import type { PaginationMeta } from '@/lib/types/pagination.types'

function makeMeta(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  return {
    page: 1,
    limit: 10,
    total: 50,
    total_pages: 5,
    has_next: true,
    has_prev: false,
    ...overrides,
  }
}

describe('Pagination', () => {
  it('ne rend rien si total_pages vaut 1', () => {
    const { container } = render(
      <Pagination meta={makeMeta({ total_pages: 1, has_next: false })} onPageChange={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('ne rend rien si total_pages vaut 0', () => {
    const { container } = render(
      <Pagination meta={makeMeta({ total_pages: 0, has_next: false })} onPageChange={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('le bouton "Page précédente" est désactivé à la page 1', () => {
    render(<Pagination meta={makeMeta({ page: 1, has_prev: false })} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: /page précédente/i })).toBeDisabled()
  })

  it('le bouton "Page précédente" est actif quand has_prev est true', () => {
    render(
      <Pagination meta={makeMeta({ page: 3, has_prev: true, has_next: true })} onPageChange={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /page précédente/i })).not.toBeDisabled()
  })

  it('le bouton "Page suivante" est désactivé à la dernière page', () => {
    render(
      <Pagination
        meta={makeMeta({ page: 5, has_next: false, has_prev: true })}
        onPageChange={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /page suivante/i })).toBeDisabled()
  })

  it('le bouton "Page suivante" est actif quand has_next est true', () => {
    render(<Pagination meta={makeMeta({ page: 1, has_next: true })} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: /page suivante/i })).not.toBeDisabled()
  })

  it('appelle onPageChange(page + 1) au clic sur "Page suivante"', async () => {
    const handler = vi.fn()
    render(
      <Pagination meta={makeMeta({ page: 2, has_prev: true, has_next: true })} onPageChange={handler} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /page suivante/i }))
    expect(handler).toHaveBeenCalledWith(3)
  })

  it('appelle onPageChange(page - 1) au clic sur "Page précédente"', async () => {
    const handler = vi.fn()
    render(
      <Pagination meta={makeMeta({ page: 3, has_prev: true, has_next: true })} onPageChange={handler} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /page précédente/i }))
    expect(handler).toHaveBeenCalledWith(2)
  })

  it('appelle onPageChange avec le bon numéro au clic sur un bouton de page', async () => {
    const handler = vi.fn()
    render(<Pagination meta={makeMeta({ page: 1, has_next: true })} onPageChange={handler} />)
    await userEvent.click(screen.getByRole('button', { name: '3' }))
    expect(handler).toHaveBeenCalledWith(3)
  })

  it('marque la page courante avec aria-current="page"', () => {
    render(
      <Pagination meta={makeMeta({ page: 2, has_prev: true, has_next: true })} onPageChange={() => {}} />,
    )
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  })

  it("les autres pages n'ont pas aria-current", () => {
    render(
      <Pagination meta={makeMeta({ page: 1, has_next: true })} onPageChange={() => {}} />,
    )
    expect(screen.getByRole('button', { name: '2' })).not.toHaveAttribute('aria-current')
  })

  it('affiche les ellipses pour un grand nombre de pages', () => {
    render(
      <Pagination
        meta={makeMeta({ page: 5, total_pages: 10, has_prev: true, has_next: true })}
        onPageChange={() => {}}
      />,
    )
    expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(1)
  })

  it('affiche toutes les pages sans ellipses quand total_pages <= 7', () => {
    render(<Pagination meta={makeMeta({ page: 1, total_pages: 5, has_next: true })} onPageChange={() => {}} />)
    expect(screen.queryByText('…')).not.toBeInTheDocument()
    ;[1, 2, 3, 4, 5].forEach((n) => {
      expect(screen.getByRole('button', { name: String(n) })).toBeInTheDocument()
    })
  })

  it('possède un élément nav avec aria-label="Pagination"', () => {
    render(<Pagination meta={makeMeta()} onPageChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
  })
})
