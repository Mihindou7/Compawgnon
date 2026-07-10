import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/utils/tokens'

// Vide tous les cookies entre chaque test pour éviter les interférences.
function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim()
    if (name) document.cookie = `${name}=; max-age=0; path=/`
  })
}

beforeEach(() => clearAllCookies())
afterEach(() => clearAllCookies())

// =============================================================================
// getAccessToken / getRefreshToken — état initial
// =============================================================================

describe('getAccessToken', () => {
  it('retourne null quand aucun token n\'est stocké', () => {
    expect(getAccessToken()).toBeNull()
  })
})

describe('getRefreshToken', () => {
  it('retourne null quand aucun token n\'est stocké', () => {
    expect(getRefreshToken()).toBeNull()
  })
})

// =============================================================================
// setTokens
// =============================================================================

describe('setTokens', () => {
  it('stocke et relit correctement le token d\'accès', () => {
    setTokens('access-jwt-abc', 'refresh-jwt-xyz')
    expect(getAccessToken()).toBe('access-jwt-abc')
  })

  it('stocke et relit correctement le token de rafraîchissement', () => {
    setTokens('access-jwt-abc', 'refresh-jwt-xyz')
    expect(getRefreshToken()).toBe('refresh-jwt-xyz')
  })

  it('stocke les deux tokens indépendamment', () => {
    setTokens('token-A', 'token-R')
    expect(getAccessToken()).toBe('token-A')
    expect(getRefreshToken()).toBe('token-R')
  })

  it('écrase les tokens précédents lors d\'un second appel', () => {
    setTokens('old-access', 'old-refresh')
    setTokens('new-access', 'new-refresh')
    expect(getAccessToken()).toBe('new-access')
    expect(getRefreshToken()).toBe('new-refresh')
  })

  it('encode et décode correctement les caractères spéciaux (JWT réel)', () => {
    // Un JWT contient des "." et potentiellement des "=" en base64url.
    const fakeJwt = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.signature=='
    setTokens(fakeJwt, 'refresh')
    expect(getAccessToken()).toBe(fakeJwt)
  })
})

// =============================================================================
// clearTokens
// =============================================================================

describe('clearTokens', () => {
  it('supprime le token d\'accès', () => {
    setTokens('access-jwt', 'refresh-jwt')
    clearTokens()
    expect(getAccessToken()).toBeNull()
  })

  it('supprime le token de rafraîchissement', () => {
    setTokens('access-jwt', 'refresh-jwt')
    clearTokens()
    expect(getRefreshToken()).toBeNull()
  })

  it('supprime les deux tokens simultanément', () => {
    setTokens('access-jwt', 'refresh-jwt')
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('ne lève pas d\'exception si appelé sans tokens stockés', () => {
    expect(() => clearTokens()).not.toThrow()
  })

  it('ne lève pas d\'exception si appelé deux fois de suite', () => {
    setTokens('access', 'refresh')
    clearTokens()
    expect(() => clearTokens()).not.toThrow()
  })
})

// =============================================================================
// Attributs de sécurité du cookie (path, max-age, SameSite, Secure conditionnel)
// =============================================================================

describe('setTokens — attributs de sécurité du cookie', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pose les deux cookies avec path=/, SameSite=Strict et le bon max-age', () => {
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    setTokens('access-jwt', 'refresh-jwt')

    const writes  = setSpy.mock.calls.map((call) => call[0] as string)
    const access  = writes.find((w) => w.startsWith('access_token='))
    const refresh = writes.find((w) => w.startsWith('refresh_token='))

    expect(access).toContain('path=/')
    expect(access).toContain('max-age=3600')
    expect(access).toContain('SameSite=Strict')

    expect(refresh).toContain('path=/')
    expect(refresh).toContain(`max-age=${60 * 60 * 24 * 30}`)
    expect(refresh).toContain('SameSite=Strict')

    setSpy.mockRestore()
  })

  it('ajoute Secure quand le site est servi en HTTPS', () => {
    vi.stubGlobal('location', { ...window.location, protocol: 'https:' })
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    setTokens('access-jwt', 'refresh-jwt')

    const access = setSpy.mock.calls.map((call) => call[0] as string).find((w) => w.startsWith('access_token='))
    expect(access).toContain('; Secure')

    setSpy.mockRestore()
  })

  it("n'ajoute pas Secure en HTTP (dev local / test sur IP LAN)", () => {
    vi.stubGlobal('location', { ...window.location, protocol: 'http:' })
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    setTokens('access-jwt', 'refresh-jwt')

    const access = setSpy.mock.calls.map((call) => call[0] as string).find((w) => w.startsWith('access_token='))
    expect(access).not.toContain('Secure')

    setSpy.mockRestore()
  })

  it('la suppression des cookies porte aussi les mêmes attributs de sécurité', () => {
    vi.stubGlobal('location', { ...window.location, protocol: 'https:' })
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    clearTokens()

    const writes = setSpy.mock.calls.map((call) => call[0] as string)
    expect(writes.find((w) => w.startsWith('access_token='))).toContain('SameSite=Strict')
    expect(writes.find((w) => w.startsWith('access_token='))).toContain('; Secure')
    expect(writes.find((w) => w.startsWith('refresh_token='))).toContain('; Secure')

    setSpy.mockRestore()
  })
})

