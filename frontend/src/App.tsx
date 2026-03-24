// ── Bloom — App shell ────────────────────────────────────────

import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useMoodStore } from '@/stores/moodStore';
import { useGardenStore } from '@/stores/gardenStore';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { useRealtime } from '@/hooks/useRealtime';
import { usePatterns } from '@/hooks/usePatterns';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Toast } from '@/components/ui/Toast';
import { UnlockPopup } from '@/components/ui/UnlockPopup';

// Lazy-loaded pages
const Auth = lazy(() => import('@/pages/Auth'));
const Home = lazy(() => import('@/pages/Home'));
const LogMood = lazy(() => import('@/pages/LogMood'));
const Journal = lazy(() => import('@/pages/Journal'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const Insights = lazy(() => import('@/pages/Insights'));
const Settings = lazy(() => import('@/pages/Settings'));
const WorldMap = lazy(() => import('@/pages/WorldMap'));
const FriendGarden = lazy(() => import('@/pages/FriendGarden'));
const SharedGarden = lazy(() => import('@/pages/SharedGarden'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function AppShell() {
  const user = useAuthStore((s) => s.user);
  const fetchEntries = useMoodStore((s) => s.fetchEntries);
  const fetchTiles = useGardenStore((s) => s.fetchTiles);

  useAmbientAudio();
  useRealtime();
  usePatterns();
  useOnlineStatus();

  // Bootstrap data on first render (mood entries + garden tiles)
  useEffect(() => {
    if (user) {
      fetchEntries(user.id);
      fetchTiles(user.id);
    }
  }, [user, fetchEntries, fetchTiles]);

  return (
    <AnimatePresence mode="wait">
      <Suspense
        fallback={
          <div className="h-dvh flex items-center justify-center bg-parchment">
            <div className="animate-pulse font-display text-ink/40">loading...</div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<LogMood />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/world" element={<WorldMap />} />
          <Route path="/garden/:gardenId" element={<FriendGarden />} />
          <Route path="/shared-garden" element={<SharedGarden />} />
          <Route path="/shared-garden/:code" element={<SharedGarden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Full-screen loading while we check for an existing session
  if (!initialized || isLoading) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-parchment gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-sage border-t-transparent animate-spin" />
        <p className="font-display text-sm text-ink/40">growing your garden...</p>
      </div>
    );
  }

  // No user at all → show the Auth / onboarding screen
  if (!user) {
    return (
      <BrowserRouter>
        <Suspense fallback={
          <div className="h-dvh flex items-center justify-center bg-parchment">
            <div className="animate-pulse font-display text-ink/40">loading...</div>
          </div>
        }>
          <Auth />
        </Suspense>
        <Toast />
      </BrowserRouter>
    );
  }

  // Authenticated (full user or anonymous guest) → main app
  return (
    <BrowserRouter>
      <AppShell />
      <Toast />
      <UnlockPopup />
    </BrowserRouter>
  );
}