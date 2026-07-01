import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/lib/types/api.types'
import type { SellerVerifiedStatus } from '@/lib/types/auth.types'
import { useAuthStore } from '@/stores/auth.store'

// ---------------------------------------------------------------------------
// vi.hoisted garantit que les variables existent avant que vi.mock ne soit exécuté
// (vi.mock est hoisted au sommet du fichier, avant toute déclaration const)
// ---------------------------------------------------------------------------

const {
  mockPush,
  mockLogout,
  mockGetRefresh,
  mockClearTokens,
  mockGetAccess,
  mockSetTokens,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockPush:         vi.fn(),
  mockLogout:       vi.fn(),
  mockGetRefresh:   vi.fn(),
  mockClearTokens:  vi.fn(),
  mockGetAccess:    vi.fn(),
  mockSetTokens:    vi.fn(),
  mockToastSuccess: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: vi.fn() },
}))

vi.mock('@/lib/api/auth.api', () => ({
  authApi: { logout: mockLogout },
}))

vi.mock('@/lib/utils/tokens', () => ({
  getRefreshToken: mockGetRefresh,
  getAccessToken:  mockGetAccess,
  setTokens:       mockSetTokens,
  clearTokens:     mockClearTokens,
}))

// ---------------------------------------------------------------------------
// Données de test
// ---------------------------------------------------------------------------

const USER_BUYER: User = {
  id: 1,
  email: 'buyer@test.com',
  first_name: 'Marie',
  last_name: 'Dupont',
  phone: null,
  avatar_url: null,
  roles: ['ROLE_USER'],
  is_verified: true,
  status: 'active',
  seller: null,
  created_at: '2024-01-01',
}

const USER_ADMIN: User = {
  ...USER_BUYER,
  id: 2,
  email: 'admin@test.com',
  roles: ['ROLE_USER', 'ROLE_ADMIN'],
}

// ---------------------------------------------------------------------------
// Helper reset store
// ---------------------------------------------------------------------------

interface StoreOverrides {
  user?: User | null
  isAuthenticated?: boolean
  isVerified?: boolean
  sellerStatus?: SellerVerifiedStatus | null
  sellerId?: number | null
}

function resetStore(overrides: StoreOverrides = {}) {
  useAuthStore.setState({
    user:            null,
    isAuthenticated: false,
    isVerified:      false,
    sellerStatus:    null,
    sellerId:        null,
    ...overrides,
  })
}

beforeEach(() => {
  resetStore()
  vi.clearAllMocks()
  mockGetRefresh.mockReturnValue(null)
  mockLogout.mockResolvedValue(undefined)
})

afterEach(() => {
  resetStore()
})

// =============================================================================
// État non authentifié
// =============================================================================

describe('useAuth — utilisateur non connecté', () => {
  it('isAuthenticated est false sans utilisateur', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('user est null sans utilisateur', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
  })

  it('isAdmin est false sans utilisateur', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAdmin).toBe(false)
  })

  it('isSeller est false sans utilisateur', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isSeller).toBe(false)
  })
})

// =============================================================================
// isAdmin
// =============================================================================

describe('useAuth — isAdmin', () => {
  it('est false pour un acheteur (ROLE_USER uniquement)', () => {
    resetStore({ user: USER_BUYER, isAuthenticated: true })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAdmin).toBe(false)
  })

  it('est true pour un utilisateur avec ROLE_ADMIN', () => {
    resetStore({ user: USER_ADMIN, isAuthenticated: true })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAdmin).toBe(true)
  })
})

// =============================================================================
// isSeller
// =============================================================================

describe('useAuth — isSeller', () => {
  it('est false quand sellerStatus est null', () => {
    resetStore({ user: USER_BUYER, isAuthenticated: true, sellerStatus: null })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isSeller).toBe(false)
  })

  it('est false quand sellerStatus est "pending"', () => {
    resetStore({ user: USER_BUYER, isAuthenticated: true, sellerStatus: 'pending' })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isSeller).toBe(false)
  })

  it('est true quand sellerStatus est "approved"', () => {
    resetStore({ user: USER_BUYER, isAuthenticated: true, sellerStatus: 'approved' })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isSeller).toBe(true)
  })
})

// =============================================================================
// setUser
// =============================================================================

describe('useAuth — setUser', () => {
  it('met à jour le store et isAuthenticated passe à true', () => {
    const { result } = renderHook(() => useAuth())

    act(() => { result.current.setUser(USER_BUYER) })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.email).toBe('buyer@test.com')
    expect(result.current.isVerified).toBe(true)
  })
})

// =============================================================================
// logout
// =============================================================================

describe('useAuth — logout', () => {
  it('vide le store et redirige vers /connexion', async () => {
    resetStore({ user: USER_BUYER, isAuthenticated: true })
    const { result } = renderHook(() => useAuth())

    await act(async () => { await result.current.logout() })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mockPush).toHaveBeenCalledWith('/connexion')
  })

  it('appelle authApi.logout si un refresh token est présent', async () => {
    mockGetRefresh.mockReturnValue('my-refresh-token')
    resetStore({ user: USER_BUYER, isAuthenticated: true })
    const { result } = renderHook(() => useAuth())

    await act(async () => { await result.current.logout() })

    expect(mockLogout).toHaveBeenCalledWith('my-refresh-token')
  })

  it('ne plante pas si authApi.logout rejette', async () => {
    mockGetRefresh.mockReturnValue('token')
    mockLogout.mockRejectedValue(new Error('réseau'))
    resetStore({ user: USER_BUYER, isAuthenticated: true })
    const { result } = renderHook(() => useAuth())

    await expect(
      act(async () => { await result.current.logout() }),
    ).resolves.not.toThrow()

    expect(mockPush).toHaveBeenCalledWith('/connexion')
  })

  it('n\'appelle pas authApi.logout si aucun refresh token', async () => {
    mockGetRefresh.mockReturnValue(null)
    resetStore({ user: USER_BUYER, isAuthenticated: true })
    const { result } = renderHook(() => useAuth())

    await act(async () => { await result.current.logout() })

    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('affiche un toast de succès après déconnexion', async () => {
    resetStore({ user: USER_BUYER, isAuthenticated: true })
    const { result } = renderHook(() => useAuth())

    await act(async () => { await result.current.logout() })

    expect(mockToastSuccess).toHaveBeenCalledWith('Déconnexion réussie')
  })
})
