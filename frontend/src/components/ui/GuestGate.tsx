// ── GuestGate — soft upgrade prompt for guest users ─────────
// Shows a gentle "sign in to do this" overlay without blocking navigation.

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Flower2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface GuestGateProps {
  /** Shown when the guest tries a protected action */
  isOpen: boolean;
  onClose: () => void;
  /** What they were trying to do, e.g. "log a mood" */
  action?: string;
}

export function GuestGate({ isOpen, onClose, action = 'do this' }: GuestGateProps) {
  const upgradeGuest = useAuthStore((s) => s.upgradeGuest);

  const handleSignIn = () => {
    upgradeGuest();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl
                       bg-parchment border-t border-latte/15
                       px-6 pt-5 pb-10 max-w-sm mx-auto"
          >
            {/* Handle */}
            <div className="w-8 h-1 rounded-full bg-latte/20 mx-auto mb-5" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-ink/30
                         hover:text-ink/60 hover:bg-cream transition-colors"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flower2 size={40} className="text-sage" />
              </motion.div>
            </div>

            {/* Text */}
            <h2
              className="text-center text-xl text-ink font-bold mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              sign in to {action}
            </h2>
            <p
              className="text-center text-sm text-ink/50 leading-relaxed mb-6"
              style={{ fontFamily: 'var(--font-journal)' }}
            >
              guests can browse & view gardens, but growing your own requires an account.
              <br />
              <span className="text-ink/40">your journey starts the moment you plant your first seed</span>
            </p>

            {/* Google button */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSignIn}
              className="w-full flex items-center justify-between px-5 py-3.5
                         bg-ink text-cream rounded-2xl font-display font-bold text-sm
                         shadow-md shadow-ink/15 hover:bg-ink/90 transition-colors mb-3"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={16} />
                <span>continue with Google</span>
              </div>
              <ChevronRight size={16} className="opacity-60" />
            </motion.button>

            {/* Dismiss */}
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-ink/40 font-display
                         hover:text-ink/60 transition-colors"
            >
              maybe later
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
