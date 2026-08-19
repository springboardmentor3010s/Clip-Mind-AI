"use client";
import { useState, useEffect } from 'react'
import Link from "next/link"
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles } from 'lucide-react'
import { NAV_LINKS } from '@/constants/data'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { cn } from '@/utils/cn'
import { useAuth } from '@/context/AuthContext'


/**
 * Sticky, responsive top navigation with mobile menu support.
 */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        scrolled ? 'bg-md-surface-container-low shadow-lg shadow-black/10' : 'bg-transparent'
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8"
        aria-label="Primary"
      >
        {/* Logo */}
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-md-primary">
            <Sparkles size={18} className="text-md-on-primary" />
          </div>

          <span className="text-title-large font-bold tracking-tight text-md-on-surface">
            ClipMind AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="focus-ring rounded-md text-label-large font-medium text-md-on-surface-variant transition-colors hover:text-md-on-surface"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button as={Link} href="/dashboard" variant="ghost" size="sm">
                Dashboard
              </Button>
              <Button onClick={logout} variant="primary" size="sm">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} href="/login" variant="ghost" size="sm">
                Login
              </Button>
              <Button as={Link} href="/signup" variant="primary" size="sm">
                Sign Up
              </Button>
            </>
          )}
        </div>


        {/* Mobile Menu Button */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="focus-ring rounded-md p-2 text-md-on-surface"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-md-surface-container-low md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="focus-ring rounded-md text-label-large font-medium text-md-on-surface-variant transition-colors hover:text-md-on-surface"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-2 flex flex-col gap-3">
                <Button
                  as={Link}
                  href="/login"
                  variant="outlined"
                  size="sm"
                  className="w-full"
                >
                  Login
                </Button>

                <Button
                  as={Link}
                  href="/signup"
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
