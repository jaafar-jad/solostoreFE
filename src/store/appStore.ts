'use client';

import { create } from 'zustand';
import type { BuildStatus } from '@/types/app.types';

interface BuildState {
  jobId: string | null;
  status: BuildStatus | null;
  progress: number;
  logs: string[];
  step: string;
  apkUrl: string | null;
  error: string | null;
}

interface AppStoreState {
  build: BuildState;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';

  setBuildJob: (jobId: string) => void;
  updateBuildProgress: (data: Partial<BuildState>) => void;
  resetBuild: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const initialBuild: BuildState = {
  jobId: null,
  status: null,
  progress: 0,
  logs: [],
  step: '',
  apkUrl: null,
  error: null,
};

export const useAppStore = create<AppStoreState>()((set) => ({
  build: initialBuild,
  isSidebarOpen: true,
  theme: 'light',

  setBuildJob: (jobId) =>
    set((state) => ({
      build: { ...state.build, jobId, status: 'queued', progress: 0, logs: [], error: null },
    })),

  updateBuildProgress: (data) =>
    set((state) => ({
      build: { ...state.build, ...data },
    })),

  resetBuild: () => set({ build: initialBuild }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('solostore-theme', next);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', next);
      }
      return { theme: next };
    }),

  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('solostore-theme', theme);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },
}));
