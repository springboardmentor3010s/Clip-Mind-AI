import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

/**
 * Persona card used in the "Who Is It For?" section.
 */
const RoleCard = ({ icon: Icon, title, tasks = [], index = 0 }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <GlassCard className="h-full">
        <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-emerald/20 to-brand-cyan/20 p-3">
          <Icon className="text-brand-emerald" size={26} aria-hidden="true" />
        </div>
        <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task} className="flex items-center gap-2 text-sm text-slate-400">
              <Check size={16} className="shrink-0 text-brand-purple" aria-hidden="true" />
              <span>{task}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  )
}

export default RoleCard