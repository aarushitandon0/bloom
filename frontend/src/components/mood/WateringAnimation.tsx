// ── Watering animation component ────────────────────────────

import { motion, AnimatePresence } from 'framer-motion';
import { Droplets } from 'lucide-react';

interface WateringAnimationProps {
  isPlaying: boolean;
  onComplete: () => void;
}

export function WateringAnimation({ isPlaying, onComplete }: WateringAnimationProps) {
  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, 2200);
          }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          {/* Full-screen soft blue wash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0.15, 0] }}
            transition={{ duration: 2.2, times: [0, 0.2, 0.7, 1] }}
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(120,180,220,0.35), transparent 70%)' }}
          />

          {/* Big watering icon */}
          <motion.div
            initial={{ rotate: 0, y: -30, scale: 0.6, opacity: 0 }}
            animate={{
              rotate: [-5, -40, -40, -5],
              y: [-30, -15, -15, -30],
              scale: [0.6, 1, 1, 0.8],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 2.2, times: [0, 0.25, 0.7, 1] }}
            className="relative"
            style={{ color: '#5ba3d9' }}
          >
            <Droplets size={96} strokeWidth={1.5} />
            {/* "watering..." label */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.2, times: [0, 0.3, 0.7, 1] }}
              className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-sm font-semibold"
              style={{ color: '#5ba3d9' }}
            >
              watering...
            </motion.span>
          </motion.div>

          {/* Large scattered water drops */}
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 0.6 + Math.PI * 0.2;
            const dist = 30 + Math.random() * 40;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.9, 0.9, 0],
                  y: [0, Math.sin(angle) * dist + 40 + i * 6],
                  x: [Math.cos(angle) * 5, Math.cos(angle) * (dist + i * 3)],
                  scale: [0, 1.2, 1, 0.4],
                }}
                transition={{
                  duration: 1.2,
                  delay: 0.35 + i * 0.08,
                  ease: 'easeOut',
                }}
                className="absolute rounded-full"
                style={{
                  width: `${6 + (i % 3) * 3}px`,
                  height: `${8 + (i % 3) * 4}px`,
                  background: `radial-gradient(circle, rgba(120,190,230,0.9), rgba(80,160,210,0.6))`,
                  borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                }}
              />
            );
          })}

          {/* Ripple rings at centre-bottom */}
          {[0, 1, 2].map((r) => (
            <motion.div
              key={`ring-${r}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.5, 0],
                scale: [0, 1.5 + r * 0.5],
              }}
              transition={{
                duration: 1,
                delay: 0.8 + r * 0.25,
                ease: 'easeOut',
              }}
              className="absolute rounded-full border-2"
              style={{
                width: 60,
                height: 60,
                top: '55%',
                borderColor: 'rgba(120,180,220,0.4)',
                background: 'transparent',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
