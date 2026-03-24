// ── 404 — Not Found page ────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flower2, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-parchment px-6 gap-4">
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Flower2 size={48} className="text-latte/50" />
      </motion.div>

      <h1
        className="text-2xl text-ink font-bold"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        lost in the garden?
      </h1>
      <p
        className="text-sm text-ink/50 text-center max-w-xs leading-relaxed"
        style={{ fontFamily: 'var(--font-journal)' }}
      >
        this path doesn't lead anywhere — let's head back home.
      </p>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                   bg-sage text-cream font-display font-bold text-sm
                   hover:bg-sage/90 transition-colors"
      >
        <Home size={15} />
        back to garden
      </motion.button>
    </div>
  );
}