// =============================================================================
// setTokens / clearTokens — attributs de sécurité du cookie
// =============================================================================

describe('setTokens — attributs de sécurité du cookie', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('pose le cookie access_token avec SameSite=Strict, path=/ et le bon max-age', () => {
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    setTokens('access-jwt', 'refresh-jwt')

    const accessWrite = setSpy.mock.calls.map((c) => c[0]).find((v) => v.startsWith('access_token='))
    expect(accessWrite).toBeDefined()
    expect(accessWrite).toContain('SameSite=Strict')
    expect(accessWrite).toContain('path=/')
    expect(accessWrite).toContain('max-age=3600')
  })

  it('pose le cookie refresh_token avec le bon max-age (30 jours)', () => {
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    setTokens('access-jwt', 'refresh-jwt')

    const refreshWrite = setSpy.mock.calls.map((c) => c[0]).find((v) => v.startsWith('refresh_token='))
    expect(refreshWrite).toBeDefined()
    expect(refreshWrite).toContain('SameSite=Strict')
    expect(refreshWrite).toContain(`max-age=${60 * 60 * 24 * 30}`)
  })

  it('ajoute l\'attribut Secure quand le site est servi en HTTPS', () => {
    vi.stubGlobal('location', { ...window.location, protocol: 'https:' })
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    setTokens('access-jwt', 'refresh-jwt')

    const accessWrite = setSpy.mock.calls.map((c) => c[0]).find((v) => v.startsWith('access_token='))
    expect(accessWrite).toContain('; Secure')
  })

  it("n'ajoute pas Secure en HTTP (dev local ou test sur un appareil via IP LAN)", () => {
    vi.stubGlobal('location', { ...window.location, protocol: 'http:' })
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    setTokens('access-jwt', 'refresh-jwt')

    const accessWrite = setSpy.mock.calls.map((c) => c[0]).find((v) => v.startsWith('access_token='))
    expect(accessWrite).not.toContain('Secure')
  })

  it('deleteCookie (via clearTokens) reprend les mêmes attributs SameSite/Secure', () => {
    vi.stubGlobal('location', { ...window.location, protocol: 'https:' })
    const setSpy = vi.spyOn(document, 'cookie', 'set')

    clearTokens()

    const writes = setSpy.mock.calls.map((c) => c[0])
    expect(writes.some((v) => v.startsWith('access_token=') && v.includes('; Secure'))).toBe(true)
    expect(writes.some((v) => v.startsWith('refresh_token=') && v.includes('SameSite=Strict'))).toBe(true)
  })
})

// =============================================================================
// Cycle complet set → get → clear → get
// =============================================================================

describe('cycle complet', () => {
  it('set → get → clear → get retourne null', () => {
    setTokens('my-access', 'my-refresh')
    expect(getAccessToken()).toBe('my-access')
    expect(getRefreshToken()).toBe('my-refresh')

    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('plusieurs cycles successifs fonctionnent correctement', () => {
    setTokens('first-access', 'first-refresh')
    clearTokens()
    setTokens('second-access', 'second-refresh')
    expect(getAccessToken()).toBe('second-access')
    expect(getRefreshToken()).toBe('second-refresh')
  })
})
