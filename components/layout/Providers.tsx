'use client';

// =============================================================================
// FloodWatch Semarang — Providers
// Wraps app with QueryClient, TooltipProvider, and theme initialization
// =============================================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertNotificationProvider } from '@/components/alerts/AlertNotificationProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

function ThemeInitializer() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delay={0}>
        <ThemeInitializer />
        <AlertNotificationProvider />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
