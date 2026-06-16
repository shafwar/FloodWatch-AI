// =============================================================================
// AQUA-SENSE — Alert Generator (Weather + IoT Fusion)
// =============================================================================

import type {
  WeatherCondition,
  FloodAlert,
  AlertSeverity,
  AlertSource,
  SensorReading,
} from '@/types';
import { calculateFusedRisk } from '@/lib/iot/dataFusion';
import { getPreventionActions } from '@/lib/iot/preventionGuide';
import { CONDITION_CONFIG } from '@/lib/weatherConditions';

function severityFromScore(score: number, isRain: boolean): AlertSeverity {
  if (score >= 90) return 'emergency';
  if (score >= 70) return 'critical';
  if (score >= 40 || isRain) return 'warning';
  return 'information';
}

function buildMessage(
  daerah: string,
  kondisi: WeatherCondition,
  kelembapan: number,
  level: string,
  source: AlertSource,
  sensor?: SensorReading,
  boostReason?: string
): string {
  const icon = CONDITION_CONFIG[kondisi]?.icon ?? '🌧️';
  const sensorPart = sensor
    ? ` Sensor IoT: air ${sensor.channelCapacityPercent}% kapasitas, hujan ${sensor.rainfallMm} mm/jam.`
    : '';
  const boostPart = boostReason ? ` [Fusion: ${boostReason}]` : '';

  const levelMessages: Record<string, string> = {
    WASPADA: `${icon} Potensi banjir di ${daerah}. Kelembapan ${kelembapan}%. Status WASPADA.${sensorPart}${boostPart}`,
    SIAGA: `⚠️ Risiko banjir meningkat di ${daerah}. Status SIAGA — waspada genangan!${sensorPart}${boostPart}`,
    BAHAYA: `🚨 DARURAT BANJIR di ${daerah}! Status BAHAYA — segera evakuasi!${sensorPart}${boostPart}`,
    AMAN: '',
  };

  const prefix = source === 'fusion' ? '[Data Fusion] ' : source === 'sensor' ? '[Sensor IoT] ' : '';
  return prefix + (levelMessages[level] ?? levelMessages.WASPADA);
}

export function generateFusedAlert(
  locationId: string,
  daerah: string,
  kondisi: WeatherCondition,
  kelembapan: number,
  sensor?: SensorReading,
  id?: string
): FloodAlert | null {
  const isRain = kondisi.toLowerCase().includes('hujan');
  const capacity = sensor?.channelCapacityPercent ?? 0;
  const rainfall = sensor?.rainfallMm ?? 0;

  const fusion = calculateFusedRisk({
    kondisi,
    kelembapan,
    channelCapacityPercent: capacity,
    rainfallMm: rainfall,
    forecastHeavyRain: isRain,
  });

  if (fusion.fusedScore < 40 && !isRain && capacity < 55) return null;

  const severity = severityFromScore(fusion.fusedScore, isRain);
  const source: AlertSource = sensor
    ? fusion.boostApplied
      ? 'fusion'
      : fusion.sensorScore >= fusion.weatherScore
        ? 'sensor'
        : 'weather'
    : 'weather';

  const highWater = capacity >= 55;
  const heavyRain = isRain || rainfall >= 12;

  return {
    id: id ?? `alert-${Date.now()}-${locationId}`,
    locationId,
    daerah,
    kondisi,
    floodLevel: fusion.level,
    floodScore: fusion.fusedScore,
    severity,
    status: 'active',
    message: buildMessage(
      daerah,
      kondisi,
      kelembapan,
      fusion.level,
      source,
      sensor,
      fusion.boostReason
    ),
    timestamp: new Date().toISOString(),
    read: false,
    source,
    nodeId: sensor?.nodeId,
    preventionActions: getPreventionActions(fusion.level, { highWater, heavyRain }),
    sensorSnapshot: sensor
      ? {
          waterLevelPercent: sensor.channelCapacityPercent,
          rainfallMm: sensor.rainfallMm,
          humidity: sensor.humidity,
        }
      : undefined,
  };
}

/** @deprecated Use generateFusedAlert — kept for backward compatibility */
export function generateAlert(
  locationId: string,
  daerah: string,
  kondisi: WeatherCondition,
  kelembapan: number,
  id?: string
): FloodAlert | null {
  return generateFusedAlert(locationId, daerah, kondisi, kelembapan, undefined, id);
}
