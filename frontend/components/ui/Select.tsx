'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
}

export function Select({
  label,
  placeholder = 'Sélectionner…',
  error,
  hint,
  options,
  value,
  onValueChange,
  disabled,
  className,
  id,
}: SelectProps) {
  const generatedId = React.useId()
  const selectId = id ?? generatedId

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-text-ink">
          {label}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={selectId}
          aria-invalid={!!error}
          className={cn(
            'flex w-full items-center justify-between rounded-xl border border-border bg-surface-white px-3 py-2.5 text-sm text-text-ink',
            'transition-all duration-200',
            'focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-text-subtle',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-text-subtle" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-[100] max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-surface-white shadow-xl animate-scale-in"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    'relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-body outline-none',
                    'data-[highlighted]:bg-brand-green-lt data-[highlighted]:text-brand-green',
                    'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed',
                    'data-[state=checked]:font-medium data-[state=checked]:text-brand-green',
                  )}
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="ml-auto">
                    <Check className="h-3.5 w-3.5" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-text-subtle">{hint}</p>
      )}
    </div>
  )
}
