// =============================================================================
// FloodWatch Semarang — Mock Alert Data (50+ alerts)
// =============================================================================

import type { FloodAlert, AlertSeverity, AlertStatus, FloodLevel, WeatherCondition } from '@/types';
import { MONITORING_LOCATIONS } from '@/lib/locations';
import { getPreventionActions } from '@/lib/iot/preventionGuide';

function minutesAgo(minutes: number): string {
  const d = new Date('2026-06-10T00:00:00Z');
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date('2026-06-10T00:00:00Z');
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

interface AlertTemplate {
  locationId: string;
  daerah: string;
  kondisi: WeatherCondition;
  floodLevel: FloodLevel;
  floodScore: number;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  timestamp: string;
  read: boolean;
}

const ALERT_TEMPLATES: AlertTemplate[] = [
  // Emergency alerts
  {
    locationId: 'gemah',
    daerah: 'Pedurungan (Gemah)',
    kondisi: 'Hujan Sangat Lebat',
    floodLevel: 'BAHAYA',
    floodScore: 100,
    severity: 'emergency',
    status: 'active',
    message: '🚨 DARURAT: Hujan Sangat Lebat terdeteksi di Pedurungan (Gemah). Kelembapan 95%. Status BAHAYA — Segera evakuasi!',
    timestamp: minutesAgo(5),
    read: false,
  },
  {
    locationId: 'pedurungan-kidul',
    daerah: 'Pedurungan (Pedurungan Kidul)',
    kondisi: 'Hujan Lebat',
    floodLevel: 'BAHAYA',
    floodScore: 92,
    severity: 'emergency',
    status: 'active',
    message: '🚨 DARURAT: Hujan Lebat terdeteksi di Pedurungan Kidul. Kelembapan 91%. Status BAHAYA — Potensi banjir tinggi!',
    timestamp: minutesAgo(12),
    read: false,
  },
  // Critical alerts
  {
    locationId: 'semarang-tengah-miroto',
    daerah: 'Semarang Tengah (Miroto)',
    kondisi: 'Hujan Sedang',
    floodLevel: 'SIAGA',
    floodScore: 85,
    severity: 'critical',
    status: 'active',
    message: '⚠️ Hujan Sedang terdeteksi di Semarang Tengah (Miroto). Kelembapan 90%. Status SIAGA — Waspada potensi banjir!',
    timestamp: minutesAgo(18),
    read: false,
  },
  {
    locationId: 'semarang-utara-bandarharjo',
    daerah: 'Semarang Utara (Bandarharjo)',
    kondisi: 'Berawan Tebal',
    floodLevel: 'SIAGA',
    floodScore: 78,
    severity: 'critical',
    status: 'active',
    message: '⚠️ Berawan Tebal terdeteksi di Bandarharjo. Kelembapan 82%. Status SIAGA.',
    timestamp: minutesAgo(25),
    read: true,
  },
  // Warning alerts
  {
    locationId: 'wonodri',
    daerah: 'Semarang Selatan (Wonodri)',
    kondisi: 'Hujan Ringan',
    floodLevel: 'WASPADA',
    floodScore: 55,
    severity: 'warning',
    status: 'active',
    message: '🌦️ Hujan Ringan terdeteksi di Wonodri. Kelembapan 87%. Status WASPADA.',
    timestamp: minutesAgo(40),
    read: true,
  },
  {
    locationId: 'candi',
    daerah: 'Candisari (Candi)',
    kondisi: 'Berawan',
    floodLevel: 'WASPADA',
    floodScore: 42,
    severity: 'warning',
    status: 'acknowledged',
    message: '☁️ Berawan di Candisari (Candi). Kelembapan 79%. Status WASPADA.',
    timestamp: minutesAgo(55),
    read: true,
  },
  // Historical resolved alerts
  {
    locationId: 'gemah',
    daerah: 'Pedurungan (Gemah)',
    kondisi: 'Hujan Lebat',
    floodLevel: 'BAHAYA',
    floodScore: 95,
    severity: 'emergency',
    status: 'resolved',
    message: '🚨 Hujan Lebat terdeteksi di Gemah. Status BAHAYA.',
    timestamp: hoursAgo(2),
    read: true,
  },
  {
    locationId: 'banyumanik',
    daerah: 'Banyumanik (Kel. Banyumanik)',
    kondisi: 'Hujan Sedang',
    floodLevel: 'SIAGA',
    floodScore: 80,
    severity: 'critical',
    status: 'resolved',
    message: '⚠️ Hujan Sedang di Banyumanik. Status SIAGA.',
    timestamp: hoursAgo(3),
    read: true,
  },
  {
    locationId: 'tembalang',
    daerah: 'Tembalang (Kel. Tembalang)',
    kondisi: 'Hujan Ringan',
    floodLevel: 'WASPADA',
    floodScore: 52,
    severity: 'warning',
    status: 'resolved',
    message: '🌦️ Hujan Ringan terdeteksi di Tembalang. Status WASPADA.',
    timestamp: hoursAgo(4),
    read: true,
  },
  {
    locationId: 'jatingaleh',
    daerah: 'Candisari (Jatingaleh)',
    kondisi: 'Berawan Tebal',
    floodLevel: 'WASPADA',
    floodScore: 40,
    severity: 'warning',
    status: 'resolved',
    message: '🌥️ Berawan Tebal di Jatingaleh. Status WASPADA.',
    timestamp: hoursAgo(5),
    read: true,
  },
  {
    locationId: 'srondol-kulon',
    daerah: 'Banyumanik (Srondol Kulon)',
    kondisi: 'Hujan Ringan',
    floodLevel: 'WASPADA',
    floodScore: 50,
    severity: 'warning',
    status: 'resolved',
    message: '🌦️ Hujan Ringan terdeteksi di Srondol Kulon. Status WASPADA.',
    timestamp: hoursAgo(6),
    read: true,
  },
  // More historical alerts to fill timeline
  {
    locationId: 'pedurungan-kidul',
    daerah: 'Pedurungan (Pedurungan Kidul)',
    kondisi: 'Hujan Sangat Lebat',
    floodLevel: 'BAHAYA',
    floodScore: 100,
    severity: 'emergency',
    status: 'resolved',
    message: '🚨 Hujan Sangat Lebat di Pedurungan Kidul. Status BAHAYA.',
    timestamp: hoursAgo(8),
    read: true,
  },
  {
    locationId: 'gemah',
    daerah: 'Pedurungan (Gemah)',
    kondisi: 'Hujan Sedang',
    floodLevel: 'SIAGA',
    floodScore: 75,
    severity: 'critical',
    status: 'resolved',
    message: '⚠️ Hujan Sedang di Gemah. Status SIAGA.',
    timestamp: hoursAgo(10),
    read: true,
  },
  {
    locationId: 'semarang-tengah-miroto',
    daerah: 'Semarang Tengah (Miroto)',
    kondisi: 'Hujan Lebat',
    floodLevel: 'BAHAYA',
    floodScore: 90,
    severity: 'emergency',
    status: 'resolved',
    message: '🚨 Hujan Lebat di Miroto. Status BAHAYA.',
    timestamp: hoursAgo(12),
    read: true,
  },
  {
    locationId: 'wonodri',
    daerah: 'Semarang Selatan (Wonodri)',
    kondisi: 'Berawan Tebal',
    floodLevel: 'WASPADA',
    floodScore: 45,
    severity: 'warning',
    status: 'resolved',
    message: '🌥️ Berawan Tebal di Wonodri. Status WASPADA.',
    timestamp: hoursAgo(14),
    read: true,
  },
];

// Add more generated alerts
function generateExtraAlerts(): AlertTemplate[] {
  const extras: AlertTemplate[] = [];
  const locs = MONITORING_LOCATIONS.slice(0, 6);
  const levels: Array<{ level: FloodLevel; score: number; severity: AlertSeverity; kondisi: WeatherCondition }> = [
    { level: 'WASPADA', score: 55, severity: 'warning', kondisi: 'Hujan Ringan' },
    { level: 'SIAGA', score: 78, severity: 'critical', kondisi: 'Hujan Sedang' },
    { level: 'BAHAYA', score: 94, severity: 'emergency', kondisi: 'Hujan Lebat' },
  ];

  for (let i = 0; i < 36; i++) {
    const loc = locs[i % locs.length];
    const lvl = levels[i % levels.length];
    const d = new Date('2026-06-10T00:00:00Z');
    d.setHours(d.getHours() - (i + 15));
    extras.push({
      locationId: loc.id,
      daerah: loc.name,
      kondisi: lvl.kondisi,
      floodLevel: lvl.level,
      floodScore: lvl.score,
      severity: lvl.severity,
      status: 'resolved',
      message: `${lvl.kondisi} terdeteksi di ${loc.name}. Status ${lvl.level}.`,
      timestamp: d.toISOString(),
      read: true,
    });
  }
  return extras;
}

export const MOCK_ALERTS: FloodAlert[] = [
  ...ALERT_TEMPLATES,
  ...generateExtraAlerts(),
].map((t, idx) => ({
  ...t,
  id: `alert-${idx + 1}`,
  source: 'weather' as const,
  preventionActions: getPreventionActions(t.floodLevel),
}));

export const ACTIVE_ALERTS = MOCK_ALERTS.filter((a) => a.status === 'active');
export const UNREAD_ALERTS = MOCK_ALERTS.filter((a) => !a.read);
