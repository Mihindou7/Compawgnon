'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:   'bg-brand-green text-white hover:bg-brand-green-dk focus-visible:ring-brand-green shadow-sm hover:shadow-md',
        secondary: 'bg-brand-green-lt text-brand-green hover:bg-green-100 focus-visible:ring-brand-green',
        outline:   'border border-border bg-surface-white text-text-ink hover:bg-surface-cream focus-visible:ring-brand-green',
        ghost:     'bg-transparent text-text-body hover:bg-surface-cream focus-visible:ring-brand-green',
        danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm',
        'danger-outline': 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500',
      },
      size: {
        sm:   'h-8 px-3 text-sm gap-1.5',
        md:   'h-10 px-4 text-sm',
        lg:   'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?: React.ElementType
  rightIcon?: React.ElementType
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon: LeftIcon, rightIcon: RightIcon, children, disabled, asChild, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}>
          {children}
        </Slot>
      )
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : LeftIcon ? (
          <LeftIcon className="h-4 w-4" />
        ) : null}
        {children}
        {!isLoading && RightIcon && <RightIcon className="h-4 w-4" />}
      </button>
    )
  },
)

Button.displayName = 'Button'
