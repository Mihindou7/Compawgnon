import { api } from './client'
import type { User } from '@/lib/types/api.types'

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
  phone?: string
}

export const usersApi = {
  updateProfile: (data: UpdateProfileData) =>
    api.patch<{ data: User }>('/api/me', data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.upload<{ data: User }>('/api/me/avatar', form, 'PATCH')
  },

  deleteAccount: (data?: { password?: string }) =>
    api.delete('/api/me', { data }),
}
