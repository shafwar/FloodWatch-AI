// =============================================================================
// AQUA-SENSE — Sensor API Route
// Virtual IoT node telemetry (MQTT/HTTP simulation)
// =============================================================================

import { NextResponse } from 'next/server';
import { readCsvWeatherRecords } from '@/lib/weather/csvReader';
import { LOCATION_MAP } from '@/lib/locations';
import { simulateSensorReadings } from '@/lib/iot/sensorSimulator';
import type { SensorApiResponse, WeatherCondition } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const records = readCsvWeatherRecords().filter((r) => r.keterangan === 'Saat Ini');

    const weatherByLocation: Record<
      string,
      { kondisi: WeatherCondition; kelembapan: number; suhu_c: number }
    > = {};

    for (const rec of records) {
      const loc = Object.values(LOCATION_MAP).find((l) => l.name === rec.daerah);
      if (loc) {
        weatherByLocation[loc.id] = {
          kondisi: rec.kondisi as WeatherCondition,
          kelembapan: rec.kelembapan,
          suhu_c: rec.suhu_c,
        };
      }
    }

    const { nodes, readings, history } = simulateSensorReadings(weatherByLocation);
    const onlineCount = nodes.filter((n) => n.status === 'online').length;

    const response: SensorApiResponse = {
      nodes,
      readings,
      history,
      meta: {
        mode: 'simulation',
        nodeCount: nodes.length,
        onlineCount,
        fetchedAt: new Date().toISOString(),
        protocol: 'MQTT/HTTP (Virtual Node)',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[api/sensor]', error);
    return NextResponse.json({ error: 'Gagal mengambil data sensor IoT' }, { status: 500 });
  }
}
