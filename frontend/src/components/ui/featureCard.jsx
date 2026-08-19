import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

/**
 * Feature card used in the Features section grid.
 */
const FeatureCard = ({ icon: Icon, title, description, index = 0 }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <GlassCard className="h-full">
        <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 p-3">
          <Icon className="text-brand-cyan" size={26} aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </GlassCard>
    </motion.div>
  )
}

export default FeatureCard