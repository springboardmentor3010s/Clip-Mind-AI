import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Material 3 button types: filled, tonal, outlined, text.
 * Pill-shaped per M3 Expressive, with a state-layer hover/press overlay
 * instead of a flat opacity fade.
 */
const variants = {
  primary:
    'bg-md-primary text-md-on-primary hover:shadow-md active:shadow-none',
  tonal:
    'bg-md-secondary-container text-md-on-secondary-container',
  outlined:
    'bg-transparent text-md-primary border border-md-outline',
  ghost:
    'bg-transparent text-md-primary',
  secondary:
    'bg-transparent text-md-primary border border-md-outline',
}

const sizes = {
  sm: 'px-4 py-2 text-label-large',
  md: 'px-6 py-2.5 text-label-large',
  lg: 'px-8 py-3.5 text-title-medium',
}

const Button = forwardRef(
  (
    {
      as: Component = 'button',
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'group relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 overflow-hidden',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 focus-visible:ring-offset-md-background',
          'disabled:pointer-events-none disabled:opacity-38',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-current opacity-0 transition-opacity duration-150 group-hover:opacity-8 group-active:opacity-12" />
        {Icon && iconPosition === 'left' && <Icon size={18} className="relative" />}
        <span className="relative">{children}</span>
        {Icon && iconPosition === 'right' && <Icon size={18} className="relative" />}
      </Component>
    )
  }
)

Button.displayName = 'Button'

export default Button
