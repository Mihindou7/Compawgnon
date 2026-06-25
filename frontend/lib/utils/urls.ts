const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost'

/**
 * Resolves a backend-relative upload path to a full URL.
 * - Returns null if path is null/empty
 * - Returns the path as-is if it's already an absolute URL (OAuth avatars, etc.)
 * - Prepends the API base URL for relative paths like /uploads/avatars/...
 */
export function resolveUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_URL}${path}`
}
