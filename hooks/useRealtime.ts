'use client';

// =============================================================================
// FloodWatch Semarang — BMKG Sync + IoT Sensor + Alert Fusion
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { useWeatherStore } from '@/store/weatherStore';
import { useAlertStore } from '@/store/alertStore';
import { useSensorStore } from '@/store/sensorStore';
import { useUIStore } from '@/store/uiStore';
import { LOCATION_BY_NAME, MONITORING_LOCATIONS } from '@/lib/locations';
import { SENSOR_NODE_BY_LOCATION } from '@/lib/iot/sensorNodes';
import { generateFusedAlert } from '@/lib/iot/alertGenerator';
import { msUntilNextSlotBoundary } from '@/lib/weather/slots';
import type { WeatherCondition } from '@/types';

const BMKG_RECOVERY_INTERVAL_MS = 5 * 60 * 1000;

export function useRealtime() {
  const fetchWeather = useWeatherStore((s) => s.fetchWeather);
  const setConnectionStatus = useWeatherStore((s) => s.setConnectionStatus);
  const getCurrentRecords = useWeatherStore((s) => s.getCurrentRecords);
  const meta = useWeatherStore((s) => s.meta);
  const setAlerts = useAlertStore((s) => s.setAlerts);
  const fetchSensors = useSensorStore((s) => s.fetchSensors);
  const sensorReadings = useSensorStore((s) => s.readings);
  const notificationsEnabled = useUIStore((s) => s.settings.notifications);
  const refreshIntervalSec = useUIStore((s) => s.settings.refreshInterval);

  const hasLoaded = useRef(false);
  const slotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recoveryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncAlertsFromRecords = useCallback(() => {
    if (!notificationsEnabled) {
      setAlerts([]);
      return;
    }

    const currentRecords = getCurrentRecords();
    const readingByLocation = Object.fromEntries(
      sensorReadings.map((r) => [r.locationId, r])
    );

    const alerts = currentRecords
      .map((r) => {
        const loc = LOCATION_BY_NAME[r.daerah];
        if (!loc) return null;
        const sensorReading = readingByLocation[loc.id];
        return generateFusedAlert(
          loc.id,
          r.daerah,
          r.kondisi as WeatherCondition,
          r.kelembapan,
          sensorReading,
          `alert-${loc.id}-${r.kondisi}`
        );
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    // Also check IoT-only alerts for sensor nodes without weather match
    for (const node of Object.values(SENSOR_NODE_BY_LOCATION)) {
      const reading = readingByLocation[node.locationId];
      if (!reading || reading.channelCapacityPercent < 55) continue;

      const loc = MONITORING_LOCATIONS.find((l) => l.id === node.locationId);
      const weatherRec = currentRecords.find((r) => LOCATION_BY_NAME[r.daerah]?.id === node.locationId);
      if (!loc || !weatherRec) continue;

      const existing = alerts.find((a) => a.locationId === node.locationId);
      if (existing) continue;

      const sensorAlert = generateFusedAlert(
        loc.id,
        loc.name,
        weatherRec.kondisi as WeatherCondition,
        weatherRec.kelembapan,
        reading,
        `alert-sensor-${node.id}`
      );
      if (sensorAlert) alerts.push(sensorAlert);
    }

    setAlerts(alerts);
  }, [getCurrentRecords, sensorReadings, setAlerts, notificationsEnabled]);

  const refreshWeather = useCallback(
    async (options?: { probe?: boolean }) => {
      await Promise.all([fetchWeather(options), fetchSensors()]);
      syncAlertsFromRecords();
    },
    [fetchWeather, fetchSensors, syncAlertsFromRecords]
  );

  const scheduleNextSlotSync = useCallback(() => {
    if (slotTimerRef.current) clearTimeout(slotTimerRef.current);

    const delay = msUntilNextSlotBoundary();
    slotTimerRef.current = setTimeout(async () => {
      await refreshWeather();
      scheduleNextSlotSync();
    }, delay);
  }, [refreshWeather]);

  const startRecoveryMonitor = useCallback(() => {
    if (recoveryTimerRef.current) clearInterval(recoveryTimerRef.current);

    recoveryTimerRef.current = setInterval(async () => {
      const status = useWeatherStore.getState().meta?.bmkgStatus;
      if (status === 'online') return;
      await refreshWeather({ probe: true });
    }, BMKG_RECOVERY_INTERVAL_MS);
  }, [refreshWeather]);

  const stopRecoveryMonitor = useCallback(() => {
    if (recoveryTimerRef.current) {
      clearInterval(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const ms = Math.max(30, refreshIntervalSec) * 1000;
    pollTimerRef.current = setInterval(() => {
      refreshWeather();
    }, ms);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [refreshIntervalSec, refreshWeather]);

  useEffect(() => {
    syncAlertsFromRecords();
  }, [notificationsEnabled, sensorReadings, syncAlertsFromRecords]);

  useEffect(() => {
    if (meta?.bmkgStatus === 'online') {
      stopRecoveryMonitor();
    } else if (meta?.bmkgStatus) {
      startRecoveryMonitor();
    }
  }, [meta?.bmkgStatus, startRecoveryMonitor, stopRecoveryMonitor]);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      refreshWeather().then(() => scheduleNextSlotSync());
    }

    return () => {
      if (slotTimerRef.current) clearTimeout(slotTimerRef.current);
      stopRecoveryMonitor();
      setConnectionStatus('disconnected');
    };
  }, [refreshWeather, scheduleNextSlotSync, stopRecoveryMonitor, setConnectionStatus]);
}
