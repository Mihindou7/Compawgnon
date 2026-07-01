import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, api } from '@/lib/api/client'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockGetAccessToken,
  mockGetRefreshToken,
  mockSetTokens,
  mockClearTokens,
} = vi.hoisted(() => ({
  mockGetAccessToken:  vi.fn(),
  mockGetRefreshToken: vi.fn(),
  mockSetTokens:       vi.fn(),
  mockClearTokens:     vi.fn(),
}))

vi.mock('@/lib/utils/tokens', () => ({
  getAccessToken:  mockGetAccessToken,
  getRefreshToken: mockGetRefreshToken,
  setTokens:       mockSetTokens,
  clearTokens:     mockClearTokens,
}))

// fetch global stubé une seule fois pour tout le fichier
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(
  status: number,
  body: unknown = {},
): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAccessToken.mockReturnValue(null)
  mockGetRefreshToken.mockReturnValue(null)
})

afterEach(() => {
  // On s'assure qu'aucune promesse ne reste en suspens
  vi.clearAllTimers()
})

// =============================================================================
// Headers et méthode
// =============================================================================

describe('api — headers de requête', () => {
  it('inclut Authorization: Bearer <token> quand un access token est présent', async () => {
    mockGetAccessToken.mockReturnValue('my-access-token')
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }))

    await api.get('/api/me')

    const [, options] = mockFetch.mock.calls[0]
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer my-access-token',
    })
  })

  it('n\'inclut pas Authorization si aucun token', async () => {
    mockGetAccessToken.mockReturnValue(null)
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }))

    await api.get('/api/public')

    const [, options] = mockFetch.mock.calls[0]
    expect((options as RequestInit & { headers: Record<string, string> }).headers?.Authorization)
      .toBeUndefined()
  })

  it('appelle fetch avec method=POST et body JSON pour api.post', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { created: true }))

    await api.post('/api/resource', { name: 'Rex' })

    const [, options] = mockFetch.mock.calls[0]
    expect((options as RequestInit).method).toBe('POST')
    expect((options as RequestInit).body).toBe(JSON.stringify({ name: 'Rex' }))
  })

  it('appelle fetch avec method=PATCH pour api.patch', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}))
    await api.patch('/api/resource/1', { name: 'Max' })
    const [, opts] = mockFetch.mock.calls[0]
    expect((opts as RequestInit).method).toBe('PATCH')
  })

  it('appelle fetch avec method=DELETE pour api.delete', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}))
    await api.delete('/api/resource/1')
    const [, opts] = mockFetch.mock.calls[0]
    expect((opts as RequestInit).method).toBe('DELETE')
  })
})

// =============================================================================
// Réponses réussies
// =============================================================================

describe('api — réponses réussies', () => {
  it('retourne la réponse JSON pour un statut 200', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { data: 'hello' }))
    const result = await api.get<{ data: string }>('/api/test')
    expect(result).toEqual({ data: 'hello' })
  })

  it('retourne null pour un statut 204 (No Content)', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(204, null))
    const result = await api.delete('/api/resource/1')
    expect(result).toBeNull()
  })
})

// =============================================================================
// Erreurs non-401
// =============================================================================

describe('api — erreurs HTTP non-401', () => {
  it('throw ApiError(400, message) pour une réponse 400', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(400, { error: 'Champ invalide' }))

    await expect(api.get('/api/bad')).rejects.toMatchObject({
      status:  400,
      message: 'Champ invalide',
    })
  })

  it('throw ApiError(404, message) pour une réponse 404', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(404, { message: 'Introuvable' }))

    await expect(api.get('/api/missing')).rejects.toMatchObject({
      status:  404,
      message: 'Introuvable',
    })
  })

  it('throw ApiError(500) avec un message de fallback si le body est vide', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      ok: false,
      json: async () => { throw new Error('pas de JSON') },
    } as unknown as Response)

    await expect(api.get('/api/crash')).rejects.toMatchObject({
      status:  500,
      message: 'Erreur serveur',
    })
  })

  it('l\'erreur est une instance de ApiError', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(403, { error: 'Interdit' }))

    await expect(api.get('/api/forbidden')).rejects.toBeInstanceOf(ApiError)
  })
})

// =============================================================================
// Intercepteur 401 — refresh automatique
// =============================================================================

