import { describe, expect, it } from 'vitest'

import { CONTACT_SUBJECTS, contactSchema } from '@/lib/schemas/contact.schema'

// Retourne les messages d'erreur Zod pour un champ donne.
function msgs(
  result: { success: boolean; error?: { issues: Array<{ path: (string | number)[]; message: string }> } },
  champ?: string,
): string[] {
  if (!result.error) return []
  const issues = result.error.issues
  if (!champ) return issues.map((i) => i.message)
  return issues.filter((i) => i.path.includes(champ)).map((i) => i.message)
}

const valid = {
  name: 'Marie Dupont',
  email: 'marie@test.com',
  subject: 'general' as const,
  message: 'Bonjour, j\'ai une question à propos de votre plateforme.',
}

// =============================================================================
// contactSchema — données valides
// =============================================================================

describe('contactSchema — données valides', () => {
  it('valide un jeu de données complet et correct', () => {
    const result = contactSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepte tous les sujets de CONTACT_SUBJECTS', () => {
    for (const { value } of CONTACT_SUBJECTS) {
      const result = contactSchema.safeParse({ ...valid, subject: value })
      expect(result.success, `subject "${value}" doit être valide`).toBe(true)
    }
  })
})

// =============================================================================
// name
// =============================================================================

describe('contactSchema — name', () => {
  it('rejette un nom trop court (< 2 caractères)', () => {
    const result = contactSchema.safeParse({ ...valid, name: 'A' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'name')).toContain('Veuillez indiquer votre nom')
  })

  it('rejette un nom trop long (> 80 caractères)', () => {
    const result = contactSchema.safeParse({ ...valid, name: 'A'.repeat(81) })
    expect(result.success).toBe(false)
    expect(msgs(result, 'name')).toContain('Nom trop long')
  })

  it('accepte un nom de 2 caractères exactement', () => {
    const result = contactSchema.safeParse({ ...valid, name: 'Al' })
    expect(result.success).toBe(true)
  })

  it('rejette un nom absent', () => {
    const { name: _, ...sans } = valid
    const result = contactSchema.safeParse(sans)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// email
// =============================================================================

describe('contactSchema — email', () => {
  it('rejette un email invalide', () => {
    const result = contactSchema.safeParse({ ...valid, email: 'pas-un-email' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'email')).toContain('Email invalide')
  })

  it('rejette un email vide', () => {
    const result = contactSchema.safeParse({ ...valid, email: '' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'email')).toContain('Email requis')
  })

  it('rejette un email sans domaine', () => {
    const result = contactSchema.safeParse({ ...valid, email: 'marie@' })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// subject
// =============================================================================

describe('contactSchema — subject', () => {
  it('rejette un sujet hors de la liste autorisée', () => {
    const result = contactSchema.safeParse({ ...valid, subject: 'inconnu' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'subject')).toContain('Veuillez choisir un sujet')
  })

  it('rejette si subject est absent', () => {
    const { subject: _, ...sans } = valid
    const result = contactSchema.safeParse(sans)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// message
// =============================================================================

describe('contactSchema — message', () => {
  it('rejette un message trop court (< 20 caractères)', () => {
    const result = contactSchema.safeParse({ ...valid, message: 'Bonjour.' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'message')).toContain('Votre message doit faire au moins 20 caractères')
  })

  it('rejette un message trop long (> 2000 caractères)', () => {
    const result = contactSchema.safeParse({ ...valid, message: 'A'.repeat(2001) })
    expect(result.success).toBe(false)
    expect(msgs(result, 'message')).toContain('Message trop long')
  })

  it('accepte un message de exactement 20 caractères', () => {
    const result = contactSchema.safeParse({ ...valid, message: 'A'.repeat(20) })
    expect(result.success).toBe(true)
  })

  it('rejette un message absent', () => {
    const { message: _, ...sans } = valid
    const result = contactSchema.safeParse(sans)
    expect(result.success).toBe(false)
  })
})
