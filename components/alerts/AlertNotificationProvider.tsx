'use client';

import { useEffect, useRef } from 'react';
import { useAlertStore } from '@/store/alertStore';
import { useUIStore } from '@/store/uiStore';
import type { FloodAlert } from '@/types';

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

/** Background-only: sound & browser push on new alerts — no on-screen toasts */
export function AlertNotificationProvider() {
  const alerts = useAlertStore((s) => s.alerts);
  const notificationsEnabled = useUIStore((s) => s.settings.notifications);
  const browserNotifications = useUIStore((s) => s.settings.browserNotifications);
  const soundAlerts = useUIStore((s) => s.settings.soundAlerts);

  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

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
        if (soundAlerts && (alert.severity === 'emergency' || alert.severity === 'critical')) {
          playAlertSound();
        }
        if (browserNotifications) {
          showBrowserNotification(alert);
        }
      }
    }
  }, [alerts, notificationsEnabled, browserNotifications, soundAlerts]);

  return null;
}
