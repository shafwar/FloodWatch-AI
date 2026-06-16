// =============================================================================
// FloodWatch Semarang — UI Store (Zustand)
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  settings: AppSettings;
  notificationQueue: string[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  pushNotification: (message: string) => void;
  popNotification: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  refreshInterval: 60,
  mapStyle: 'standard',
  notifications: true,
  browserNotifications: false,
  soundAlerts: false,
  autoCenter: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      theme: 'dark',
      settings: DEFAULT_SETTINGS,
      notificationQueue: [],

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        set({ theme });
      },

      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next === 'dark');
          }
          return { theme: next };
        }),

      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      pushNotification: (message) =>
        set((state) => ({ notificationQueue: [...state.notificationQueue, message] })),

      popNotification: () =>
        set((state) => ({ notificationQueue: state.notificationQueue.slice(1) })),
    }),
    {
      name: 'floodwatch-ui',
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
