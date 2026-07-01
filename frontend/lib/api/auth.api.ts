import { api } from './client'
import type { User } from '@/lib/types/api.types'
import type { AuthTokens } from '@/lib/types/auth.types'
import type { LoginData, RegisterData, ResetPasswordData } from '@/lib/schemas/auth.schema'

export const authApi = {
  register: (data: Omit<RegisterData, 'termsAccepted'> & { termsAccepted: boolean }) =>
    api.post<{ data: { message: string } }>('/api/auth/register', {
      email:         data.email,
      password:      data.password,
      firstName:     data.firstName,
      lastName:      data.lastName,
      termsAccepted: data.termsAccepted,
    }),

  login: (data: LoginData) =>
    api.post<AuthTokens>('/api/auth/login', data),

  logout: (refreshToken: string) =>
    api.post<void>('/api/auth/logout', { refresh_token: refreshToken }),

  refreshToken: (refreshToken: string) =>
    api.post<AuthTokens>('/api/auth/token/refresh', { refresh_token: refreshToken }),

  verifyEmail: (token: string) =>
    api.get<{ data: { access_token: string; refresh_token: string; expires_in: number; message: string } }>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
    ),

  resendVerification: () =>
    api.post<{ data: { message: string; already_verified: boolean } }>('/api/auth/resend-verification', {}),

  forgotPassword: (email: string) =>
    api.post<{ data: { message: string } }>('/api/auth/forgot-password', { email }),

  resetPassword: (data: ResetPasswordData & { token: string }) =>
    api.post<{ data: { message: string } }>('/api/auth/reset-password', {
      token:           data.token,
      password:        data.password,
      passwordConfirm: data.passwordConfirm,
    }),

  googleAuth: (accessToken: string) =>
    api.post<{ data: { access_token: string; refresh_token: string; expires_in: number } }>(
      '/api/auth/google',
      { access_token: accessToken },
    ),

  getMe: () =>
    api.get<{ data: User }>('/api/me'),
}
