import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Material 3 filled text field: label above a tonal surface, a bottom
 * indicator bar that highlights md-primary on focus, optional leading icon.
 */
const TextField = forwardRef(
  ({ label, icon: Icon, className = '', containerClassName = '', ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label className="text-body-small font-medium text-md-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-md-on-surface-variant" />
          )}
          <input
            ref={ref}
            className={cn(
              'peer w-full rounded-t-md border-b-2 border-md-outline bg-md-surface-container-highest px-4 py-3 text-body-large text-md-on-surface placeholder:text-md-on-surface-variant/70 transition-colors',
              'focus:outline-none focus:border-md-primary',
              Icon && 'pl-11',
              className
            )}
            {...props}
          />
        </div>
      </div>
    )
  }
)

TextField.displayName = 'TextField'

export default TextField
