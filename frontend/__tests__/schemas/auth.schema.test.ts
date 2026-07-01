import { describe, expect, it } from 'vitest'

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/schemas/auth.schema'

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
// loginSchema
// =============================================================================

describe('loginSchema', () => {
  it('valide un email et un mot de passe corrects', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '123' })
    expect(result.success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = loginSchema.safeParse({ email: 'pas-un-email', password: '123' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'email')).toContain('Email invalide')
  })

  it('rejette un email vide', () => {
    const result = loginSchema.safeParse({ email: '', password: '123' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'email')).toContain('Email requis')
  })

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'password')).toContain('Mot de passe requis')
  })

  it('rejette si les deux champs sont absents', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// registerSchema
// =============================================================================

describe('registerSchema', () => {
  const valid = {
    email: 'user@test.com',
    password: 'Password1',
    termsAccepted: true as const,
  }

  it('valide des donnees completes et correctes', () => {
    const result = registerSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('valide avec les champs optionnels firstName et lastName', () => {
    const result = registerSchema.safeParse({
      ...valid,
      firstName: 'Jean',
      lastName: 'Dupont',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'pas-un-email' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'email')).toContain('Email invalide')
  })

  it('rejette un mot de passe trop court (< 8 caracteres)', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Pass1' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'password')).toContain('Minimum 8 caractères')
  })

  it('rejette un mot de passe sans majuscule', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'password1' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'password')).toContain('Au moins une majuscule')
  })

  it('rejette un mot de passe sans chiffre', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'PasswordABC' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'password')).toContain('Au moins un chiffre')
  })

  it('rejette si termsAccepted vaut false', () => {
    const result = registerSchema.safeParse({ ...valid, termsAccepted: false })
    expect(result.success).toBe(false)
    expect(msgs(result, 'termsAccepted')).toContain('Vous devez accepter les CGU')
  })

  it('rejette si termsAccepted est absent', () => {
    const { termsAccepted: _, ...sans } = valid
    const result = registerSchema.safeParse(sans)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// forgotPasswordSchema
// =============================================================================

describe('forgotPasswordSchema', () => {
  it('valide un email correct', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@test.com' })
    expect(result.success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'pas-un-email' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'email')).toContain('Email invalide')
  })

  it('rejette un email vide', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
    expect(msgs(result, 'email')).toContain('Email requis')
  })
})

// =============================================================================
// resetPasswordSchema
// =============================================================================

describe('resetPasswordSchema', () => {
  it('valide si les deux mots de passe correspondent et respectent les regles', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPassword1',
      passwordConfirm: 'NewPassword1',
    })
    expect(result.success).toBe(true)
  })

  it('rejette si les deux mots de passe sont differents', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Password1',
      passwordConfirm: 'Autre1234',
    })
    expect(result.success).toBe(false)
    expect(msgs(result, 'passwordConfirm')).toContain('Les mots de passe ne correspondent pas')
  })

  it('rejette si password est trop court', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Pass1',
      passwordConfirm: 'Pass1',
    })
    expect(result.success).toBe(false)
    expect(msgs(result, 'password')).toContain('Minimum 8 caractères')
  })

  it('rejette si password n\'a pas de majuscule', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'password1',
      passwordConfirm: 'password1',
    })
    expect(result.success).toBe(false)
    expect(msgs(result, 'password')).toContain('Au moins une majuscule')
  })

  it('rejette si password n\'a pas de chiffre', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'PasswordABC',
      passwordConfirm: 'PasswordABC',
    })
    expect(result.success).toBe(false)
    expect(msgs(result, 'password')).toContain('Au moins un chiffre')
  })

  it('rejette si la confirmation est vide', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Password1',
      passwordConfirm: '',
    })
    expect(result.success).toBe(false)
    expect(msgs(result, 'passwordConfirm')).toContain('Confirmation requise')
  })
})
