'use client'

import * as Popover from '@radix-ui/react-popover'
import { fr } from 'date-fns/locale'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils/cn'

export interface DatePickerProps {
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  value?: string        // YYYY-MM-DD
  onChange?: (value: string | undefined) => void
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  className?: string
  id?: string
}

function parseIso(iso: string | undefined): Date | undefined {
  if (!iso) return undefined
  const d = new Date(iso + 'T12:00:00')
  return isNaN(d.getTime()) ? undefined : d
}

function formatIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function formatDisplay(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function DatePicker({
  label,
  placeholder = 'Choisir une date',
  error,
  hint,
  value,
  onChange,
  disabled,
  minDate,
  maxDate,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const selected = parseIso(value)

  function handleSelect(date: Date | undefined) {
    onChange?.(date ? formatIso(date) : undefined)
    if (date) setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange?.(undefined)
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-ink">
          {label}
        </label>
      )}

      <Popover.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
        <Popover.Trigger asChild>
          <button
            id={inputId}
            type="button"
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border border-border bg-surface-white px-3 py-2.5 text-sm transition-all duration-200',
              'focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              open && 'border-brand-green ring-2 ring-brand-green/20',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
              !selected ? 'text-text-subtle' : 'text-text-ink',
            )}
          >
            <span className="flex items-center gap-2.5">
              <CalendarDays className={cn('h-4 w-4 shrink-0', selected ? 'text-brand-green' : 'text-text-subtle')} />
              {selected ? formatDisplay(selected) : placeholder}
            </span>
            {selected ? (
              <span
                role="button"
                aria-label="Effacer"
                onClick={handleClear}
                className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-surface-cream"
              >
                <X className="h-3 w-3 text-text-subtle" />
              </span>
            ) : (
              <ChevronDown className={cn('h-4 w-4 text-text-subtle transition-transform duration-200', open && 'rotate-180')} />
            )}
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            className="z-[100] w-[300px] rounded-2xl border border-border bg-surface-white p-5 shadow-[0_8px_32px_0_rgb(0_0_0/0.12)] animate-scale-in"
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              locale={fr}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              captionLayout="dropdown"
              startMonth={new Date(1990, 0)}
              endMonth={new Date()}
              showOutsideDays
              classNames={{
                root:          'select-none w-full',
                months:        'w-full',
                month:         'w-full space-y-4',

                // ── Header: arrows + dropdowns in one flex row ──────────────
                month_caption: 'flex items-center justify-between gap-2 pb-2',
                nav:           'contents',   // dissolve nav wrapper — buttons become direct flex children
                button_previous: cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border',
                  'text-text-subtle transition-all hover:border-brand-green/40 hover:bg-brand-green-lt hover:text-brand-green',
                  'focus:outline-none focus:ring-2 focus:ring-brand-green/30',
                  'order-first',
                ),
                button_next: cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border',
                  'text-text-subtle transition-all hover:border-brand-green/40 hover:bg-brand-green-lt hover:text-brand-green',
                  'focus:outline-none focus:ring-2 focus:ring-brand-green/30',
                  'order-last',
                ),
                dropdowns:     'flex flex-1 items-center justify-center gap-1',
                dropdown_root: 'relative',
                dropdown:      cn(
                  'appearance-none rounded-lg bg-surface-cream px-2.5 py-1 text-sm font-semibold text-text-ink',
                  'cursor-pointer transition-colors hover:bg-brand-green-lt hover:text-brand-green',
                  'focus:outline-none focus:ring-2 focus:ring-brand-green/30',
                ),

                // ── Weekday header ──────────────────────────────────────────
                weekdays:      'mb-1 flex w-full',
                weekday:       'flex-1 text-center text-[11px] font-semibold uppercase tracking-wide text-text-subtle',

                // ── Days grid ───────────────────────────────────────────────
                weeks:         'w-full space-y-0.5',
                week:          'flex w-full',
                day:           'flex-1 p-0',
                day_button:    cn(
                  'mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm text-text-body transition-all duration-150',
                  'hover:bg-brand-green-lt hover:text-brand-green',
                  'focus:outline-none focus:ring-2 focus:ring-brand-green/30',
                  'disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-text-body',
                ),

                // ── States ──────────────────────────────────────────────────
                selected:  '[&>button]:bg-brand-green [&>button]:text-white [&>button]:font-semibold [&>button]:shadow-sm [&>button]:hover:bg-brand-green-dk',
                today:     '[&>button]:font-bold [&>button]:text-brand-green [&>button]:ring-2 [&>button]:ring-brand-green/30',
                outside:   '[&>button]:text-text-subtle [&>button]:opacity-30',
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === 'left'
                    ? <ChevronLeft  className="h-3.5 w-3.5" />
                    : <ChevronRight className="h-3.5 w-3.5" />,
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

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
