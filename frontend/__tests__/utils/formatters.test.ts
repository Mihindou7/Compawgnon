import { describe, expect, it } from 'vitest'

import { formatAgeMonths, formatPhoneDisplay, formatPrice, truncate } from '@/lib/utils/formatters'

describe('formatPrice', () => {
  it('formate un prix en euros français', () => {
    const result = formatPrice(1500)
    expect(result).toMatch(/1.500/)
    expect(result).toContain('€')
  })

  it('formate zéro', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('formate un grand nombre', () => {
    const result = formatPrice(25000)
    expect(result).toContain('25')
    expect(result).toContain('€')
  })
})

describe('formatPhoneDisplay', () => {
  it('formate un numéro à 10 chiffres', () => {
    expect(formatPhoneDisplay('0612345678')).toBe('06 12 34 56 78')
  })

  it('retourne — si null', () => {
    expect(formatPhoneDisplay(null)).toBe('—')
  })

  it('retourne — si undefined', () => {
    expect(formatPhoneDisplay(undefined)).toBe('—')
  })

  it('retourne le numéro brut si moins de 10 chiffres', () => {
    expect(formatPhoneDisplay('061234')).toBe('061234')
  })

  it('retourne le numéro brut si plus de 10 chiffres', () => {
    expect(formatPhoneDisplay('+33612345678')).toBe('+33612345678')
  })
})

describe('truncate', () => {
  it('ne tronque pas si la chaîne est assez courte', () => {
    expect(truncate('Bonjour', 10)).toBe('Bonjour')
  })

  it('ne tronque pas si la chaîne est exactement à la limite', () => {
    expect(truncate('Bonjour', 7)).toBe('Bonjour')
  })

  it('tronque et ajoute … si trop long', () => {
    expect(truncate('Bonjour monde', 7)).toBe('Bonjour…')
  })

  it('supprime les espaces de fin avant le …', () => {
    expect(truncate('Bonjour monde', 8)).toBe('Bonjour…')
  })
})

describe('formatAgeMonths', () => {
  it('affiche "Moins d\'un mois" pour 0', () => {
    expect(formatAgeMonths(0)).toBe("Moins d'un mois")
  })

  it('affiche les mois', () => {
    expect(formatAgeMonths(3)).toBe('3 mois')
    expect(formatAgeMonths(11)).toBe('11 mois')
  })

  it('affiche "1 an" pour 12 mois', () => {
    expect(formatAgeMonths(12)).toBe('1 an')
  })

  it('affiche les années', () => {
    expect(formatAgeMonths(24)).toBe('2 ans')
    expect(formatAgeMonths(36)).toBe('3 ans')
  })
})
