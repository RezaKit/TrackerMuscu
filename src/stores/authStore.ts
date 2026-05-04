import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../db/supabase';

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  init: async () => {
    // Safety timeout: never stay in loading state > 4s (e.g. network failure)
    const timeout = setTimeout(() => {
      set((s) => s.loading ? { user: null, loading: false } : s);
    }, 4000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      clearTimeout(timeout);
      set({ user: session?.user ?? null, loading: false });
    } catch {
      clearTimeout(timeout);
      set({ user: null, loading: false });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
