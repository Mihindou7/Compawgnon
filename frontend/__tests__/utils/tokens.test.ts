import { afterEach, beforeEach, describe, expect, it } from 'vitest'

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
