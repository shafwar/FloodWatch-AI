// =============================================================================
// FloodWatch Semarang — Flood Risk Engine
// Core risk calculation engine based on weather condition + humidity
// =============================================================================

import type { WeatherCondition, FloodLevel, FloodRiskResult } from '@/types';

// ---------------------------------------------------------------------------
// Base Risk Scores (per specification)
// ---------------------------------------------------------------------------

const BASE_RISK_SCORES: Record<WeatherCondition, number> = {
  'Cerah': 0,
  'Cerah Berawan': 10,
  'Berawan': 20,
  'Berawan Tebal': 35,
  'Hujan Ringan': 50,
  'Hujan Sedang': 75,
  'Hujan Lebat': 90,
  'Hujan Sangat Lebat': 100,
};

// ---------------------------------------------------------------------------
// Flood Level Thresholds
// ---------------------------------------------------------------------------

export const FLOOD_LEVELS: { min: number; max: number; level: FloodLevel; color: string; bgColor: string; textColor: string; borderColor: string }[] = [
  { min: 0,  max: 39,  level: 'AMAN',    color: '#22c55e', bgColor: 'bg-green-500/15',  textColor: 'text-green-400',  borderColor: 'border-green-500/40' },
  { min: 40, max: 69,  level: 'WASPADA', color: '#eab308', bgColor: 'bg-yellow-500/15', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/40' },
  { min: 70, max: 89,  level: 'SIAGA',   color: '#f97316', bgColor: 'bg-orange-500/15', textColor: 'text-orange-400', borderColor: 'border-orange-500/40' },
  { min: 90, max: 100, level: 'BAHAYA',  color: '#ef4444', bgColor: 'bg-red-500/15',    textColor: 'text-red-400',    borderColor: 'border-red-500/40' },
];

// ---------------------------------------------------------------------------
// Core Risk Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the flood risk score (0–100) given a weather condition and humidity.
 */
export function calculateFloodRisk(kondisi: WeatherCondition, kelembapan: number): number {
  const base = BASE_RISK_SCORES[kondisi] ?? 0;

  let humidityModifier = 0;
  if (kelembapan > 95) humidityModifier = 15;
  else if (kelembapan > 90) humidityModifier = 10;
  else if (kelembapan > 85) humidityModifier = 5;

  return Math.min(100, base + humidityModifier);
}

/**
 * Returns the full FloodRiskResult object given a score.
 */
export function getFloodRiskResult(score: number): FloodRiskResult {
  const level = FLOOD_LEVELS.find((l) => score >= l.min && score <= l.max) ?? FLOOD_LEVELS[0];

  return {
    score,
    level: level.level,
    color: level.color,
    bgColor: level.bgColor,
    textColor: level.textColor,
    borderColor: level.borderColor,
    label: level.level,
  };
}

/**
 * Get the hex color for a given flood risk score.
 */
export function calculateRiskColor(score: number): string {
  return getFloodRiskResult(score).color;
}

/**
 * Get the flood level label for a given score.
 */
export function calculateRiskLabel(score: number): FloodLevel {
  return getFloodRiskResult(score).level;
}

/**
 * Get the flood level for a given condition + humidity pair.
 */
export function getFloodLevel(kondisi: WeatherCondition, kelembapan: number): FloodLevel {
  const score = calculateFloodRisk(kondisi, kelembapan);
  return calculateRiskLabel(score);
}

// ---------------------------------------------------------------------------
// Alert Generator — re-export from IoT fusion module
// ---------------------------------------------------------------------------

export { generateAlert, generateFusedAlert } from '@/lib/iot/alertGenerator';

// ---------------------------------------------------------------------------
// Batch Risk Assessment
// ---------------------------------------------------------------------------

export function assessAllLocations(
  records: Array<{ locationId: string; daerah: string; kondisi: WeatherCondition; kelembapan: number }>
): Array<{ locationId: string; score: number; level: FloodLevel; result: FloodRiskResult }> {
  return records.map((r) => {
    const score = calculateFloodRisk(r.kondisi, r.kelembapan);
    const result = getFloodRiskResult(score);
    return { locationId: r.locationId, score, level: result.level, result };
  });
}
