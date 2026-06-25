import { api } from './client'
import type { Seller } from '@/lib/types/api.types'
import type { SellerApplicationData } from '@/lib/schemas/profile.schema'

export const sellerApplyApi = {
  apply: (data: SellerApplicationData) =>
    api.post<{ data: Seller }>('/api/me/seller/apply', data),

  getMyStore: () =>
    api.get<{ data: Seller }>('/api/me/seller'),
}
