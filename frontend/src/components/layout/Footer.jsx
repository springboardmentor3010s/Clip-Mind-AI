import Link from "next/link"
import { Sparkles, Mail } from 'lucide-react'
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa'
import { NAV_LINKS } from '@/constants/data'

const SOCIALS = [
  { icon: FaGithub, label: 'GitHub', href: 'https://github.com' },
  { icon: FaTwitter, label: 'Twitter', href: 'https://twitter.com' },
  { icon: FaLinkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
  { icon: Mail, label: 'Email', href: 'mailto:contact@clipmind.ai' },
]

/**
 * Site-wide footer with brand, quick links, and social icons.
 */
const Footer = () => {
  return (
    <footer id="contact" className="border-t border-md-outline-variant bg-md-surface-container-low">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">

          {/* Brand */}
          <div>
            <Link href="/" className="focus-ring flex items-center gap-2 rounded-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-md-primary">
                <Sparkles size={18} className="text-md-on-primary" />
              </div>

              <span className="text-title-large font-bold tracking-tight text-md-on-surface">
                ClipMind AI
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-body-medium leading-relaxed text-md-on-surface-variant">
              Transform long videos into smart, searchable insights using
              state-of-the-art AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-label-medium font-semibold uppercase tracking-widest text-md-on-surface">
              Quick Links
            </h4>

            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="focus-ring rounded-md text-body-medium text-md-on-surface-variant transition-colors hover:text-md-on-surface"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Icons */}
          <div>
            <h4 className="mb-4 text-label-medium font-semibold uppercase tracking-widest text-md-on-surface">
              Connect
            </h4>

            <div className="flex gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-md-surface-container text-md-on-surface-variant transition-colors hover:bg-md-secondary-container hover:text-md-on-secondary-container"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

        </div>

        <div className="mt-12 border-t border-md-outline-variant pt-8 text-center text-body-small text-md-on-surface-variant">
          © {new Date().getFullYear()} ClipMind AI. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer