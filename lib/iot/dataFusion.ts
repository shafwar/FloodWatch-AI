// =============================================================================
// AQUA-SENSE — Data Fusion Engine
// Menggabungkan data sensor IoT lokal + prakiraan cuaca BMKG
// =============================================================================

import type { WeatherCondition, FloodLevel } from '@/types';
import {
  calculateFloodRisk,
  getFloodRiskResult,
  calculateRiskLabel,
} from '@/lib/floodRiskEngine';

export interface FusionInput {
  kondisi: WeatherCondition;
  kelembapan: number;
  channelCapacityPercent: number;
  rainfallMm: number;
  forecastHeavyRain?: boolean;
}

export interface FusionResult {
  weatherScore: number;
  sensorScore: number;
  fusedScore: number;
  level: FloodLevel;
  boostApplied: boolean;
  boostReason?: string;
}

function sensorScoreFromReading(capacityPercent: number, rainfallMm: number): number {
  let score = 0;

  if (capacityPercent >= 85) score = 95;
  else if (capacityPercent >= 70) score = 78;
  else if (capacityPercent >= 55) score = 62;
  else if (capacityPercent >= 40) score = 45;
  else score = Math.round(capacityPercent * 0.6);

  if (rainfallMm >= 25) score = Math.min(100, score + 20);
  else if (rainfallMm >= 15) score = Math.min(100, score + 12);
  else if (rainfallMm >= 8) score = Math.min(100, score + 6);

  return Math.min(100, score);
}

function isHeavyRainCondition(kondisi: WeatherCondition): boolean {
  return kondisi === 'Hujan Lebat' || kondisi === 'Hujan Sangat Lebat' || kondisi === 'Hujan Sedang';
}

/**
 * Threshold dinamis: naikkan risiko jika air mendekati batas + hujan diprediksi berlanjut.
 */
export function calculateFusedRisk(input: FusionInput): FusionResult {
  const weatherScore = calculateFloodRisk(input.kondisi, input.kelembapan);
  const sensorScore = sensorScoreFromReading(input.channelCapacityPercent, input.rainfallMm);

  let fusedScore = Math.max(weatherScore, sensorScore);
  let boostApplied = false;
  let boostReason: string | undefined;

  const nearCapacity = input.channelCapacityPercent >= 55;
  const heavyRain =
    input.forecastHeavyRain ?? (isHeavyRainCondition(input.kondisi) || input.rainfallMm >= 12);

  if (nearCapacity && heavyRain && fusedScore < 70) {
    fusedScore = Math.min(100, fusedScore + 15);
    boostApplied = true;
    boostReason = 'Air saluran tinggi + prakiraan hujan berlanjut (data fusion)';
  }

  if (input.channelCapacityPercent >= 75 && fusedScore < 85) {
    fusedScore = Math.min(100, Math.max(fusedScore, 82));
    boostApplied = true;
    boostReason = boostReason ?? 'Sensor ultrasonik: kapasitas saluran kritis';
  }

  const level = calculateRiskLabel(fusedScore);

  return {
    weatherScore,
    sensorScore,
    fusedScore,
    level,
    boostApplied,
    boostReason,
  };
}

export function getFusedRiskResult(input: FusionInput) {
  const fusion = calculateFusedRisk(input);
  return {
    ...fusion,
    result: getFloodRiskResult(fusion.fusedScore),
  };
}
