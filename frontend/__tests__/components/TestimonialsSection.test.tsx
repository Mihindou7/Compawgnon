import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TestimonialsSection } from '@/components/home/TestimonialsSection'

// ---------------------------------------------------------------------------
// Mock api.get — /api/reviews est un endpoint public, donc le contenu
// `comment`/`buyer_name` provient directement d'un utilisateur non fiable.
// ---------------------------------------------------------------------------

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

vi.mock('@/lib/api/client', () => ({
  api: { get: (...args: unknown[]) => mockGet(...args) },
}))

function renderWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TestimonialsSection />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TestimonialsSection — protection XSS sur les avis publics', () => {
  it('affiche un commentaire malveillant comme texte brut, sans créer de nœud <script>', async () => {
    const payload = '<script>window.__xss_executed = true</script>'
    mockGet.mockResolvedValue([
      { id: 1, rating: 5, comment: payload, buyer_name: 'Attaquant', created_at: '' },
    ])

    const { container } = renderWithClient()

    // Le commentaire malveillant finit par apparaître dans la citation, en texte brut
    await waitFor(() => {
      expect(container.querySelector('blockquote')?.textContent).toContain(payload)
    })

    // Aucune balise <script> n'est réellement créée dans l'arbre DOM
    expect(container.querySelector('script')).toBeNull()

    // Le HTML sérialisé contient les entités échappées, pas la balise brute
    expect(container.innerHTML).toContain('&lt;script&gt;')
    expect(container.innerHTML).not.toContain('<script>window.__xss_executed')

    // Le payload n'a jamais été exécuté
    expect((window as unknown as { __xss_executed?: boolean }).__xss_executed).toBeUndefined()
  })

  it("échappe aussi une balise d'image avec gestionnaire onerror dans le nom de l'acheteur", async () => {
    const payload = '<img src=x onerror="window.__xss_executed = true">'
    mockGet.mockResolvedValue([
      { id: 1, rating: 5, comment: 'Bonne expérience', buyer_name: payload, created_at: '' },
    ])

    const { container } = renderWithClient()

    await waitFor(() => {
      expect(container.querySelector('blockquote')?.textContent).toContain('Bonne expérience')
    })

    expect(container.querySelector('img[src="x"]')).toBeNull()
    expect(container.innerHTML).toContain('&lt;img')
    expect((window as unknown as { __xss_executed?: boolean }).__xss_executed).toBeUndefined()
  })
})
