import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

/**
 * Compact card used in the Technology Stack grid.
 */
const TechCard = ({ icon: Icon, name, description, index = 0 }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <GlassCard className="flex h-full flex-col items-center text-center">
        <div className="mb-3 inline-flex items-center justify-center rounded-full bg-white/5 p-3">
          <Icon className="text-brand-purple" size={24} aria-hidden="true" />
        </div>
        <h4 className="mb-1 text-sm font-semibold text-white">{name}</h4>
        <p className="text-xs leading-relaxed text-slate-500">{description}</p>
      </GlassCard>
    </motion.div>
  )
}

export default TechCard