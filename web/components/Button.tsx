import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg',
  {
    variants: {
      variant: {
        default: 'btn-construction-primary',
        destructive: 'btn-construction-danger',
        outline: 'btn-construction',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-secondary',
        ghost: 'hover:bg-accent hover:text-accent-foreground shadow-none hover:shadow-none',
        link: 'text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none transform-none hover:scale-100 active:scale-100',
        construction: 'btn-construction',
        'construction-primary': 'btn-construction-primary',
        'construction-success': 'btn-construction-success',
        'construction-danger': 'btn-construction-danger',
      },
      size: {
        default: 'touch-target-md text-base',
        sm: 'touch-target-sm text-sm',
        lg: 'touch-target-lg text-lg',
        xl: 'touch-target-xl text-xl',
        icon: 'touch-target-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }