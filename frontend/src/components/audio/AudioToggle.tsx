// ── Audio toggle component ──────────────────────────────────

import { Volume2, VolumeX, Music } from 'lucide-react';
import { useAudioStore } from '@/stores/audioStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function AudioToggle() {
  const { isMuted, audioReady, toggleMute, initAudio } = useAudioStore();
  const [showHint, setShowHint] = useState(
    !localStorage.getItem('bloom_audio_init')
  );

  const handleClick = () => {
    if (!audioReady) {
      initAudio();
      setShowHint(false);
      return;
    }
    toggleMute();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="
          p-2 rounded-xl
          bg-cream/80 backdrop-blur-sm
          border border-latte/10
          text-ink/50 hover:text-ink
          transition-colors duration-200
        "
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {!audioReady ? (
          <Music size={18} />
        ) : isMuted ? (
          <VolumeX size={18} />
        ) : (
          <Volume2 size={18} />
        )}
      </button>

      <AnimatePresence>
        {showHint && !audioReady && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="
              absolute bottom-full right-0 mb-2
              bg-cream rounded-xl px-3 py-2
              shadow-md border border-latte/15
              text-xs text-ink/70 whitespace-nowrap
            "
          >
            tap to listen
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
