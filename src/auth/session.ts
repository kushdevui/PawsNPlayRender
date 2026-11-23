// Auth/session state (Zustand). The single source of truth for "who is logged in".
import { create } from 'zustand';
import { setAccessToken } from '@/api/client';
import { authApi } from '@/api/endpoints';
import type { AuthResponse, User } from '@/api/types';
import { queryClient } from '@/lib/queryClient';
import { tokenStorage } from './tokenStorage';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
  status: Status;
  user: User | null;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (body: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useSession = create<SessionState>((set, get) => {
  const startSession = async ({ accessToken, refreshToken, user }: AuthResponse) => {
    await tokenStorage.save(accessToken, refreshToken);
    setAccessToken(accessToken);
    set({ status: 'signedIn', user });
  };

  return {
    status: 'loading',
    user: null,

    // Called once on app start: restore tokens and load the current user.
    bootstrap: async () => {
      const { accessToken } = await tokenStorage.load();
      if (!accessToken) return set({ status: 'signedOut', user: null });
      setAccessToken(accessToken);
      try {
        const user = await authApi.me();
        set({ status: 'signedIn', user });
      } catch {
        // TODO(auth): try authApi.refresh(refreshToken) before giving up.
        await get().signOut();
      }
    },

    signIn: async (email, password) => startSession(await authApi.login(email.trim(), password)),

    signUp: async (body) => startSession(await authApi.register(body)),

    signOut: async () => {
      if (get().status === 'signedIn') authApi.logout().catch(() => {});
      await tokenStorage.clear();
      setAccessToken(null);
      queryClient.clear();
      set({ status: 'signedOut', user: null });
    },

    setUser: (user) => set({ user }),
  };
});
