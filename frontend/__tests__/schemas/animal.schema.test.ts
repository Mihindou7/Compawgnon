import { describe, expect, it } from 'vitest'

import { animalSchema } from '@/lib/schemas/animal.schema'

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

const DESCRIPTION_80 = 'Magnifique chien de race Golden Retriever, très affectueux et joueur, idéal pour une famille.'

const valid = {
  title: 'Golden Retriever à adopter',
  description: DESCRIPTION_80,
  species_id: 1,
  sex: 'male' as const,
  price: 800,
  city: 'Lyon',
  postal_code: '69001',
}

// =============================================================================
// animalSchema — champs obligatoires
// =============================================================================

describe('animalSchema — données valides', () => {
  it('valide un jeu de données complet et correct', () => {
    const result = animalSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('valide avec les champs optionnels renseignés', () => {
    const result = animalSchema.safeParse({
      ...valid,
      breed_id: 3,
      birthdate: '2023-06-15',
      latitude: 45.75,
      longitude: 4.85,
      region: 'Auvergne-Rhône-Alpes',
      department: 'Rhône',
      department_code: '69',
    })
    expect(result.success).toBe(true)
  })

  it('accepte le sexe "female"', () => {
    const result = animalSchema.safeParse({ ...valid, sex: 'female' })
    expect(result.success).toBe(true)
  })

  it('accepte le sexe "unknown"', () => {
    const result = animalSchema.safeParse({ ...valid, sex: 'unknown' })
    expect(result.success).toBe(true)
  })

  it('accepte un prix à 0', () => {
    const result = animalSchema.safeParse({ ...valid, price: 0 })
    expect(result.success).toBe(true)
  })
})

// =============================================================================
// title
// =============================================================================

describe('animalSchema — title', () => {
  it('rejette un titre trop court (< 3 caractères)', () => {
    const result = animalSchema.safeParse({ ...valid, title: 'AB' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'title')).toContain('Titre requis (min. 3 caractères)')
  })

  it('rejette un titre trop long (> 180 caractères)', () => {
    const result = animalSchema.safeParse({ ...valid, title: 'A'.repeat(181) })
    expect(result.success).toBe(false)
    expect(msgs(result, 'title')).toContain('Titre trop long (max. 180 caractères)')
  })

  it('accepte un titre de 3 caractères exactement', () => {
    const result = animalSchema.safeParse({ ...valid, title: 'Rex' })
    expect(result.success).toBe(true)
  })
})

// =============================================================================
// description
// =============================================================================

describe('animalSchema — description', () => {
  it('rejette une description trop courte (< 80 caractères)', () => {
    const result = animalSchema.safeParse({ ...valid, description: 'Trop courte.' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'description')).toContain('La description doit faire au moins 80 caractères')
  })

  it('rejette une description trop longue (> 2000 caractères)', () => {
    const result = animalSchema.safeParse({ ...valid, description: 'A'.repeat(2001) })
    expect(result.success).toBe(false)
    expect(msgs(result, 'description')).toContain('Description trop longue')
  })
})

// =============================================================================
// species_id
// =============================================================================

describe('animalSchema — species_id', () => {
  it('rejette si species_id est absent', () => {
    const { species_id: _, ...sans } = valid
    const result = animalSchema.safeParse(sans)
    expect(result.success).toBe(false)
    expect(msgs(result, 'species_id')).toContain('Espèce requise')
  })

  it('rejette si species_id vaut 0 (non positif)', () => {
    const result = animalSchema.safeParse({ ...valid, species_id: 0 })
    expect(result.success).toBe(false)
    expect(msgs(result, 'species_id')).toContain('Espèce requise')
  })

  it('rejette si species_id est négatif', () => {
    const result = animalSchema.safeParse({ ...valid, species_id: -1 })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// sex
// =============================================================================

describe('animalSchema — sex', () => {
  it('rejette une valeur hors enum', () => {
    const result = animalSchema.safeParse({ ...valid, sex: 'autre' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'sex')).toContain('Sexe requis')
  })

  it('rejette si sex est absent', () => {
    const { sex: _, ...sans } = valid
    const result = animalSchema.safeParse(sans)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// price
// =============================================================================

describe('animalSchema — price', () => {
  it('rejette un prix négatif', () => {
    const result = animalSchema.safeParse({ ...valid, price: -1 })
    expect(result.success).toBe(false)
    expect(msgs(result, 'price')).toContain('Le prix ne peut pas être négatif')
  })

  it('rejette un prix supérieur à 100 000', () => {
    const result = animalSchema.safeParse({ ...valid, price: 100001 })
    expect(result.success).toBe(false)
    expect(msgs(result, 'price')).toContain('Prix trop élevé')
  })

  it('accepte exactement 100 000', () => {
    const result = animalSchema.safeParse({ ...valid, price: 100000 })
    expect(result.success).toBe(true)
  })

  it('rejette si price est absent', () => {
    const { price: _, ...sans } = valid
    const result = animalSchema.safeParse(sans)
    expect(result.success).toBe(false)
    expect(msgs(result, 'price')).toContain('Prix requis')
  })
})

// =============================================================================
// city
// =============================================================================

describe('animalSchema — city', () => {
  it('rejette une ville trop courte (< 2 caractères)', () => {
    const result = animalSchema.safeParse({ ...valid, city: 'A' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'city')).toContain('Ville requise')
  })

  it('accepte une ville de 2 caractères', () => {
    const result = animalSchema.safeParse({ ...valid, city: 'Ay' })
    expect(result.success).toBe(true)
  })
})

// =============================================================================
// postal_code
// =============================================================================

describe('animalSchema — postal_code', () => {
  it('rejette un code postal sans 5 chiffres', () => {
    const result = animalSchema.safeParse({ ...valid, postal_code: '6900' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'postal_code')).toContain('Sélectionnez une ville dans la liste pour obtenir le code postal')
  })

  it('rejette un code postal avec des lettres', () => {
    const result = animalSchema.safeParse({ ...valid, postal_code: '6900A' })
    expect(result.success).toBe(false)
  })

  it('accepte exactement 5 chiffres', () => {
    const result = animalSchema.safeParse({ ...valid, postal_code: '75001' })
    expect(result.success).toBe(true)
  })
})
