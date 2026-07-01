import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebounce } from '@/hooks/useDebounce'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

// =============================================================================
// Valeur initiale
// =============================================================================

describe('useDebounce — valeur initiale', () => {
  it('retourne la valeur initiale immédiatement sans attendre le délai', () => {
    const { result } = renderHook(() => useDebounce('hello', 400))
    expect(result.current).toBe('hello')
  })

  it('fonctionne avec une valeur numérique', () => {
    const { result } = renderHook(() => useDebounce(42, 400))
    expect(result.current).toBe(42)
  })

  it('fonctionne avec un objet', () => {
    const obj = { q: 'chien' }
    const { result } = renderHook(() => useDebounce(obj, 400))
    expect(result.current).toBe(obj)
  })
})

// =============================================================================
// Délai par défaut (400 ms)
// =============================================================================

describe('useDebounce — délai (400 ms par défaut)', () => {
  it('ne met pas à jour avant la fin du délai', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'updated' })
    act(() => { vi.advanceTimersByTime(399) })

    expect(result.current).toBe('initial')
  })

  it('met à jour exactement après le délai écoulé', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'updated' })
    act(() => { vi.advanceTimersByTime(400) })

    expect(result.current).toBe('updated')
  })
})

// =============================================================================
// Réinitialisation du timer (trailing debounce)
// =============================================================================

describe('useDebounce — réinitialisation du timer', () => {
  it('reporte la mise à jour si la valeur change avant la fin du délai', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(200) })  // 200 ms écoulés depuis 'b'

    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(200) })  // 200 ms depuis 'c', timer relancé

    // Le timer 'c' n'a que 200 ms → valeur encore 'a'
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(200) })  // 400 ms depuis 'c'
    expect(result.current).toBe('c')
  })

  it('n\'émet pas les valeurs intermédiaires, seulement la dernière', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(100) })
    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(100) })
    rerender({ value: 'd' })
    act(() => { vi.advanceTimersByTime(400) })

    expect(result.current).toBe('d')
  })
})

// =============================================================================
// Délai personnalisé
// =============================================================================

describe('useDebounce — délai personnalisé', () => {
  it('respecte un délai de 1000 ms', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 1000),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'updated' })
    act(() => { vi.advanceTimersByTime(999) })
    expect(result.current).toBe('initial')

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('updated')
  })

  it('utilise 400 ms si aucun délai n\'est fourni', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'updated' })
    act(() => { vi.advanceTimersByTime(400) })
    expect(result.current).toBe('updated')
  })
})
