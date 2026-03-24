// ── Auth page — Google OAuth + Guest mode ───────────────────

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flower2, Globe, Sparkles, ChevronRight, Loader2, UserPlus, LogIn, Leaf, Droplets } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

/* ── Decorative mini plant shapes ───────────────────────── */
function MiniPlant({ x, y, scale = 1, opacity = 0.6 }: { x: string; y: string; scale?: number; opacity?: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: x, top: y, opacity }}
      animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 3 + scale, repeat: Infinity, ease: 'easeInOut', delay: scale * 0.5 }}
    >
      <svg width={28 * scale} height={36 * scale} viewBox="0 0 28 36" fill="none">
        {/* Stem */}
        <line x1="14" y1="34" x2="14" y2="14" stroke="#6AAE50" strokeWidth="2" strokeLinecap="round" />
        {/* Left leaf */}
        <path d="M14 22 Q7 16 9 12 Q12 18 14 22Z" fill="#8BAF7A" />
        {/* Right leaf */}
        <path d="M14 18 Q21 12 19 8 Q16 14 14 18Z" fill="#95C27A" />
        {/* Flower */}
        <circle cx="14" cy="10" r="4" fill="#FFD54F" />
        <circle cx="14" cy="10" r="2" fill="#FF8A65" />
      </svg>
    </motion.div>
  );
}

export default function Auth() {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anyLoading = loadingGoogle || loadingSignup || loadingGuest;

  const handleLogin = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError('Could not connect to Google. Try again.');
      setLoadingGoogle(false);
    }
  };

  const handleSignup = async () => {
    setError(null);
    setLoadingSignup(true);
    try {
      await signInWithGoogle();
      // Supabase auto-creates new users on first Google sign-in
    } catch (e) {
      setError('Could not connect to Google. Try again.');
      setLoadingSignup(false);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setLoadingGuest(true);
    try {
      await signInAnonymously();
    } catch (e) {
      setError('Guest sign-in failed. Check your connection.');
      setLoadingGuest(false);
    }
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-parchment flex flex-col items-center justify-center px-6">

      {/* ── Decorative background plants ── */}
      <MiniPlant x="6%" y="12%" scale={0.7} opacity={0.25} />
      <MiniPlant x="80%" y="8%" scale={0.9} opacity={0.2} />
      <MiniPlant x="3%" y="55%" scale={1.1} opacity={0.18} />
      <MiniPlant x="88%" y="50%" scale={0.8} opacity={0.22} />
      <MiniPlant x="50%" y="4%" scale={0.6} opacity={0.15} />
      <MiniPlant x="70%" y="70%" scale={0.75} opacity={0.2} />
      <MiniPlant x="15%" y="75%" scale={0.65} opacity={0.18} />

      {/* ── Soft gradient orbs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-sage/10 blur-3xl" />
        <div className="absolute bottom-[-5%] right-[-10%] w-80 h-80 rounded-full bg-latte/10 blur-3xl" />
        <div className="absolute top-[40%] left-[40%] w-48 h-48 rounded-full bg-mist/8 blur-2xl" />
      </div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xs"
      >
        {/* Logo + name */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-3"
          >
            <Flower2 size={60} className="text-sage drop-shadow-sm" />
          </motion.div>
          <h1
            className="text-5xl text-ink font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            bloom
          </h1>
          <p
            className="mt-2 text-base text-ink/50 text-center leading-relaxed"
            style={{ fontFamily: 'var(--font-journal)' }}
          >
            grow a garden from your feelings
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Sign up with Google — PRIMARY CTA */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSignup}
            disabled={anyLoading}
            className="w-full flex items-center justify-between px-5 py-4
                       bg-sage text-cream rounded-2xl font-display font-bold text-base
                       shadow-md shadow-sage/20 hover:bg-sage/90
                       disabled:opacity-60 disabled:pointer-events-none
                       transition-colors"
          >
            <div className="flex items-center gap-3">
              {loadingSignup ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <UserPlus size={20} />
              )}
              <span>sign up with Google</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4" />
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853" />
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05" />
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335" />
            </svg>
          </motion.button>

          {/* Sign in — ghost/outline secondary */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={anyLoading}
            className="w-full flex items-center justify-between px-5 py-3.5
                       bg-transparent border-2 border-ink/15 text-ink/70 rounded-2xl
                       font-display font-bold text-sm
                       hover:bg-ink/5 hover:border-ink/25
                       disabled:opacity-60 disabled:pointer-events-none
                       transition-colors"
          >
            <div className="flex items-center gap-3">
              {loadingGoogle ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              <span>already have an account? sign in</span>
            </div>
            <ChevronRight size={16} className="opacity-40" />
          </motion.button>

          {/* Explore as guest — tinted pill, more visible */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGuest}
            disabled={anyLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3
                       bg-latte/12 text-latte rounded-2xl
                       font-display font-semibold text-sm
                       hover:bg-latte/20
                       disabled:opacity-60 disabled:pointer-events-none
                       transition-colors"
          >
            {loadingGuest ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Globe size={18} />
            )}
            <span>just browsing? explore as a guest</span>
          </motion.button>
        </div>

        {/* Guest caveat */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center text-xs text-ink/35 leading-relaxed"
          style={{ fontFamily: 'var(--font-journal)' }}
        >
          guests can browse the world map &amp; view gardens.
          <br />sign up to start growing your own.
        </motion.p>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-center text-xs text-[#CE5656] font-display"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Subtle tagline ── */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mt-10 text-xs text-ink/25 font-display tracking-wide text-center flex items-center justify-center gap-3 flex-wrap"
      >
        <span className="inline-flex items-center gap-1"><Leaf size={11} /> log moods</span>
        <span className="text-ink/15">·</span>
        <span className="inline-flex items-center gap-1"><Flower2 size={11} /> grow plants</span>
        <span className="text-ink/15">·</span>
        <span className="inline-flex items-center gap-1"><Globe size={11} /> explore gardens</span>
        <span className="text-ink/15">·</span>
        <span className="inline-flex items-center gap-1"><Droplets size={11} /> send kindness</span>
      </motion.p>

      {/* Sparkle accent */}
      <motion.div
        className="absolute bottom-8 right-8 text-sage/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles size={20} />
      </motion.div>
    </div>
  );
}
