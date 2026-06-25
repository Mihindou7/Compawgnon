import { api } from './client'
import type { AdminDashboard, Animal, AuditLog, ContactMessage, ContactStats, ContactStatus, Review, Seller, User } from '@/lib/types/api.types'
import type { PaginatedResponse } from '@/lib/types/pagination.types'

type ContactListResponse = PaginatedResponse<ContactMessage> & { stats: ContactStats }

export const adminApi = {
  dashboard: () =>
    api.get<{ data: AdminDashboard }>('/api/admin/dashboard'),

  /* Users */
  listUsers: (params?: { page?: number; search?: string; status?: string }) => {
    const qs = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return api.get<PaginatedResponse<User>>(`/api/admin/users${qs ? `?${qs}` : ''}`)
  },

  updateUser: (id: number, data: { status?: string }) =>
    api.patch<{ data: User }>(`/api/admin/users/${id}/toggle-status`, data),

  /* Sellers */
  listSellers: (params?: { page?: number; status?: string }) => {
    const qs = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return api.get<PaginatedResponse<Seller>>(`/api/admin/sellers${qs ? `?${qs}` : ''}`)
  },

  approveSeller: (id: number) =>
    api.patch<{ data: Seller }>(`/api/admin/sellers/${id}/approve`, {}),

  rejectSeller: (id: number, reason?: string) =>
    api.patch<{ data: Seller }>(`/api/admin/sellers/${id}/reject`, { rejectionReason: reason }),

  /* Animals */
  listAnimals: (params?: { page?: number; status?: string }) => {
    const qs = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return api.get<PaginatedResponse<Animal>>(`/api/admin/animals${qs ? `?${qs}` : ''}`)
  },

  approveAnimal: (id: number) =>
    api.patch<{ data: Animal }>(`/api/admin/animals/${id}/publish`, {}),

  rejectAnimal: (id: number, reason?: string) =>
    api.patch<{ data: Animal }>(`/api/admin/animals/${id}/reject`, { rejectionReason: reason }),

  archiveAnimal: (id: number) =>
    api.post<{ data: Animal }>(`/api/admin/animals/${id}/archive`, {}),

  /* Reviews */
  listReviews: (params?: { page?: number; status?: string }) => {
    const qs = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return api.get<PaginatedResponse<Review>>(`/api/admin/reviews${qs ? `?${qs}` : ''}`)
  },

  toggleReviewVisibility: (id: number) =>
    api.patch<{ data: Review }>(`/api/admin/reviews/${id}/toggle-visibility`, {}),

  publishReview: (id: number) =>
    api.patch<{ data: Review }>(`/api/admin/reviews/${id}/toggle-visibility`, {}),

  hideReview: (id: number) =>
    api.patch<{ data: Review }>(`/api/admin/reviews/${id}/toggle-visibility`, {}),

  /* Contacts */
  listContacts: (params?: { page?: number; status?: string; search?: string }) => {
    const qs = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return api.get<ContactListResponse>(`/api/admin/contacts${qs ? `?${qs}` : ''}`)
  },

  getContact: (id: number) =>
    api.get<{ data: ContactMessage }>(`/api/admin/contacts/${id}`),

  updateContactStatus: (id: number, status: ContactStatus) =>
    api.patch<{ data: ContactMessage }>(`/api/admin/contacts/${id}/status`, { status }),

  replyContact: (id: number, message: string) =>
    api.post<{ data: ContactMessage }>(`/api/admin/contacts/${id}/reply`, { message }),

  deleteContact: (id: number) =>
    api.delete<null>(`/api/admin/contacts/${id}`),

  /* Audit logs */
  listAuditLogs: (params?: { page?: number }) => {
    const qs = params?.page ? `?page=${params.page}` : ''
    return api.get<PaginatedResponse<AuditLog>>(`/api/admin/audit-logs${qs}`)
  },
}
