import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/utils/tokens'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

async function tryRefreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve)
    })
  }

  isRefreshing = true
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    isRefreshing = false
    refreshQueue.forEach((cb) => cb(null))
    refreshQueue = []
    return null
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) throw new Error('Refresh failed')

    const data: { token: string; refresh_token: string } = await res.json()
    setTokens(data.token, data.refresh_token)

    isRefreshing = false
    refreshQueue.forEach((cb) => cb(data.token))
    refreshQueue = []
    return data.token
  } catch {
    isRefreshing = false
    refreshQueue.forEach((cb) => cb(null))
    refreshQueue = []
    return null
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken()

  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })

  if (res.status === 401 && retry) {
    const newToken = await tryRefreshToken()
    if (!newToken) {
      clearTokens()
      if (typeof window !== 'undefined') {
        window.location.href = '/connexion?error=session_expired'
      }
      throw new ApiError(401, 'Session expirée')
    }
    return request<T>(endpoint, options, false)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? body.message ?? body.detail ?? 'Erreur serveur')
  }

  if (res.status === 204) return null as T
  return res.json()
}

export const api = {
  get:    <T>(url: string, options?: RequestInit) => request<T>(url, options),
  post:   <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: { data?: unknown }) =>
    request<T>(url, { method: 'DELETE', ...(options?.data ? { body: JSON.stringify(options.data) } : {}) }),
  upload: <T>(url: string, formData: FormData, method: 'POST' | 'PATCH' = 'POST') =>
    request<T>(url, { method, body: formData }),
}
