'use client'

import * as React from 'react'

import { cn } from '@/lib/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  showCount?: boolean
  maxLength?: number
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, showCount, maxLength, id, value, onChange, ...props }, ref) => {
    const generatedId = React.useId()
    const textareaId = id ?? generatedId
    const [count, setCount] = React.useState(typeof value === 'string' ? value.length : 0)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCount(e.target.value.length)
      onChange?.(e)
    }

    return (
      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="block text-sm font-medium text-text-ink">
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span className={cn('text-xs tabular-nums', count >= maxLength ? 'text-red-500' : 'text-text-subtle')}>
              {count}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          className={cn(
            'w-full resize-y rounded-xl border border-border bg-surface-white px-3 py-2.5 text-sm text-text-ink placeholder:text-text-subtle',
            'transition-all duration-200 min-h-[100px]',
            'focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1.5 text-xs text-text-subtle">{hint}</p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
