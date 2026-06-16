// =============================================================================
// AQUA-SENSE — Sensor Store (Zustand)
// =============================================================================

import { create } from 'zustand';
import type { IoTSensorNode, SensorReading, SensorHistoryPoint } from '@/types';

interface SensorState {
  nodes: IoTSensorNode[];
  readings: SensorReading[];
  history: Record<string, SensorHistoryPoint[]>;
  isLoading: boolean;
  lastFetched: string | null;
  error: string | null;

  fetchSensors: () => Promise<void>;
  getReadingByLocation: (locationId: string) => SensorReading | undefined;
  getReadingByNode: (nodeId: string) => SensorReading | undefined;
}

export const useSensorStore = create<SensorState>((set, get) => ({
  nodes: [],
  readings: [],
  history: {},
  isLoading: false,
  lastFetched: null,
  error: null,

  fetchSensors: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/sensor', { cache: 'no-store' });
      if (!res.ok) throw new Error('Sensor API error');
      const data = await res.json();
      set({
        nodes: data.nodes ?? [],
        readings: data.readings ?? [],
        history: data.history ?? {},
        lastFetched: data.meta?.fetchedAt ?? new Date().toISOString(),
        isLoading: false,
      });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : 'Gagal memuat sensor',
      });
    }
  },

  getReadingByLocation: (locationId) =>
    get().readings.find((r) => r.locationId === locationId),

  getReadingByNode: (nodeId) => get().readings.find((r) => r.nodeId === nodeId),
}));
