import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/utils/cn'

describe('cn', () => {
  it('retourne une classe simple', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('fusionne plusieurs classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('résout les conflits Tailwind (garde la dernière)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('ignore les valeurs falsy', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar')
  })

  it('accepte des objets conditionnels', () => {
    expect(cn({ active: true, disabled: false })).toBe('active')
  })

  it('retourne une chaîne vide sans arguments', () => {
    expect(cn()).toBe('')
  })
})
