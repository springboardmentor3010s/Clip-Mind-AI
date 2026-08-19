"use client";
import { motion } from 'framer-motion'
import SectionTitle from '@/components/common/sectionTitle'
import { FEATURES } from '@/constants/data'

/**
 * Landing page "Features" section — grid of what's actually shipped.
 */
const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionTitle
          eyebrow="Features"
          title="Everything you need to turn video into insight"
          subtitle="From upload to analytics, ClipMind AI handles the full pipeline automatically."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
              className="rounded-xl bg-md-surface-container p-6 transition-colors hover:bg-md-surface-container-high"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-md-tertiary-container text-md-on-tertiary-container">
                <feature.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="text-title-medium font-semibold text-md-on-surface">{feature.title}</h3>
              <p className="mt-2 text-body-small leading-relaxed text-md-on-surface-variant">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
