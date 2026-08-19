"use client";
import { motion } from 'framer-motion'
import SectionTitle from '@/components/common/sectionTitle'
import { TECH_STACK } from '@/constants/data'

/**
 * Landing page "Technology" section — the actual stack behind ClipMind AI.
 */
const TechnologySection = () => {
  return (
    <section id="technology" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionTitle
          eyebrow="Technology"
          title="Built on a modern, AI-native stack"
          subtitle="Real speech recognition, real language models, no shortcuts."
        />

        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {TECH_STACK.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (idx % 4) * 0.08 }}
              className="rounded-xl bg-md-surface-container p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-md-tertiary-container text-md-on-tertiary-container">
                <tech.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="text-title-small font-semibold text-md-on-surface">{tech.name}</h3>
              <p className="mt-1.5 text-body-small leading-relaxed text-md-on-surface-variant">{tech.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TechnologySection
