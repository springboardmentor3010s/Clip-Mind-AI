import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

/**
 * Reusable section heading with eyebrow, title, and subtitle.
 */
const SectionTitle = ({ eyebrow, title, subtitle, align = 'center', className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className={cn(
        'mx-auto max-w-2xl',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full border border-md-outline-variant bg-md-secondary-container px-4 py-1 text-label-medium font-semibold uppercase tracking-widest text-md-on-secondary-container">
          {eyebrow}
        </span>
      )}
      <h2 className="text-headline-large font-bold tracking-tight text-md-on-surface sm:text-display-small">{title}</h2>
      {subtitle && <p className="mt-4 text-body-large leading-relaxed text-md-on-surface-variant">{subtitle}</p>}
    </motion.div>
  )
}

export default SectionTitle