'use client'

import { MapPin, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

export interface CityOption {
  label: string
  city: string
  postalCode: string
  department: string
  departmentCode: string
  region: string
  lat: number
  lng: number
}

export interface CityAutocompleteProps {
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  value?: string
  onChange?: (option: CityOption | undefined) => void
  disabled?: boolean
  className?: string
  id?: string
}

async function searchCities(q: string): Promise<CityOption[]> {
  if (q.length < 2) return []
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&type=municipality&limit=8`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.features ?? []).map((f: { properties: { label: string; city: string; postcode: string; context: string }; geometry: { coordinates: [number, number] } }) => {
      const ctx = (f.properties.context ?? '').split(', ')
      return {
        label:          f.properties.label,
        city:           f.properties.city ?? f.properties.label,
        postalCode:     f.properties.postcode ?? '',
        department:     ctx[1] ?? '',
        departmentCode: ctx[0] ?? '',
        region:         ctx[2] ?? '',
        lat:            f.geometry.coordinates[1],
        lng:            f.geometry.coordinates[0],
      }
    })
  } catch {
    return []
  }
}

export function CityAutocomplete({
  label,
  placeholder = 'Rechercher une ville…',
  error,
  hint,
  value,
  onChange,
  disabled,
  className,
  id,
}: CityAutocompleteProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const [query, setQuery] = React.useState(value ?? '')
  const [results, setResults] = React.useState<CityOption[]>([])
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState(!!value)
  const [prevValue, setPrevValue] = React.useState<string | undefined>(value)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  if (prevValue !== value) {
    setPrevValue(value)
    if (value !== undefined && value !== query) {
      setQuery(value)
      setSelected(!!value)
    }
  }

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleInput(q: string) {
    setQuery(q)
    setSelected(false)
    onChange?.(undefined)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const r = await searchCities(q)
      setResults(r)
      setLoading(false)
    }, 300)
  }

  function handleSelect(option: CityOption) {
    setQuery(option.label)
    setSelected(true)
    setOpen(false)
    setResults([])
    onChange?.(option)
  }

  function handleClear() {
    setQuery('')
    setSelected(false)
    setResults([])
    onChange?.(undefined)
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-ink">
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin className={cn(
          'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
          selected ? 'text-brand-green' : 'text-text-subtle',
        )} />
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={placeholder}
          aria-invalid={!!error}
          className={cn(
            'flex w-full rounded-xl border border-border bg-surface-white py-2.5 pl-9 pr-8 text-sm text-text-ink transition-all duration-200',
            'placeholder:text-text-subtle',
            'focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-text-subtle transition-colors hover:bg-surface-cream hover:text-text-ink"
            aria-label="Effacer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (loading || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface-white shadow-[0_8px_24px_0_rgb(0_0_0/0.10)]">
          {loading && (
            <div className="px-3 py-2.5 text-sm text-text-subtle">Recherche…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2.5 text-sm text-text-subtle">Aucune ville trouvée</div>
          )}
          {!loading && results.map((option) => (
            <button
              key={`${option.city}-${option.postalCode}`}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(option) }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-cream"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-green" />
              <span>
                <span className="font-medium text-text-ink">{option.city}</span>
                <span className="ml-1.5 text-text-subtle">{option.postalCode}</span>
                {option.department && (
                  <span className="ml-1.5 text-xs text-text-subtle">{option.department}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">!</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-text-subtle">{hint}</p>
      )}
    </div>
  )
}
