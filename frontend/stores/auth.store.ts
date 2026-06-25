import { jwtDecode } from 'jwt-decode'
import { create } from 'zustand'

import type { User } from '@/lib/types/api.types'
import type { AuthTokens, JwtPayload, SellerVerifiedStatus } from '@/lib/types/auth.types'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/utils/tokens'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost'

const EMPTY_AUTH = {
  user: null,
  isAuthenticated: false,
  isVerified: false,
  sellerStatus: null,
  sellerId: null,
} as const

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isVerified: boolean
  sellerStatus: SellerVerifiedStatus | null
  sellerId: number | null

  hydrate: () => void
  refreshSession: () => Promise<boolean>
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isVerified: false,
  sellerStatus: null,
  sellerId: null,

  hydrate() {
    const token = getAccessToken()
    if (!token) {
      // Pas d'access token : si un refresh token existe, on tente de restaurer la session.
      if (getRefreshToken()) {
        void get().refreshSession()
        return
      }
      set({ ...EMPTY_AUTH })
      return
    }
    try {
      const payload = jwtDecode<JwtPayload>(token)
      if (payload.exp * 1000 < Date.now()) {
        // Access token expiré : on tente un refresh au lieu de déconnecter.
        if (getRefreshToken()) {
          void get().refreshSession()
          return
        }
        clearTokens()
        set({ ...EMPTY_AUTH })
        return
      }
      set({
        user: {
          id: payload.id,
          email: payload.email ?? (payload as unknown as { username?: string }).username ?? '',
          first_name: payload.first_name ?? null,
          last_name: payload.last_name ?? null,
          phone: null,
          avatar_url: payload.avatar_url ?? null,
          roles: payload.roles,
          is_verified: payload.is_verified,
          status: payload.status,
          seller: payload.seller_id
            ? { id: payload.seller_id, name: '', verified_status: payload.seller_status ?? 'pending' }
            : null,
          created_at: '',
        },
        isAuthenticated: true,
        isVerified: payload.is_verified,
        sellerStatus: payload.seller_status ?? null,
        sellerId: payload.seller_id ?? null,
      })
    } catch {
      clearTokens()
      set({ ...EMPTY_AUTH })
    }
  },

  async refreshSession() {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      set({ ...EMPTY_AUTH })
      return false
    }
    try {
      // Appel direct (sans l'intercepteur du client API) pour éviter toute récursion.
      const res = await fetch(`${API_BASE}/api/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) throw new Error('refresh failed')

      const data: AuthTokens = await res.json()
      setTokens(data.token, data.refresh_token)
      get().hydrate()
      return true
    } catch {
      clearTokens()
      set({ ...EMPTY_AUTH })
      return false
    }
  },

  setUser(user) {
    set({
      user,
      isAuthenticated: true,
      isVerified: user.is_verified,
      sellerStatus: user.seller?.verified_status ?? null,
      sellerId: user.seller?.id ?? null,
    })
  },

  logout() {
    clearTokens()
    set({ ...EMPTY_AUTH })
  },
}))
