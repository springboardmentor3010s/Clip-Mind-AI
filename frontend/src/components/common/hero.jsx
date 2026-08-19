"use client";
import { motion } from 'framer-motion'
import { ArrowRight, PlayCircle, FileText, Sparkles, AudioWaveform } from 'lucide-react'
import Button from '@/components/ui/Button'

/**
 * Landing page hero section with animated gradient blobs and
 * a mock AI transcript panel illustration.
 */
const Hero = () => {
  return (
    <section className="relative overflow-hidden pb-24 pt-40 lg:pt-48">
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-96 w-96 animate-blob rounded-full bg-brand-purple/30 blur-3xl" />
        <div className="absolute right-0 top-32 h-96 w-96 animate-blob rounded-full bg-brand-cyan/20 blur-3xl [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 animate-blob rounded-full bg-brand-emerald/20 blur-3xl [animation-delay:4s]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-md-outline-variant bg-md-secondary-container px-4 py-1.5 text-label-medium font-semibold uppercase tracking-widest text-md-on-secondary-container">
            <Sparkles size={14} aria-hidden="true" />
            AI-Powered Video Intelligence
          </span>

          <h1 className="text-display-small font-extrabold leading-tight tracking-tight text-md-on-surface sm:text-display-medium lg:text-display-large">
            Transform Long Videos Into{' '}
            <span className="text-gradient">Smart Insights</span>
          </h1>

          <p className="mt-6 max-w-xl text-body-large leading-relaxed text-md-on-surface-variant">
            ClipMind AI converts long videos into accurate transcripts, concise summaries,
            key moments, and actionable analytics — powered by cutting-edge speech recognition
            and language models.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button variant="primary" size="lg" icon={ArrowRight}>
              Get Started
            </Button>
            <Button variant="secondary" size="lg" icon={PlayCircle} iconPosition="left">
              Watch Demo
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-8">
            <div>
              <p className="text-headline-small font-bold text-md-on-surface">10x</p>
              <p className="text-body-small text-md-on-surface-variant">Faster review</p>
            </div>
            <div className="h-8 w-px bg-md-outline-variant" />
            <div>
              <p className="text-headline-small font-bold text-md-on-surface">99%</p>
              <p className="text-body-small text-md-on-surface-variant">Transcription accuracy</p>
            </div>
            <div className="h-8 w-px bg-md-outline-variant" />
            <div>
              <p className="text-headline-small font-bold text-md-on-surface">24/7</p>
              <p className="text-body-small text-md-on-surface-variant">Automated processing</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="animate-float relative mx-auto max-w-md rounded-xl bg-md-surface-container-high p-6 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <div className="h-3 w-3 rounded-full bg-green-400/70" />
              <span className="ml-auto text-label-small text-md-on-surface-variant">ClipMind AI — Live Transcript</span>
            </div>

            <div className="space-y-3 rounded-lg bg-md-surface-container-highest p-4">
              <div className="flex items-center gap-2 text-md-primary">
                <AudioWaveform size={16} aria-hidden="true" />
                <span className="text-label-small font-medium">Processing audio…</span>
              </div>
              <div className="h-2 w-full rounded-full bg-md-outline-variant">
                <motion.div
                  className="h-2 rounded-full bg-md-primary"
                  initial={{ width: '10%' }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <FileText size={16} className="mt-0.5 shrink-0 text-md-tertiary" aria-hidden="true" />
                <p className="text-label-small leading-relaxed text-md-on-surface-variant">
                  "…the key takeaway from this quarter is our focus on scalable AI infrastructure…"
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="rounded-full bg-md-primary-container px-3 py-1 text-label-small font-medium text-md-on-primary-container">
                  Key Moment
                </span>
                <span className="rounded-full bg-md-tertiary-container px-3 py-1 text-label-small font-medium text-md-on-tertiary-container">
                  Summary Ready
                </span>
              </div>
            </div>
          </div>

          <div className="animate-glow absolute -inset-4 -z-10 rounded-3xl bg-md-primary/20 blur-2xl" />
        </motion.div>
      </div>
    </section>
  )
}

export default Hero