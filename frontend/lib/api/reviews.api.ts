import { api } from './client'
import type { PaginatedResponse } from '@/lib/types/pagination.types'

export type ReviewStatus = 'pending' | 'published' | 'hidden'

export interface Review {
  id: number
  rating: number
  comment: string | null
  status: ReviewStatus
  seller: { id: number; name: string }
  created_at: string
}

export interface CreateReviewData {
  seller_id: number
  rating: number
  comment?: string
}

export const reviewsApi = {
  list: (page = 1) =>
    api.get<PaginatedResponse<Review>>(`/api/me/reviews?page=${page}`),

  create: (data: CreateReviewData) =>
    api.post<{ data: { id: number; rating: number; status: string; message: string } }>(
      '/api/me/reviews',
      data,
    ),
}
