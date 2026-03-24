// ── Notification store ──────────────────────────────────────

import { create } from 'zustand';
import type { KindnessEvent } from '@/types/user';

interface PatternToast {
  id: string;
  message: string;
  showAt: number;
}

interface NotifState {
  kindnessEvents: KindnessEvent[];
  patternToast: PatternToast | null;
  unreadCount: number;

  addKindness: (event: KindnessEvent) => void;
  markAllRead: () => void;
  showPatternToast: (id: string, message: string) => void;
  dismissPatternToast: () => void;
}

export const useNotifStore = create<NotifState>((set) => ({
  kindnessEvents: [],
  patternToast: null,
  unreadCount: 0,

  addKindness: (event: KindnessEvent) => {
    set((s) => ({
      kindnessEvents: [event, ...s.kindnessEvents],
      unreadCount: s.unreadCount + 1,
    }));
  },

  markAllRead: () => {
    set({ unreadCount: 0 });
  },

  showPatternToast: (id: string, message: string) => {
    set({
      patternToast: { id, message, showAt: Date.now() },
    });
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((s) => {
        if (s.patternToast?.id === id) return { patternToast: null };
        return s;
      });
    }, 4000);
  },

  dismissPatternToast: () => {
    set({ patternToast: null });
  },
}));
