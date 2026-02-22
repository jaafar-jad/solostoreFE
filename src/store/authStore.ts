'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user.types';

/* ── Cookie helpers — middleware can read these (not httpOnly) ── */
function setBrowserCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${days * 86400}; samesite=strict`;
}
function clearBrowserCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;

  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoggedIn: false,

      setAuth: (user, accessToken) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }
        // These cookies are read by middleware.ts for route protection
        setBrowserCookie('solostore-auth', '1');
        setBrowserCookie('solostore-role', user.role);
        set({ user, accessToken, isLoggedIn: true });
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        clearBrowserCookie('solostore-auth');
        clearBrowserCookie('solostore-role');
        set({ user: null, accessToken: null, isLoggedIn: false });
      },
    }),
    {
      name: 'solostore-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
