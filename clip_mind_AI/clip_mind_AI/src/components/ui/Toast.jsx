import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Minimal toast that shows only ONE message at a time. A new toast replaces the
 * current one (and resets its timer) instead of stacking, so rapid clicks —
 * e.g. jumping between timestamps — never render duplicate notifications.
 */
export function useToast() {
  const [toast, setToast] = useState(null); // { id, message, type } | null
  const timerRef = useRef(null);

  const show = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ id: Date.now(), message, type });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const Toaster = useCallback(
    () => (
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={`px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl
                ${toast.type === "error" ? "bg-red-600" : toast.type === "success" ? "bg-green-600" : "bg-slate-700 border border-slate-600"}`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ),
    [toast]
  );

  return { toast: show, Toaster };
}
