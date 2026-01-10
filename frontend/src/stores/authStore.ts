import { create } from 'zustand';
import type { User } from '@/types';
import { signInWithGoogle, signOut as authSignOut, onAuthChange } from '@/services/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signIn: async () => {
    set({ loading: true, error: null });
    try {
      const user = await signInWithGoogle();
      set({ user, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign in',
        loading: false
      });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await authSignOut();
      set({ user: null, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign out',
        loading: false
      });
    }
  },

  initialize: () => {
    const unsubscribe = onAuthChange((user) => {
      set({ user, loading: false, initialized: true });
    });
    return unsubscribe;
  },
}));
