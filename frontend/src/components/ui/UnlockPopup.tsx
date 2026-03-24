// ── Unlock popup component ──────────────────────────────────

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

interface UnlockItem {
  name: string;
  description: string;
}

// Simple event-driven approach — any code can trigger this popup
let _showUnlock: ((item: UnlockItem) => void) | null = null;

export function triggerUnlock(name: string, description: string) {
  _showUnlock?.({ name, description });
}

export function UnlockPopup() {
  const [item, setItem] = useState<UnlockItem | null>(null);

  useEffect(() => {
    _showUnlock = (i) => setItem(i);
    return () => { _showUnlock = null; };
  }, []);

  const onClose = () => setItem(null);

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="
              fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              bg-parchment rounded-3xl p-8
              shadow-2xl border border-gold/30
              z-50 text-center max-w-xs w-full
            "
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4"
            >
              <Sparkles size={48} className="text-gold mx-auto" />
            </motion.div>

            <h3 className="font-display font-bold text-xl text-ink mb-2">
              new unlock!
            </h3>

            <p className="font-display font-semibold text-latte text-lg mb-1">
              {item.name}
            </p>

            <p className="text-ink/60 text-sm mb-6">
              {item.description}
            </p>

            <Button onClick={onClose} variant="primary" size="md">
              lovely
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
