import { describe, expect, it } from 'vitest'

import { resolveUploadUrl } from '@/lib/utils/urls'

// NEXT_PUBLIC_API_URL n'est pas défini en test → la fonction utilise 'http://localhost'.
const BASE = 'http://localhost'

// =============================================================================
// resolveUploadUrl — entrées nulles / vides
// =============================================================================

describe('resolveUploadUrl — entrées nulles ou vides', () => {
  it('retourne null pour null', () => {
    expect(resolveUploadUrl(null)).toBeNull()
  })

  it('retourne null pour undefined', () => {
    expect(resolveUploadUrl(undefined)).toBeNull()
  })

  it('retourne null pour une chaîne vide', () => {
    expect(resolveUploadUrl('')).toBeNull()
  })
})

// =============================================================================
// resolveUploadUrl — URLs absolues (inchangées)
// =============================================================================

describe('resolveUploadUrl — URL déjà absolue', () => {
  it('retourne une URL https telle quelle', () => {
    const url = 'https://cdn.example.com/avatars/user-1.jpg'
    expect(resolveUploadUrl(url)).toBe(url)
  })

  it('retourne une URL http telle quelle', () => {
    const url = 'http://storage.other.com/photo.png'
    expect(resolveUploadUrl(url)).toBe(url)
  })

  it('retourne une URL Google (avatar OAuth) telle quelle', () => {
    const url = 'https://lh3.googleusercontent.com/a/user-avatar'
    expect(resolveUploadUrl(url)).toBe(url)
  })
})

// =============================================================================
// resolveUploadUrl — chemins relatifs (préfixés par API_URL)
// =============================================================================

describe('resolveUploadUrl — chemin relatif', () => {
  it('préfixe un chemin d\'avatar avec l\'URL de base', () => {
    expect(resolveUploadUrl('/uploads/avatars/user-42.jpg'))
      .toBe(`${BASE}/uploads/avatars/user-42.jpg`)
  })

  it('préfixe un chemin de photo d\'animal avec l\'URL de base', () => {
    expect(resolveUploadUrl('/uploads/animals/labrador.png'))
      .toBe(`${BASE}/uploads/animals/labrador.png`)
  })

  it('préfixe un chemin de logo vendeur avec l\'URL de base', () => {
    expect(resolveUploadUrl('/uploads/sellers/logo.webp'))
      .toBe(`${BASE}/uploads/sellers/logo.webp`)
  })

  it('préfixe n\'importe quel chemin relatif commençant par /', () => {
    expect(resolveUploadUrl('/fichier.jpg')).toBe(`${BASE}/fichier.jpg`)
  })

  it('ne double pas le slash entre la base et le chemin', () => {
    const result = resolveUploadUrl('/uploads/test.jpg')
    // Retire le protocole avant de vérifier l'absence de double slash
    expect(result?.replace(/^https?:\/\//, '')).not.toContain('//')
  })
})
