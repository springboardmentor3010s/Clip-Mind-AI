"use client";
import { motion } from 'framer-motion'
import SectionTitle from '@/components/common/sectionTitle'
import { WORKFLOW_STEPS } from '@/constants/data'

/**
 * Landing page "Workflow" section — the real processing pipeline as steps.
 */
const WorkflowSection = () => {
  return (
    <section id="workflow" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionTitle
          eyebrow="Workflow"
          title="From raw video to actionable insight, automatically"
          subtitle="Every upload runs through the same AI pipeline — no manual steps required."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_STEPS.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
              className="relative rounded-xl bg-md-surface-container p-6"
            >
              <span className="absolute right-6 top-6 text-headline-small font-extrabold text-md-on-surface/5">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-md-primary-container text-md-on-primary-container">
                <step.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="text-title-medium font-semibold text-md-on-surface">{step.title}</h3>
              <p className="mt-2 text-body-small leading-relaxed text-md-on-surface-variant">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WorkflowSection
