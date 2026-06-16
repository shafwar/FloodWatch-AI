'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  Bell,
  History,
  BarChart3,
  Settings,
  Waves,
  Radio,
  X,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAlertStore } from '@/store/alertStore';
import { useWeatherStore } from '@/store/weatherStore';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard, description: 'Executive overview' },
  { href: '/map',       label: 'Peta GIS',     icon: Map,             description: 'Interactive flood map' },
  { href: '/sensors',   label: 'Sensor IoT',   icon: Cpu,             description: 'Virtual node telemetry' },
  { href: '/alerts',    label: 'Alert Center', icon: Bell,            description: 'Alert & prevention' },
  { href: '/analytics', label: 'Analytics',    icon: BarChart3,       description: 'Trend analysis' },
  { href: '/history',   label: 'Riwayat',      icon: History,         description: 'Historical data' },
  { href: '/settings',  label: 'Pengaturan',   icon: Settings,        description: 'System settings' },
];

const spring = { type: 'spring' as const, stiffness: 380, damping: 36 };

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const unreadCount = useAlertStore((s) => s.getUnreadCount());
  const connectionStatus = useWeatherStore((s) => s.connectionStatus);
  const bmkgStatus = useWeatherStore((s) => s.meta?.bmkgStatus);

  const desktopWidth = collapsed ? 72 : 260;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: desktopWidth }}
        transition={spring}
        className={cn(
          'fixed left-0 top-0 z-50 h-screen flex flex-col shrink-0',
          'bg-sidebar border-r border-sidebar-border overflow-hidden',
          'lg:relative lg:z-auto',
          !sidebarOpen && '-translate-x-full lg:translate-x-0',
          'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:transition-none',
          className
        )}
      >
        <div
          className="flex flex-col h-full min-w-[72px]"
          style={{ width: collapsed ? 72 : 260 }}
        >
              {/* Header / Logo */}
              <div className={cn(
                'flex items-center h-16 px-4 border-b border-sidebar-border shrink-0',
                collapsed ? 'justify-center' : 'justify-between'
              )}>
                <AnimatePresence initial={false} mode="wait">
                  {!collapsed ? (
                    <motion.div
                      key="logo-full"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-2.5 overflow-hidden"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 text-primary shrink-0">
                        <Waves size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm leading-tight gradient-text">FloodWatch</p>
                        <p className="text-[10px] text-muted-foreground leading-tight truncate">Semarang Monitoring</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="logo-icon"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 text-primary"
                    >
                      <Waves size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Connection Status */}
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-4 py-2.5 border-b border-sidebar-border overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <div className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      bmkgStatus === 'online' ? 'bg-green-500 animate-pulse' :
                      bmkgStatus === 'degraded' ? 'bg-yellow-500 animate-pulse' :
                      connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                    )} />
                    <span className="text-muted-foreground truncate">
                      {bmkgStatus === 'online'
                        ? 'BMKG · Slot 3 Jam'
                        : bmkgStatus === 'degraded'
                          ? 'BMKG Hybrid · CSV cadangan'
                          : bmkgStatus === 'offline'
                            ? 'CSV Fallback · Recovery aktif'
                            : connectionStatus === 'connecting'
                              ? 'Menyinkronkan...'
                              : 'Terputus'}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  const showBadge = item.href === '/alerts' && unreadCount > 0;

                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger className="w-full" render={
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                            'transition-colors duration-200 group relative',
                            isActive
                              ? 'bg-primary/15 text-primary fw-glow'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        />
                      }>
                        {isActive && (
                          <motion.span
                            layoutId="activeNav"
                            transition={spring}
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"
                          />
                        )}

                        <Icon
                          size={18}
                          className={cn(
                            'shrink-0 transition-colors',
                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />

                        <AnimatePresence initial={false}>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.18 }}
                              className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                            >
                              <span>{item.label}</span>
                              {showBadge && (
                                <Badge
                                  variant="destructive"
                                  className="ml-auto h-5 min-w-5 px-1.5 text-[10px] rounded-full"
                                >
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                              )}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {collapsed && showBadge && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                        )}
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="fw-glass">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </nav>

              {/* Footer */}
              {!collapsed && (
                <div className="px-2 pb-4 shrink-0 border-t border-sidebar-border pt-3">
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Radio size={12} className="text-primary animate-pulse" />
                      <span>IoT Monitoring Active</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">4 Node IoT · 10 Titik BMKG</p>
                  </div>
                </div>
              )}
        </div>
      </motion.aside>
    </>
  );
}
