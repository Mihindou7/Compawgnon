import { describe, expect, it } from 'vitest'

import { profileSchema, sellerApplicationSchema } from '@/lib/schemas/profile.schema'

// Retourne les messages d'erreur Zod pour un champ donne.
function msgs(
  result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } },
  champ?: string,
): string[] {
  if (!result.error) return []
  const issues = result.error.issues
  if (!champ) return issues.map((i) => i.message)
  return issues.filter((i) => i.path.includes(champ)).map((i) => i.message)
}

// =============================================================================
// profileSchema
// =============================================================================

describe('profileSchema — données valides', () => {
  it('valide un objet vide (tous les champs sont optionnels)', () => {
    const result = profileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('valide avec first_name et last_name renseignés', () => {
    const result = profileSchema.safeParse({ first_name: 'Marie', last_name: 'Dupont' })
    expect(result.success).toBe(true)
  })

  it('valide avec un numéro de téléphone mobile correct (06)', () => {
    const result = profileSchema.safeParse({ phone: '0612345678' })
    expect(result.success).toBe(true)
  })

  it('valide avec un numéro au format international (+33)', () => {
    const result = profileSchema.safeParse({ phone: '+33612345678' })
    expect(result.success).toBe(true)
  })

  it('accepte phone vide (champ effacé)', () => {
    const result = profileSchema.safeParse({ phone: '' })
    expect(result.success).toBe(true)
  })

  it('accepte phone absent', () => {
    const result = profileSchema.safeParse({ first_name: 'Marie' })
    expect(result.success).toBe(true)
  })
})

describe('profileSchema — first_name / last_name', () => {
  it('rejette first_name trop long (> 100 caractères)', () => {
    const result = profileSchema.safeParse({ first_name: 'A'.repeat(101) })
    expect(result.success).toBe(false)
    expect(msgs(result, 'first_name')).toContain('Prénom trop long')
  })

  it('rejette last_name trop long (> 100 caractères)', () => {
    const result = profileSchema.safeParse({ last_name: 'A'.repeat(101) })
    expect(result.success).toBe(false)
    expect(msgs(result, 'last_name')).toContain('Nom trop long')
  })
})

describe('profileSchema — phone', () => {
  it('rejette un numéro de téléphone trop court', () => {
    const result = profileSchema.safeParse({ phone: '061234' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'phone')).toContain('Numéro de téléphone invalide')
  })

  it('rejette un numéro commençant par 0 suivi de 0 (invalide)', () => {
    const result = profileSchema.safeParse({ phone: '0012345678' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'phone')).toContain('Numéro de téléphone invalide')
  })

  it('rejette un numéro avec des lettres', () => {
    const result = profileSchema.safeParse({ phone: '06ABCDEFGH' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'phone')).toContain('Numéro de téléphone invalide')
  })
})

// =============================================================================
// sellerApplicationSchema
// =============================================================================

const validSeller = {
  name: 'Élevage du Val',
  type: 'breeder' as const,
  siret: '12345678901234',
  city: 'Lyon',
  postal_code: '69001',
}

describe('sellerApplicationSchema — données valides', () => {
  it('valide un dossier vendeur complet et correct', () => {
    const result = sellerApplicationSchema.safeParse(validSeller)
    expect(result.success).toBe(true)
  })

  it('accepte le type "pet_shop"', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, type: 'pet_shop' })
    expect(result.success).toBe(true)
  })

  it('valide avec les champs optionnels renseignés', () => {
    const result = sellerApplicationSchema.safeParse({
      ...validSeller,
      address: '12 rue des Fleurs',
      description: 'Élevage familial passionné depuis 10 ans.',
      latitude: 45.75,
      longitude: 4.85,
    })
    expect(result.success).toBe(true)
  })
})

describe('sellerApplicationSchema — name', () => {
  it('rejette un nom trop court (< 2 caractères)', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, name: 'A' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'name')).toContain('Nom requis')
  })
})

describe('sellerApplicationSchema — type', () => {
  it('rejette un type hors enum', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, type: 'particulier' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'type')).toContain('Type requis')
  })

  it('rejette si type est absent', () => {
    const { type: _, ...sans } = validSeller
    const result = sellerApplicationSchema.safeParse(sans)
    expect(result.success).toBe(false)
  })
})

describe('sellerApplicationSchema — siret', () => {
  it('rejette un SIRET de moins de 14 chiffres', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, siret: '1234567890123' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'siret')).toContain('SIRET doit contenir 14 chiffres')
  })

  it('rejette un SIRET de plus de 14 chiffres', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, siret: '123456789012345' })
    expect(result.success).toBe(false)
  })

  it('rejette un SIRET contenant des lettres', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, siret: '1234567890123A' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'siret')).toContain('SIRET invalide')
  })
})

describe('sellerApplicationSchema — postal_code', () => {
  it('rejette un code postal de moins de 5 chiffres', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, postal_code: '6900' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'postal_code')).toContain('Code postal invalide')
  })

  it('rejette un code postal avec des lettres', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, postal_code: '6900A' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'postal_code')).toContain('Code postal invalide')
  })
})

describe('sellerApplicationSchema — description', () => {
  it('rejette une description trop longue (> 1000 caractères)', () => {
    const result = sellerApplicationSchema.safeParse({ ...validSeller, description: 'A'.repeat(1001) })
    expect(result.success).toBe(false)
    expect(msgs(result, 'description')).toContain('Description trop longue')
  })

  it('accepte une description absente', () => {
    const result = sellerApplicationSchema.safeParse(validSeller)
    expect(result.success).toBe(true)
  })
})
