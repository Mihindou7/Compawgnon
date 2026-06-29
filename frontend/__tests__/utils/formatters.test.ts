import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  formatAge,
  formatAgeMonths,
  formatDate,
  formatDateShort,
  formatPhoneDisplay,
  formatPrice,
  truncate,
} from '@/lib/utils/formatters'

// Intl.NumberFormat (fr-FR) insere des espaces inSecables (U+00A0=160, U+202F=8239).
// Cette fonction les remplace par des espaces ordinaires pour des assertions lisibles.
function n(s: string): string {
  let r = ''
  for (const c of s) {
    const code = c.codePointAt(0) ?? 0
    r += code === 160 || code === 8239 ? ' ' : c
  }
  return r
}

// =============================================================================
// formatPrice
// =============================================================================

describe('formatPrice', () => {
  it('formate 0 en "0 €"', () => {
    expect(n(formatPrice(0))).toBe('0 €')
  })

  it('formate 500 en "500 €"', () => {
    expect(n(formatPrice(500))).toBe('500 €')
  })

  it('ajoute un separateur de milliers pour 1 500', () => {
    expect(n(formatPrice(1500))).toBe('1 500 €')
  })

  it('arrondit sans decimales (99.9 -> 100 €)', () => {
    expect(n(formatPrice(99.9))).toBe('100 €')
  })

  it('contient toujours le symbole €', () => {
    expect(formatPrice(250)).toContain('€')
  })
})

// =============================================================================
// formatAge — depend de new Date() : horloge figee au 15 juin 2025 (UTC)
// =============================================================================

describe('formatAge', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('retourne "Age inconnu" si null', () => {
    expect(formatAge(null)).toBe('Âge inconnu')
  })

  it('retourne "Age inconnu" si undefined', () => {
    expect(formatAge(undefined)).toBe('Âge inconnu')
  })

  it('retourne "Age inconnu" si chaine vide', () => {
    expect(formatAge('')).toBe('Âge inconnu')
  })

  it("retourne \"Moins d'un mois\" pour une naissance recente (< 1 mois)", () => {
    // 2025-06-10 : 5 jours -> 0 mois complet
    expect(formatAge('2025-06-10')).toBe("Moins d'un mois")
  })

  it('retourne "6 mois" pour une naissance il y a 6 mois', () => {
    expect(formatAge('2024-12-15')).toBe('6 mois')
  })

  it('retourne "1 an" pour une naissance il y a 12 mois', () => {
    expect(formatAge('2024-06-15')).toBe('1 an')
  })

  it('retourne "2 ans" pour une naissance il y a 24 mois', () => {
    expect(formatAge('2023-06-15')).toBe('2 ans')
  })

  it('retourne "5 ans" pour une naissance il y a 60 mois', () => {
    expect(formatAge('2020-06-15')).toBe('5 ans')
  })
})

// =============================================================================
// formatAgeMonths — pur, aucune dependance a la date courante
// =============================================================================

describe('formatAgeMonths', () => {
  it("retourne \"Moins d'un mois\" pour 0", () => {
    expect(formatAgeMonths(0)).toBe("Moins d'un mois")
  })

  it("retourne \"Moins d'un mois\" pour une valeur negative", () => {
    expect(formatAgeMonths(-3)).toBe("Moins d'un mois")
  })

  it('retourne "3 mois" pour 3', () => {
    expect(formatAgeMonths(3)).toBe('3 mois')
  })

  it('retourne "11 mois" pour 11', () => {
    expect(formatAgeMonths(11)).toBe('11 mois')
  })

  it('retourne "1 an" pour 12', () => {
    expect(formatAgeMonths(12)).toBe('1 an')
  })

  it('retourne "1 an" pour 23 (< 24 mois)', () => {
    expect(formatAgeMonths(23)).toBe('1 an')
  })

  it('retourne "2 ans" pour 24', () => {
    expect(formatAgeMonths(24)).toBe('2 ans')
  })

  it('retourne "3 ans" pour 36', () => {
    expect(formatAgeMonths(36)).toBe('3 ans')
  })
})

// =============================================================================
// formatDate  (format : "d MMMM yyyy", locale fr)
// =============================================================================

describe('formatDate', () => {
  it('retourne "—" si null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('retourne "—" si undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('formate le 15 janvier 2025', () => {
    expect(formatDate('2025-01-15')).toBe('15 janvier 2025')
  })

  it('formate le 1er juin 2025 (jour sans zero)', () => {
    expect(formatDate('2025-06-01')).toBe('1 juin 2025')
  })

  it('formate le 25 decembre 2024', () => {
    expect(formatDate('2024-12-25')).toBe('25 décembre 2024')
  })
})

// =============================================================================
// formatDateShort  (format : "dd/MM/yyyy")
// =============================================================================

describe('formatDateShort', () => {
  it('retourne "—" si null', () => {
    expect(formatDateShort(null)).toBe('—')
  })

  it('retourne "—" si undefined', () => {
    expect(formatDateShort(undefined)).toBe('—')
  })

  it('formate 2025-01-15 en "15/01/2025"', () => {
    expect(formatDateShort('2025-01-15')).toBe('15/01/2025')
  })

  it('formate 2024-12-25 en "25/12/2024"', () => {
    expect(formatDateShort('2024-12-25')).toBe('25/12/2024')
  })
})

// =============================================================================
// formatPhoneDisplay
// =============================================================================

describe('formatPhoneDisplay', () => {
  it('retourne "—" si null', () => {
    expect(formatPhoneDisplay(null)).toBe('—')
  })

  it('retourne "—" si undefined', () => {
    expect(formatPhoneDisplay(undefined)).toBe('—')
  })

  it('formate un numero brut 10 chiffres en "XX XX XX XX XX"', () => {
    expect(formatPhoneDisplay('0612345678')).toBe('06 12 34 56 78')
  })

  it('formate un numero avec tirets (extrait 10 chiffres)', () => {
    expect(formatPhoneDisplay('06-12-34-56-78')).toBe('06 12 34 56 78')
  })

  it('formate un numero avec points (extrait 10 chiffres)', () => {
    expect(formatPhoneDisplay('06.12.34.56.78')).toBe('06 12 34 56 78')
  })

  it('retourne le numero brut si moins de 10 chiffres', () => {
    expect(formatPhoneDisplay('061234')).toBe('061234')
  })

  it('retourne le numero brut si format international (> 10 chiffres)', () => {
    expect(formatPhoneDisplay('+33612345678')).toBe('+33612345678')
  })
})

// =============================================================================
// truncate
// =============================================================================

describe('truncate', () => {
  it('retourne la chaine intacte si longueur < max', () => {
    expect(truncate('hi', 10)).toBe('hi')
  })

  it('retourne la chaine intacte si longueur === max', () => {
    expect(truncate('Bonjour', 7)).toBe('Bonjour')
  })

  it('tronque et ajoute "..." si longueur > max', () => {
    expect(truncate('Bonjour monde', 7)).toBe('Bonjour…')
  })

  it('supprime les espaces de fin avant "..."', () => {
    // slice(0,8) = "Bonjour " -> trimEnd() = "Bonjour"
    expect(truncate('Bonjour monde', 8)).toBe('Bonjour…')
  })

  it('gere une chaine vide', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('tronque en milieu de mot', () => {
    expect(truncate('labrador', 4)).toBe('labr…')
  })
})