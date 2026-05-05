import { create } from 'zustand';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../db/supabase';

// Supabase v2 AuthError can come back with an empty message when the underlying
// failure is SMTP-related (Resend not configured, DNS not propagated, rate limit).
// We normalise into a string the UI can match on. The raw error stays in console.
export function formatAuthError(err: unknown): string {
  if (!err) return 'unknown_error';
  if (typeof err === 'string') return err;
  const e = err as Partial<AuthError> & { code?: string; status?: number; name?: string };
  const msg = (e.message || '').trim();
  if (msg) return msg;
  if (e.code) return `auth_${e.code}`;
  if (e.status === 429) return 'rate_limit_exceeded';
  if (e.status === 500) return 'email_send_failed';
  if (e.name) return e.name;
  return 'unknown_error';
}

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
    // Call our Vercel API endpoint — this bypasses Supabase SMTP entirely.
    // The server creates the user via admin API and sends the confirmation
    // email through Resend. No Supabase SMTP rate-limit can interfere.
    try {
      const r = await fetch('/api/auth-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'confirm', email, password }),
      });
      if (r.ok) return null;
      const body = await r.json().catch(() => ({})) as { error?: string };
      console.error('[auth.signUp] /api/auth-email error:', body);
      return body.error || 'unknown_error';
    } catch (e) {
      console.error('[auth.signUp] network error:', e);
      return formatAuthError(e);
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[auth.signIn] error:', error);
      return formatAuthError(error);
    }
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
