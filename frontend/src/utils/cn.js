/**
 * Lightweight className combiner (no external dependency).
 * Filters falsy values and joins the rest.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}