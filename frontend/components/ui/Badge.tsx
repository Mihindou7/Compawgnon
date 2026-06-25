import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        green:  'bg-brand-green-lt text-brand-green ring-brand-green/20',
        amber:  'bg-amber-50 text-amber-700 ring-amber-200',
        red:    'bg-red-50 text-red-700 ring-red-200',
        gray:   'bg-gray-100 text-gray-600 ring-gray-200',
        blue:   'bg-blue-50 text-blue-700 ring-blue-200',
        gold:   'bg-amber-50 text-amber-800 ring-amber-300',
        purple: 'bg-purple-50 text-purple-700 ring-purple-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'green',
      size: 'md',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-brand-green':  variant === 'green',
            'bg-amber-500':    variant === 'amber',
            'bg-red-500':      variant === 'red',
            'bg-gray-400':     variant === 'gray',
            'bg-blue-500':     variant === 'blue',
            'bg-amber-600':    variant === 'gold',
          })}
        />
      )}
      {children}
    </span>
  )
}
