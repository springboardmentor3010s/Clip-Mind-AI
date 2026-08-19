import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

/**
 * Base glassmorphism card used across feature/role/tech cards.
 */
const GlassCard = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -6, scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={cn(
        'glass rounded-2xl p-6 shadow-xl shadow-black/20 transition-colors duration-300 hover:border-brand-purple/40',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default GlassCard