'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAlertStore } from '@/store/alertStore';
import { useUIStore } from '@/store/uiStore';
import type { FloodAlert } from '@/types';
import { cn } from '@/lib/utils';

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
}

function showBrowserNotification(alert: FloodAlert) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(`AQUA-SENSE · ${alert.floodLevel}`, {
      body: alert.message.slice(0, 180),
      tag: alert.id,
      icon: '/favicon.ico',
    });
  } catch {
    // Notification blocked
  }
}

function ToastItem({
  alert,
  onDismiss,
}: {
  alert: FloodAlert;
  onDismiss: () => void;
}) {
  const isEmergency = alert.severity === 'emergency' || alert.severity === 'critical';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      className={cn(
        'w-[min(100vw-2rem,380px)] rounded-xl border p-4 shadow-2xl backdrop-blur-md',
        isEmergency
          ? 'border-red-500/50 bg-red-950/90'
          : 'border-yellow-500/40 bg-card/95'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg shrink-0',
            isEmergency ? 'bg-red-500/20' : 'bg-yellow-500/15'
          )}
        >
          <AlertTriangle
            size={18}
            className={isEmergency ? 'text-red-400' : 'text-yellow-400'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Peringatan Dini ·{' '}
            {alert.source === 'fusion'
              ? 'Data Fusion'
              : alert.source === 'sensor'
                ? 'Sensor IoT'
                : 'BMKG'}
          </p>
          <p className="font-semibold text-sm mt-0.5 truncate">{alert.daerah}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
          {alert.preventionActions[0] && (
            <p className="text-[11px] text-primary mt-2 flex items-center gap-1">
              <Shield size={11} />
              {alert.preventionActions[0].title}
            </p>
          )}
          <Link
            href="/alerts"
            className="inline-block text-[11px] text-primary hover:underline mt-2"
            onClick={onDismiss}
          >
            Lihat tindakan pencegahan →
          </Link>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Tutup notifikasi"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export function AlertNotificationProvider() {
  const alerts = useAlertStore((s) => s.alerts);
  const markAsRead = useAlertStore((s) => s.markAsRead);
  const notificationsEnabled = useUIStore((s) => s.settings.notifications);
  const browserNotifications = useUIStore((s) => s.settings.browserNotifications);
  const soundAlerts = useUIStore((s) => s.settings.soundAlerts);

  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [toasts, setToasts] = useState<FloodAlert[]>([]);

  useEffect(() => {
    if (!notificationsEnabled) return;

    const active = alerts.filter((a) => a.status === 'active');

    if (!initialized.current) {
      active.forEach((a) => seenIds.current.add(a.id));
      initialized.current = true;
      return;
    }

    for (const alert of active) {
      if (seenIds.current.has(alert.id)) continue;
      seenIds.current.add(alert.id);

      if (
        alert.severity === 'warning' ||
        alert.severity === 'critical' ||
        alert.severity === 'emergency'
      ) {
        setToasts((prev) => [alert, ...prev].slice(0, 4));

        if (soundAlerts && (alert.severity === 'emergency' || alert.severity === 'critical')) {
          playAlertSound();
        }

        if (browserNotifications) {
          showBrowserNotification(alert);
        }
      }
    }
  }, [alerts, notificationsEnabled, browserNotifications, soundAlerts]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    markAsRead(id);
  };

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      const oldest = toasts[toasts.length - 1];
      if (oldest) dismissToast(oldest.id);
    }, 12000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts]);

  if (!notificationsEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((alert) => (
          <div key={alert.id} className="pointer-events-auto">
            <ToastItem alert={alert} onDismiss={() => dismissToast(alert.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
