import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { User } from '@/lib/types/api.types'
import type { JwtPayload } from '@/lib/types/auth.types'
import { useAuthStore } from '@/stores/auth.store'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockGetAccessToken,
  mockGetRefreshToken,
  mockSetTokens,
  mockClearTokens,
  mockJwtDecode,
} = vi.hoisted(() => ({
  mockGetAccessToken:  vi.fn(),
  mockGetRefreshToken: vi.fn(),
  mockSetTokens:       vi.fn(),
  mockClearTokens:     vi.fn(),
  mockJwtDecode:       vi.fn(),
}))

vi.mock('@/lib/utils/tokens', () => ({
  getAccessToken:  mockGetAccessToken,
  getRefreshToken: mockGetRefreshToken,
  setTokens:       mockSetTokens,
  clearTokens:     mockClearTokens,
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: mockJwtDecode,
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW_SECONDS = Math.floor(Date.now() / 1000)

const VALID_JWT_PAYLOAD: JwtPayload = {
  id:          1,
  email:       'jean@test.com',
  first_name:  'Jean',
  last_name:   'Dupont',
  avatar_url:  null,
  roles:       ['ROLE_USER'],
  status:      'active',
  is_verified: true,
  seller_id:   undefined,
  seller_status: undefined,
  exp: NOW_SECONDS + 3600,   // expire dans 1h
  iat: NOW_SECONDS,
}

const EXPIRED_JWT_PAYLOAD: JwtPayload = {
  ...VALID_JWT_PAYLOAD,
  exp: NOW_SECONDS - 3600,   // expiré il y a 1h
}

const SELLER_JWT_PAYLOAD: JwtPayload = {
  ...VALID_JWT_PAYLOAD,
  roles:         ['ROLE_USER', 'ROLE_SELLER'],
  seller_id:     42,
  seller_status: 'approved',
}

const USER_BUYER: User = {
  id:          1,
  email:       'buyer@test.com',
  first_name:  'Marie',
  last_name:   'Acheteur',
  phone:       null,
  avatar_url:  null,
  roles:       ['ROLE_USER'],
  is_verified: true,
  status:      'active',
  seller:      null,
  created_at:  '2024-01-01',
}

const USER_SELLER: User = {
  ...USER_BUYER,
  id:    2,
  email: 'seller@test.com',
  roles: ['ROLE_USER', 'ROLE_SELLER'],
  seller: {
    id:              42,
    user_id:         2,
    name:            'Élevage Test',
    verified_status: 'approved',
  },
}

// ---------------------------------------------------------------------------
// Reset du store entre les tests
// ---------------------------------------------------------------------------

const EMPTY_STATE = {
  user:            null,
  isAuthenticated: false,
  isVerified:      false,
  sellerStatus:    null,
  sellerId:        null,
}

beforeEach(() => {
  useAuthStore.setState(EMPTY_STATE)
  vi.clearAllMocks()
  mockGetAccessToken.mockReturnValue(null)
  mockGetRefreshToken.mockReturnValue(null)
})

// =============================================================================
// État initial
// =============================================================================

describe('useAuthStore — état initial', () => {
  it('user est null par défaut', () => {
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('isAuthenticated est false par défaut', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('sellerStatus est null par défaut', () => {
    expect(useAuthStore.getState().sellerStatus).toBeNull()
  })
})

// =============================================================================
// setUser()
// =============================================================================

describe('useAuthStore — setUser()', () => {
  it('peuple user et passe isAuthenticated à true', () => {
    useAuthStore.getState().setUser(USER_BUYER)

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(isAuthenticated).toBe(true)
    expect(user?.email).toBe('buyer@test.com')
  })

  it('synchronise isVerified depuis user.is_verified', () => {
    useAuthStore.getState().setUser({ ...USER_BUYER, is_verified: false })
    expect(useAuthStore.getState().isVerified).toBe(false)

    useAuthStore.getState().setUser({ ...USER_BUYER, is_verified: true })
    expect(useAuthStore.getState().isVerified).toBe(true)
  })

  it('sellerStatus est null quand l\'utilisateur n\'est pas vendeur', () => {
    useAuthStore.getState().setUser(USER_BUYER)  // seller: null
    expect(useAuthStore.getState().sellerStatus).toBeNull()
    expect(useAuthStore.getState().sellerId).toBeNull()
  })

  it('extrait sellerStatus depuis user.seller.verified_status', () => {
    useAuthStore.getState().setUser(USER_SELLER)
    expect(useAuthStore.getState().sellerStatus).toBe('approved')
    expect(useAuthStore.getState().sellerId).toBe(42)
  })

  it('sellerStatus = "pending" pour un vendeur non approuvé', () => {
    useAuthStore.getState().setUser({
      ...USER_SELLER,
      seller: { ...USER_SELLER.seller!, verified_status: 'pending' },
    })
    expect(useAuthStore.getState().sellerStatus).toBe('pending')
  })
})

// =============================================================================
// logout()
// =============================================================================

describe('useAuthStore — logout()', () => {
  it('remet l\'état à vide', () => {
    useAuthStore.getState().setUser(USER_BUYER)
    useAuthStore.getState().logout()

    const { user, isAuthenticated, isVerified, sellerStatus } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
    expect(isVerified).toBe(false)
    expect(sellerStatus).toBeNull()
  })

  it('appelle clearTokens()', () => {
    useAuthStore.getState().setUser(USER_BUYER)
    useAuthStore.getState().logout()
    expect(mockClearTokens).toHaveBeenCalled()
  })
})

// =============================================================================
// hydrate()
// =============================================================================

describe('useAuthStore — hydrate()', () => {
  it('remet l\'état à vide si aucun token disponible', () => {
    mockGetAccessToken.mockReturnValue(null)
    mockGetRefreshToken.mockReturnValue(null)
    useAuthStore.getState().hydrate()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('peuple le store depuis le payload JWT valide', () => {
    mockGetAccessToken.mockReturnValue('valid.jwt.token')
    mockJwtDecode.mockReturnValue(VALID_JWT_PAYLOAD)

    useAuthStore.getState().hydrate()

    const { user, isAuthenticated, isVerified, sellerStatus } = useAuthStore.getState()
    expect(isAuthenticated).toBe(true)
    expect(isVerified).toBe(true)
    expect(user?.email).toBe('jean@test.com')
    expect(user?.id).toBe(1)
    expect(sellerStatus).toBeNull()
  })

  it('construit seller dans user si seller_id est dans le payload', () => {
    mockGetAccessToken.mockReturnValue('seller.jwt.token')
    mockJwtDecode.mockReturnValue(SELLER_JWT_PAYLOAD)

    useAuthStore.getState().hydrate()

    const { sellerStatus, sellerId, user } = useAuthStore.getState()
    expect(sellerStatus).toBe('approved')
    expect(sellerId).toBe(42)
    expect(user?.seller?.id).toBe(42)
  })

  it('efface les tokens et remet à vide si le token est expiré et qu\'il n\'y a pas de refresh', () => {
    mockGetAccessToken.mockReturnValue('expired.jwt.token')
    mockGetRefreshToken.mockReturnValue(null)
    mockJwtDecode.mockReturnValue(EXPIRED_JWT_PAYLOAD)

    useAuthStore.getState().hydrate()

    expect(mockClearTokens).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('tente un refreshSession() si le token est expiré mais un refresh token existe', async () => {
    mockGetAccessToken.mockReturnValue('expired.jwt.token')
    mockGetRefreshToken.mockReturnValue('refresh-tok')
    mockJwtDecode.mockReturnValue(EXPIRED_JWT_PAYLOAD)

    // refreshSession fera un fetch — on le simule
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'new-access', refresh_token: 'new-refresh' }),
    } as unknown as Response)
    // Après setTokens, hydrate sera rappelé avec le nouveau token
    mockGetAccessToken.mockReturnValueOnce('expired.jwt.token')
      .mockReturnValue('new-access')
    mockJwtDecode
      .mockReturnValueOnce(EXPIRED_JWT_PAYLOAD)  // premier appel (token expiré)
      .mockReturnValue(VALID_JWT_PAYLOAD)         // après refresh

    useAuthStore.getState().hydrate()

    // Attend la promesse refreshSession (async)
    await new Promise(r => setTimeout(r, 0))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/token/refresh'),
      expect.any(Object),
    )
  })

  it('efface les tokens et remet à vide si jwtDecode lance une exception', () => {
    mockGetAccessToken.mockReturnValue('malformed.token')
    mockJwtDecode.mockImplementation(() => { throw new Error('invalid') })

    useAuthStore.getState().hydrate()

    expect(mockClearTokens).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('tente refreshSession si access token absent mais refresh token présent', async () => {
    mockGetAccessToken.mockReturnValue(null)
    mockGetRefreshToken.mockReturnValue('existing-refresh')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid' }),
    } as unknown as Response)

    useAuthStore.getState().hydrate()

    await new Promise(r => setTimeout(r, 0))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/token/refresh'),
      expect.any(Object),
    )
  })
})

// =============================================================================
// refreshSession()
// =============================================================================

describe('useAuthStore — refreshSession()', () => {
  it('retourne false et efface les tokens si pas de refresh token', async () => {
    mockGetRefreshToken.mockReturnValue(null)

    const result = await useAuthStore.getState().refreshSession()

    expect(result).toBe(false)
    expect(mockClearTokens).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('retourne false et efface les tokens si le fetch échoue', async () => {
    mockGetRefreshToken.mockReturnValue('stale-refresh')
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as unknown as Response)

    const result = await useAuthStore.getState().refreshSession()

    expect(result).toBe(false)
    expect(mockClearTokens).toHaveBeenCalled()
  })

  it('retourne false et efface les tokens si fetch lance une exception réseau', async () => {
    mockGetRefreshToken.mockReturnValue('stale-refresh')
    mockFetch.mockRejectedValueOnce(new Error('réseau'))

    const result = await useAuthStore.getState().refreshSession()

    expect(result).toBe(false)
    expect(mockClearTokens).toHaveBeenCalled()
  })

  it('appelle setTokens et hydrate puis retourne true si le refresh réussit', async () => {
    mockGetRefreshToken.mockReturnValue('valid-refresh')
    mockGetAccessToken.mockReturnValue('fresh-access')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'fresh-access', refresh_token: 'fresh-refresh' }),
    } as unknown as Response)
    mockJwtDecode.mockReturnValue(VALID_JWT_PAYLOAD)

    const result = await useAuthStore.getState().refreshSession()

    expect(result).toBe(true)
    expect(mockSetTokens).toHaveBeenCalledWith('fresh-access', 'fresh-refresh')
    // hydrate() a été rappelé → store peuplé
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
