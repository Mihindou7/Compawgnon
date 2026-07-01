export type SellerVerifiedStatus = 'pending' | 'approved' | 'rejected'

export interface JwtPayload {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  roles: string[]
  status: 'active' | 'disabled'
  is_verified: boolean
  seller_id?: number
  seller_status?: SellerVerifiedStatus
  exp: number
  iat: number
}

export interface AuthTokens {
  token: string
  refresh_token: string
}