describe('api — refresh automatique sur 401', () => {
  it('retente la requête avec le nouveau token après un refresh réussi', async () => {
    mockGetRefreshToken.mockReturnValue('old-refresh')

    mockFetch
      .mockResolvedValueOnce(makeResponse(401, {}))  // 1ère tentative → 401
      .mockResolvedValueOnce(makeResponse(200, { token: 'new-tok', refresh_token: 'new-ref' }))  // refresh
      .mockResolvedValueOnce(makeResponse(200, { data: 'success' }))  // retry

    const result = await api.get<{ data: string }>('/api/protected')

    expect(mockSetTokens).toHaveBeenCalledWith('new-tok', 'new-ref')
    expect(result).toEqual({ data: 'success' })
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('appelle le bon endpoint de refresh', async () => {
    mockGetRefreshToken.mockReturnValue('my-refresh')

    mockFetch
      .mockResolvedValueOnce(makeResponse(401, {}))
      .mockResolvedValueOnce(makeResponse(200, { token: 'new', refresh_token: 'new-ref' }))
      .mockResolvedValueOnce(makeResponse(200, {}))

    await api.get('/api/protected')

    const refreshCall = mockFetch.mock.calls[1]
    expect(String(refreshCall[0])).toContain('/api/auth/token/refresh')
  })

  it('throw ApiError(401) et efface les tokens si aucun refresh token', async () => {
    mockGetRefreshToken.mockReturnValue(null)
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}))

    await expect(api.get('/api/protected')).rejects.toMatchObject({ status: 401 })
    expect(mockClearTokens).toHaveBeenCalled()
    // Aucun appel de refresh
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throw ApiError(401) et efface les tokens si le refresh échoue (4xx)', async () => {
    mockGetRefreshToken.mockReturnValue('stale-refresh')

    mockFetch
      .mockResolvedValueOnce(makeResponse(401, {}))   // requête initiale
      .mockResolvedValueOnce(makeResponse(401, {}))   // refresh endpoint renvoie 401

    await expect(api.get('/api/protected')).rejects.toMatchObject({ status: 401 })
    expect(mockClearTokens).toHaveBeenCalled()
  })

  it('ne retente pas la requête une deuxième fois après le retry (retry=false)', async () => {
    mockGetRefreshToken.mockReturnValue('refresh-tok')

    mockFetch
      .mockResolvedValueOnce(makeResponse(401, {}))  // requête initiale
      .mockResolvedValueOnce(makeResponse(200, { token: 'new', refresh_token: 'new-ref' }))  // refresh
      .mockResolvedValueOnce(makeResponse(401, {}))  // retry renvoie encore 401 → ne doit PAS boucler

    // Le retry avec retry=false doit throw directement sans rappeler tryRefreshToken
    await expect(api.get('/api/protected')).rejects.toMatchObject({ status: 401 })
    expect(mockFetch).toHaveBeenCalledTimes(3)  // initiale + refresh + retry (pas de 4ème)
  })
})

// =============================================================================
// Requêtes 401 simultanées — le refresh n'est appelé qu'une fois
// =============================================================================

describe('api — 401 simultanés → un seul refresh', () => {
  it('plusieurs requêtes échouant en 401 déclenchent un seul appel refresh', async () => {
    mockGetRefreshToken.mockReturnValue('shared-refresh')

    // Contrôlons la résolution du refresh manuellement
    let resolveRefresh!: (v: Response) => void
    const pendingRefresh = new Promise<Response>(r => { resolveRefresh = r })

    mockFetch
      .mockResolvedValueOnce(makeResponse(401))            // A : 401
      .mockResolvedValueOnce(makeResponse(401))            // B : 401
      .mockImplementationOnce(() => pendingRefresh)        // refresh (en attente)
      .mockResolvedValue(makeResponse(200, { ok: true }))  // retries A et B

    const [promiseA, promiseB] = [api.get('/a'), api.get('/b')]

    // Laisser les microtasks 401 se traiter (A marque isRefreshing=true, B se met en file)
    await new Promise(r => setTimeout(r, 0))

    // Débloquer le refresh
    resolveRefresh({
      ok: true,
      status: 200,
      json: async () => ({ token: 'new-tok', refresh_token: 'new-ref' }),
    } as Response)

    await Promise.all([promiseA, promiseB])

    const refreshCalls = mockFetch.mock.calls.filter(([url]) =>
      String(url).includes('token/refresh'),
    )
    expect(refreshCalls).toHaveLength(1)  // un seul appel au refresh
    expect(mockSetTokens).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(5)  // A + B + refresh + A-retry + B-retry
  })
})
