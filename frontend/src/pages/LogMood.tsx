// ── Log Mood page — bottom-sheet style ──────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Droplets } from 'lucide-react';
import { EmojiPicker } from '@/components/mood/EmojiPicker';
import { IntensitySlider } from '@/components/mood/IntensitySlider';
import { PlantPreview } from '@/components/mood/PlantPreview';
import { WateringAnimation } from '@/components/mood/WateringAnimation';
import { Button } from '@/components/ui/Button';
import { useMoodLog } from '@/hooks/useMoodLog';
import { MOOD_OPTIONS } from '@/types/mood';
import type { MoodType, Intensity } from '@/types/mood';

export default function LogMood() {
  const navigate = useNavigate();
  const { log } = useMoodLog();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState<Intensity>(3);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWatering, setShowWatering] = useState(false);

  const selectedOption = MOOD_OPTIONS.find((m) => m.type === selectedMood);

  const handleSubmit = async () => {
    if (!selectedMood || isSubmitting) return;
    setIsSubmitting(true);
    setShowWatering(true);
  };

  const handleWateringComplete = async () => {
    if (!selectedMood) return;
    await log(selectedMood, intensity, note.trim() || null);
    setShowWatering(false);
    navigate('/', { replace: true });
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-40 bg-parchment flex flex-col overflow-hidden"
    >
      {/* Decorative background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-48"
          style={{
            background: selectedOption
              ? `radial-gradient(ellipse at 50% 0%, ${selectedOption.colour}15 0%, transparent 70%)`
              : 'radial-gradient(ellipse at 50% 0%, rgba(168,212,138,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative flex items-center gap-3 px-4 pt-4 pb-2 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-cream/60 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} className="text-ink" />
        </button>
        <div>
          <h1 className="font-display text-lg text-ink font-bold">how are you feeling?</h1>
          <p className="text-xs text-ink/40 font-body">choose your mood to grow a plant</p>
        </div>
      </header>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto px-4 pb-32 z-10">
        {/* Step 1: Mood selection */}
        <section className="mt-4">
          <p className="text-sm font-display text-ink/50 mb-3 flex items-center gap-1.5">
            <Sparkles size={13} className="text-sage" />
            tap a feeling
          </p>
          <EmojiPicker selected={selectedMood} onSelect={setSelectedMood} />
        </section>

        {/* Step 2: Intensity */}
        {selectedMood && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            className="mt-6"
          >
            <IntensitySlider
              value={intensity}
              onChange={setIntensity}
              color={selectedOption?.colour}
            />
          </motion.section>
        )}

        {/* Step 3: Preview */}
        {selectedMood && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, type: 'spring', damping: 22 }}
            className="mt-6 flex flex-col items-center"
          >
            <p className="text-sm font-display text-ink/50 mb-3">your plant will look like</p>
            <div className="relative">
              <PlantPreview mood={selectedMood} intensity={intensity} />
              {/* Subtle glow under preview */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full blur-lg"
                style={{ backgroundColor: selectedOption?.colour, opacity: 0.2 }}
              />
            </div>
            {selectedOption && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream border border-latte/8"
              >
                <Droplets size={12} className="text-sage/60" />
                <span className="text-xs text-ink/40 font-body">
                  weather: {selectedOption.weatherLabel}
                </span>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* Step 4: Optional note */}
        {selectedMood && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', damping: 22 }}
            className="mt-6"
          >
            <label className="text-sm font-display text-ink/50 mb-2 block">
              add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="what's on your mind..."
              className="w-full bg-cream/70 rounded-2xl border border-latte/10 px-4 py-3
                         text-ink placeholder:text-ink/25 font-body text-sm
                         resize-none focus:outline-none focus:ring-2 focus:ring-sage/30
                         focus:border-sage/20 transition-all"
            />
            <p className="text-right text-xs text-ink/25 mt-1">{note.length}/280</p>
          </motion.section>
        )}
      </div>

      {/* Submit button */}
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 inset-x-0 p-4 z-20"
          style={{
            background: 'linear-gradient(to top, var(--parchment) 60%, transparent)',
          }}
        >
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 shadow-lg shadow-latte/15"
          >
            <Sparkles size={18} />
            <span>plant it</span>
            <Send size={16} />
          </Button>
        </motion.div>
      )}

      {/* Watering animation overlay */}
      <WateringAnimation isPlaying={showWatering} onComplete={handleWateringComplete} />
    </motion.div>
  );
}
