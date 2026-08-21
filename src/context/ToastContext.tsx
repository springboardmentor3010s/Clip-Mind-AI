import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiInfo, FiXCircle, FiAlertTriangle } from "react-icons/fi";

type ToastKind = "success" | "error" | "info" | "warning";
interface Toast { id: string; kind: ToastKind; message: string; }

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const icons = {
  success: <FiCheckCircle className="text-emerald-500" />,
  error: <FiXCircle className="text-rose-500" />,
  info: <FiInfo className="text-violet-500" />,
  warning: <FiAlertTriangle className="text-amber-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed top-6 right-6 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-strong pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-soft min-w-[260px]"
            >
              <span className="text-lg">{icons[t.kind]}</span>
              <span className="text-foreground">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
