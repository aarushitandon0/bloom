// ── Toast component ─────────────────────────────────────────

import { motion, AnimatePresence } from 'framer-motion';
import { useNotifStore } from '@/stores/notifStore';

export function Toast() {
  const toast = useNotifStore((s) => s.patternToast);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="
            fixed bottom-6 left-1/2 -translate-x-1/2
            bg-parchment border border-latte/15
            rounded-2xl px-5 py-3
            shadow-lg
            z-50 max-w-sm
          "
        >
          <p className="text-ink text-sm font-body leading-relaxed text-center">
            {toast.message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
