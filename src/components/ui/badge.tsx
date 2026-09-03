import * as React from 'react'
import { cn } from '@/lib/utils'

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-primary/20 text-primary': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-destructive/20 text-destructive': variant === 'destructive',
          'border border-border text-muted-foreground': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = 'Badge'

export { Badge }
