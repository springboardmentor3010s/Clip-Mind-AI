"use client";
import { motion } from 'framer-motion'
import SectionTitle from '@/components/common/sectionTitle'
import { ROLES } from '@/constants/data'

/**
 * Landing page "About" section — platform objective and target audience.
 */
const AboutSection = () => {
  return (
    <section id="about" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionTitle
          eyebrow="About ClipMind AI"
          title="Video intelligence, built for how you actually consume content"
          subtitle="ClipMind AI is an AI-powered video summarization platform that automatically transcribes videos, generates concise summaries, and identifies the most important moments — helping you consume long-form content more efficiently."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role, idx) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="rounded-xl bg-md-surface-container p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-md-primary-container text-md-on-primary-container">
                <role.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="text-title-medium font-semibold text-md-on-surface">{role.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {role.tasks.map((task) => (
                  <li key={task} className="text-body-small text-md-on-surface-variant">
                    {task}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AboutSection
