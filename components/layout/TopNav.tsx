'use client';

// =============================================================================
// FloodWatch Semarang — Top Navigation Bar
// =============================================================================

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, Moon, Sun, RefreshCw, AlertTriangle, Settings, PanelLeft } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useWeatherStore } from '@/store/weatherStore';
import { useAlertStore } from '@/store/alertStore';
import { LiveClock } from '@/components/shared/LiveClock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'AQUA Assistant', subtitle: 'FloodWatch Semarang · BMKG' },
  '/map':       { title: 'Peta GIS Interaktif', subtitle: 'Visualisasi geospasial titik pantau banjir' },
  '/sensors':  { title: 'Sensor IoT',           subtitle: 'Telemetri virtual node AQUA-SENSE · data fusion' },
  '/alerts':    { title: 'Alert Center',         subtitle: 'Notifikasi peringatan dini & tindakan pencegahan' },
  '/analytics': { title: 'Analytics',            subtitle: 'Analisis tren cuaca dan risiko banjir' },
  '/history':   { title: 'Riwayat Data',         subtitle: 'Data historis kondisi cuaca & banjir' },
  '/settings':  { title: 'Pengaturan',           subtitle: 'Konfigurasi sistem monitoring' },
};

export function TopNav() {
  const pathname = usePathname();
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const toggleCollapsed = useUIStore((s) => s.toggleCollapsed);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const theme = useUIStore((s) => s.theme);
  const updateCount = useWeatherStore((s) => s.updateCount);
  const alerts = useAlertStore((s) => s.alerts);
  const markAsRead = useAlertStore((s) => s.markAsRead);
  const unreadCount = useAlertStore((s) => s.getUnreadCount());
  const activeAlerts = alerts.filter((a) => a.status === 'active').slice(0, 5);

  const routeInfo = ROUTE_TITLES[pathname] ?? ROUTE_TITLES['/dashboard'];

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center px-4 lg:px-6 gap-4">
      {/* Mobile sidebar */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={() => setSidebarOpen(true)}
        id="mobile-menu-btn"
      >
        <Menu size={18} />
      </Button>

      {/* Desktop sidebar collapse (icon rail — never fully hidden) */}
      <Tooltip>
        <TooltipTrigger className="outline-none hidden lg:flex" render={
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={toggleCollapsed}
            id="sidebar-toggle-btn"
          />
        }>
          <PanelLeft size={18} className={sidebarCollapsed ? 'opacity-50' : 'opacity-70'} />
        </TooltipTrigger>
        <TooltipContent>
          {sidebarCollapsed ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
        </TooltipContent>
      </Tooltip>

      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="text-base font-semibold text-foreground leading-tight truncate">
            {routeInfo.title}
          </h1>
          <p className="text-xs text-muted-foreground leading-tight hidden sm:block truncate">
            {routeInfo.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Update counter */}
        <AnimatePresence>
          {updateCount > 0 && (
            <motion.div
              key={updateCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1"
            >
              <RefreshCw size={11} className="text-primary" />
              <span>Update #{updateCount}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <LiveClock />

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger className="outline-none" render={
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              id="theme-toggle-btn"
              className="shrink-0"
            />
          }>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </motion.div>
              </AnimatePresence>
          </TooltipTrigger>
          <TooltipContent>Ganti tema</TooltipContent>
        </Tooltip>

        {/* Alert Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none" render={
            <Button variant="ghost" size="icon" className="relative shrink-0" id="alert-bell-btn" />
          }>
              <Bell size={16} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 fw-glass">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifikasi Aktif</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5">
                    {unreadCount} belum dibaca
                  </Badge>
                )}
              </DropdownMenuLabel>

              {activeAlerts.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground px-2">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  Tidak ada alert aktif
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <AlertTriangle
                        size={14}
                        className={
                          alert.severity === 'emergency' ? 'text-red-400 mt-0.5 shrink-0' :
                          alert.severity === 'critical' ? 'text-orange-400 mt-0.5 shrink-0' :
                          'text-yellow-400 mt-0.5 shrink-0'
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{alert.daerah}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{alert.message}</p>
                      </div>
                      {!alert.read && (
                        <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="p-0">
                <Link href="/settings" className="flex items-center gap-2 w-full h-full px-2 py-1.5">
                  <Settings size={14} className="text-muted-foreground" />
                  <span>Pengaturan</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
