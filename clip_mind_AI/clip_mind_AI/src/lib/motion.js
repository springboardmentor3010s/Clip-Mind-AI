/**
 * Shared framer-motion presets so animations feel consistent and calm
 * across the app. Kept subtle and usability-first.
 */
export const pageFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

export const cardItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
