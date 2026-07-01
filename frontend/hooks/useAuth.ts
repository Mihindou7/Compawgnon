'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { authApi } from '@/lib/api/auth.api'
import { getRefreshToken } from '@/lib/utils/tokens'
import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const store = useAuthStore()
  const router = useRouter()

  const isAdmin  = store.user?.roles?.includes('ROLE_ADMIN') ?? false
  const isSeller = store.sellerStatus === 'approved'

  async function logout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => {})
    }
    store.logout()
    toast.success('Déconnexion réussie')
    router.push('/connexion')
  }

  return {
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    isVerified:      store.isVerified,
    sellerStatus:    store.sellerStatus,
    sellerId:        store.sellerId,
    isSeller,
    isAdmin,
    setUser:         store.setUser,
    logout,
  }
}
