// =============================================================================
// AQUA-SENSE — Virtual Sensor Simulator (Software-in-the-Loop)
// Simulates ESP32 telemetry: ultrasonic water level + raindrop + DHT
// =============================================================================

import type { SensorReading, SensorHistoryPoint, IoTSensorNode, WeatherCondition } from '@/types';
import { IOT_SENSOR_NODES } from '@/lib/iot/sensorNodes';
import { LOCATION_MAP } from '@/lib/locations';

const HISTORY_LENGTH = 24;
const historyStore = new Map<string, SensorHistoryPoint[]>();
const nodeStateStore = new Map<
  string,
  { capacity: number; rainfall: number; humidity: number; temperature: number }
>();

function seedFromString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

function rainIntensityFromCondition(kondisi: WeatherCondition): number {
  switch (kondisi) {
    case 'Hujan Sangat Lebat':
      return 28;
    case 'Hujan Lebat':
      return 20;
    case 'Hujan Sedang':
      return 12;
    case 'Hujan Ringan':
      return 5;
    case 'Berawan Tebal':
      return 2;
    default:
      return 0;
  }
}

function initNodeState(nodeId: string, humidity: number, temperature: number, kondisi: WeatherCondition) {
  const seed = seedFromString(nodeId);
  const baseCapacity = 25 + (seed % 30);
  nodeStateStore.set(nodeId, {
    capacity: baseCapacity,
    rainfall: rainIntensityFromCondition(kondisi) * 0.4,
    humidity,
    temperature,
  });
}

function pushHistory(nodeId: string, point: SensorHistoryPoint) {
  const existing = historyStore.get(nodeId) ?? [];
  const next = [...existing, point].slice(-HISTORY_LENGTH);
  historyStore.set(nodeId, next);
}

export function simulateSensorReadings(
  weatherByLocation: Record<
    string,
    { kondisi: WeatherCondition; kelembapan: number; suhu_c: number }
  >
): { nodes: IoTSensorNode[]; readings: SensorReading[]; history: Record<string, SensorHistoryPoint[]> } {
  const now = new Date().toISOString();
  const nodes: IoTSensorNode[] = [];
  const readings: SensorReading[] = [];

  for (const node of IOT_SENSOR_NODES) {
    const weather = weatherByLocation[node.locationId];
    const kondisi = weather?.kondisi ?? 'Berawan';
    const humidity = weather?.kelembapan ?? 75;
    const temperature = weather?.suhu_c ?? 28;

    if (!nodeStateStore.has(node.id)) {
      initNodeState(node.id, humidity, temperature, kondisi);
    }

    const state = nodeStateStore.get(node.id)!;
    const rainTarget = rainIntensityFromCondition(kondisi);
    const seed = seedFromString(node.id + now.slice(0, 16));

    state.rainfall = Math.max(0, state.rainfall + (rainTarget - state.rainfall) * 0.35 + (seed % 5) * 0.2);
    state.humidity = Math.min(99, Math.max(40, humidity + (seed % 3) - 1));
    state.temperature = temperature + ((seed % 7) - 3) * 0.1;

    const capacityDelta = state.rainfall * 0.9 + (humidity > 90 ? 1.5 : 0) - (kondisi === 'Cerah' ? 1.2 : 0);
    state.capacity = Math.min(98, Math.max(8, state.capacity + capacityDelta * 0.08 + (seed % 3) * 0.15));

    const waterLevelCm = Math.round((state.capacity / 100) * 120);
    const channelCapacityPercent = Math.round(state.capacity * 10) / 10;
    const rainfallMm = Math.round(state.rainfall * 10) / 10;

    const loc = LOCATION_MAP[node.locationId];
    const reading: SensorReading = {
      nodeId: node.id,
      locationId: node.locationId,
      daerah: loc?.name ?? node.name,
      timestamp: now,
      waterLevelCm,
      channelCapacityPercent,
      rainfallMm,
      temperature: Math.round(state.temperature * 10) / 10,
      humidity: Math.round(state.humidity),
    };

    readings.push(reading);

    const batteryDrain = (seed % 2) * 0.1;
    const battery = Math.max(15, 95 - (seed % 20) - batteryDrain);
    const signal = Math.max(60, 98 - (seed % 15));

    nodes.push({
      ...node,
      status: signal > 65 ? 'online' : 'degraded',
      batteryPercent: Math.round(battery),
      signalStrength: Math.round(signal),
      lastSeen: now,
    });

    pushHistory(node.id, {
      timestamp: now,
      waterLevelPercent: channelCapacityPercent,
      rainfallMm,
    });
  }

  const history: Record<string, SensorHistoryPoint[]> = {};
  for (const node of IOT_SENSOR_NODES) {
    history[node.id] = historyStore.get(node.id) ?? [];
  }

  return { nodes, readings, history };
}

export function getSensorHistory(): Record<string, SensorHistoryPoint[]> {
  const history: Record<string, SensorHistoryPoint[]> = {};
  for (const node of IOT_SENSOR_NODES) {
    history[node.id] = historyStore.get(node.id) ?? [];
  }
  return history;
}
