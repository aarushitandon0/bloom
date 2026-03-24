// ── Settings page ───────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LogOut,
  Globe,
  Palette,
  Home,
  Volume2,
  VolumeX,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useAudioStore } from '@/stores/audioStore';
import { useGardenStore } from '@/stores/gardenStore';
import { ACCENT_COLOURS } from '@/types/user';
import type { CottageStyle } from '@/types/garden';

const COTTAGE_OPTIONS: { value: CottageStyle; label: string }[] = [
  { value: 'wood', label: 'Wooden' },
  { value: 'stone', label: 'Stone' },
  { value: 'brick', label: 'Brick' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { profile, isGuest, signInWithGoogle, signOut, updateProfile } = useAuthStore();
  const { isMuted, toggleMute, volume, setVolume } = useAudioStore();
  const { cottageStyle, setCottageStyle } = useGardenStore();

  const [gardenName, setGardenName] = useState(profile?.garden_name ?? 'my garden');
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? false);
  const [hemisphere, setHemisphere] = useState(profile?.hemisphere ?? 'north');
  const [selectedAccent, setSelectedAccent] = useState(profile?.accent_colour ?? ACCENT_COLOURS[0]);

  const save = useCallback(async () => {
    await updateProfile({
      garden_name: gardenName,
      is_public: isPublic,
      hemisphere: hemisphere as 'north' | 'south',
      accent_colour: selectedAccent,
      cottage_style: cottageStyle,
    });
  }, [gardenName, isPublic, hemisphere, selectedAccent, cottageStyle, updateProfile]);

  // Auto-save when user leaves the page (browser back, tab close, etc.)
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    return () => { saveRef.current(); };
  }, []);

  return (
    <div className="min-h-dvh bg-parchment">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-parchment/90 backdrop-blur-sm border-b border-latte/10 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { save(); navigate('/'); }}
            className="p-2 -ml-2 rounded-xl hover:bg-cream transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-ink" />
          </button>
          <h1 className="font-display text-lg text-ink font-bold">settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* Garden name */}
        <Card>
          <label className="text-xs font-display text-ink/50 mb-1 block">garden name</label>
          <input
            type="text"
            value={gardenName}
            onChange={(e) => setGardenName(e.target.value)}
            maxLength={30}
            className="w-full bg-transparent border-b border-latte/20 pb-1
                       text-ink font-display text-base
                       focus:outline-none focus:border-latte"
          />
        </Card>

        {/* Cottage style */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Home size={16} className="text-latte" />
            <span className="text-xs font-display text-ink/50">cottage style</span>
          </div>
          <div className="flex gap-2">
            {COTTAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCottageStyle(opt.value)}
                className={`
                  flex-1 py-2 rounded-xl text-sm font-display transition-all
                  ${cottageStyle === opt.value
                    ? 'bg-latte text-cream'
                    : 'bg-cream text-ink/60 border border-latte/10 hover:bg-parchment'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Accent colour */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-mauve" />
            <span className="text-xs font-display text-ink/50">accent colour</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {ACCENT_COLOURS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedAccent(c)}
                className={`
                  w-8 h-8 rounded-full transition-all
                  ${selectedAccent === c ? 'ring-2 ring-offset-2 ring-ink/40 scale-110' : ''}
                `}
                style={{ backgroundColor: c }}
                aria-label={`Colour ${c}`}
              />
            ))}
          </div>
        </Card>

        {/* Hemisphere */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-mist" />
            <span className="text-xs font-display text-ink/50">hemisphere (for seasons)</span>
          </div>
          <div className="flex gap-2">
            {(['north', 'south'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHemisphere(h)}
                className={`
                  flex-1 py-2 rounded-xl text-sm font-display transition-all capitalize
                  ${hemisphere === h
                    ? 'bg-latte text-cream'
                    : 'bg-cream text-ink/60 border border-latte/10 hover:bg-parchment'
                  }
                `}
              >
                {h}
              </button>
            ))}
          </div>
        </Card>

        {/* Sound */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isMuted ? (
                <VolumeX size={16} className="text-ink/40" />
              ) : (
                <Volume2 size={16} className="text-sage" />
              )}
              <span className="text-xs font-display text-ink/50">ambient sound</span>
            </div>
            <button
              onClick={toggleMute}
              className={`
                px-3 py-1 rounded-full text-xs font-display transition-all
                ${isMuted ? 'bg-cream text-ink/40' : 'bg-sage text-cream'}
              `}
            >
              {isMuted ? 'off' : 'on'}
            </button>
          </div>
          {!isMuted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3"
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-sage"
              />
            </motion.div>
          )}
        </Card>

        {/* Visibility */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-display text-ink/50 block">garden visibility</span>
              <span className="text-xs text-ink/30 font-body">
                {isPublic ? 'anyone can visit your garden' : 'only you can see your garden'}
              </span>
            </div>
            <button
              onClick={() => setIsPublic((v) => !v)}
              className={`
                px-3 py-1 rounded-full text-xs font-display transition-all
                ${isPublic ? 'bg-sage text-cream' : 'bg-cream text-ink/40'}
              `}
            >
              {isPublic ? 'public' : 'private'}
            </button>
          </div>
        </Card>

        {/* Account */}
        <Card>
          {isGuest ? (
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-between w-full group"
            >
              <span className="text-sm font-display text-ink">sign in with Google</span>
              <ChevronRight size={16} className="text-ink/30 group-hover:text-ink/60 transition-colors" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('are you sure you want to sign out?')) {
                  signOut();
                }
              }}
              className="flex items-center gap-2 text-sm font-display text-terra"
            >
              <LogOut size={16} />
              sign out
            </button>
          )}
        </Card>

        {/* Save */}
        <Button onClick={save} size="lg" className="w-full">
          save changes
        </Button>
      </div>
    </div>
  );
}
