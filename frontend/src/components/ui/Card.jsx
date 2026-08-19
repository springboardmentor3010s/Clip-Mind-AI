import { cn } from '@/utils/cn'

/**
 * Material 3 card: filled (surface-container), elevated (surface + shadow),
 * outlined (outline-variant border). Shape defaults to the M3E-leaning
 * "large" radius; pass `shape` to override.
 */
const variants = {
  filled: 'bg-md-surface-container border border-transparent',
  elevated: 'bg-md-surface-container-low shadow-lg shadow-black/10 border border-transparent',
  outlined: 'bg-md-surface border border-md-outline-variant',
}

export default function Card({
  variant = 'filled',
  shape = 'rounded-xl',
  className = '',
  children,
  ...props
}) {
  return (
    <div
      className={cn(shape, variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}
