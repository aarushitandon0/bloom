// ── Auth store ──────────────────────────────────────────────

import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/user';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isGuest: boolean;
  isLoading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  /** Convert an anonymous session to a full Google account */
  upgradeGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isGuest: false,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: session.user,
          session,
          isGuest: session.user.is_anonymous ?? false,
        });
        await get().fetchProfile(session.user.id);
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      set({ isLoading: false, initialized: true });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        set({
          user: session.user,
          session,
          isGuest: session.user.is_anonymous ?? false,
        });
        await get().fetchProfile(session.user.id);
      } else {
        set({ user: null, session: null, profile: null, isGuest: false });
      }
    });
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  },

  signInAnonymously: async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (data.user) {
      set({ user: data.user, isGuest: true });
    }
  },

  // Upgrade an anonymous guest to a full Google account.
  // Supabase handles the identity linking; we just trigger the OAuth flow.
  upgradeGuest: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // linkIdentity tells Supabase to link to the existing anon session
        queryParams: { prompt: 'select_account' },
      },
    });
  },

  signOut: async () => {
    // Tell backend to invalidate the token, then clear client state
    try { await authApi.signOut(); } catch { /* non-fatal */ }
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, isGuest: false });
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      set({ profile: data as unknown as UserProfile });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const user = get().user;
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) {
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      }));
    }
  },
}));
