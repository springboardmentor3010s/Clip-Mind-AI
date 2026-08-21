import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FiZap } from "react-icons/fi";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background bg-mesh flex flex-col">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <FiZap className="text-white text-sm" />
          </div>
          <span className="font-display text-xl">ClipMind</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-strong rounded-3xl p-8 shadow-glow"
        >
          <h1 className="font-display text-4xl mb-1.5">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mb-7">{subtitle}</p>}
          {children}
        </motion.div>
      </div>
    </div>
  );
}
