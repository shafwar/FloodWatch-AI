'use client';

import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  PieChart as PieChartIcon,
  MapPin,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { useWeatherStore } from '@/store/weatherStore';
import { calculateFloodRisk, calculateRiskLabel } from '@/lib/floodRiskEngine';
import { MONITORING_LOCATIONS } from '@/lib/locations';
import { CONDITION_CHART_COLORS } from '@/lib/weatherConditions';
import { average } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { WeatherCondition } from '@/types';

const CARD_COLORS = {
  temperature: '#f97316',
  humidity: '#3b82f6',
  risk: '#ef4444',
};

interface ChartSectionProps {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  subtitle: string;
  stats?: { label: string; value: string }[];
  delay?: number;
  className?: string;
  children: ReactNode;
}

function ChartSection({
  title,
  icon: Icon,
  subtitle,
  stats,
  delay = 0,
  className,
  children,
}: ChartSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn('rounded-xl border border-border bg-card p-4 space-y-3', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={15} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        {stats && stats.length > 0 && (
          <div className="hidden sm:flex gap-4 shrink-0">
            {stats.map((s) => (
              <div key={s.label} className="text-right">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-xs font-semibold tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fw-glass rounded-xl p-3 text-xs space-y-1.5 shadow-xl max-w-[200px]">
      <p className="font-semibold text-foreground">Jam {label} WIB</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-mono font-medium text-foreground">
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            {unit ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="fw-glass rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{item.name}</p>
      <p className="text-muted-foreground mt-1">
        {item.value} data ({pct}%)
      </p>
    </div>
  );
}

function findPeak<T extends { time: string }>(
  data: T[],
  key: keyof T
): { time: string; value: number } | null {
  if (!data.length) return null;
  let best = data[0];
  for (const row of data) {
    if ((row[key] as number) > (best[key] as number)) best = row;
  }
  return { time: best.time, value: best[key] as number };
}

function findLow<T extends { time: string }>(
  data: T[],
  key: keyof T
): { time: string; value: number } | null {
  if (!data.length) return null;
  let best = data[0];
  for (const row of data) {
    if ((row[key] as number) < (best[key] as number)) best = row;
  }
  return { time: best.time, value: best[key] as number };
}

export function AnalyticsPageClient() {
  const historicalRecords = useWeatherStore((s) => s.historicalRecords);
  const meta = useWeatherStore((s) => s.meta);
  const isLoading = useWeatherStore((s) => s.isLoading);
  const updateCount = useWeatherStore((s) => s.updateCount);

  const sourceLabel =
    meta?.bmkgStatus === 'online'
      ? 'API BMKG (semua slot prakiraan 3 jam)'
      : meta?.bmkgStatus === 'degraded'
        ? 'hybrid BMKG + CSV cadangan'
        : 'CSV cadangan (BMKG offline)';

  const hourlyData = useMemo(() => {
    const buckets = new Map<string, { temps: number[]; humids: number[]; risks: number[] }>();

    historicalRecords.forEach((r) => {
      const d = new Date(r.timestamp);
      const key = `${d.getHours().toString().padStart(2, '0')}:00`;
      if (!buckets.has(key)) buckets.set(key, { temps: [], humids: [], risks: [] });
      const b = buckets.get(key)!;
      b.temps.push(r.suhu_c);
      b.humids.push(r.kelembapan);
      b.risks.push(calculateFloodRisk(r.kondisi as WeatherCondition, r.kelembapan));
    });

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, b]) => ({
        time,
        avgTemp: Math.round(average(b.temps) * 10) / 10,
        avgHumidity: Math.round(average(b.humids)),
        avgRisk: Math.round(average(b.risks)),
      }));
  }, [historicalRecords]);

  const locationData = useMemo(() => {
    return MONITORING_LOCATIONS.map((loc) => {
      const records = historicalRecords.filter((r) => r.daerah === loc.name);
      const avgTemp = records.length ? average(records.map((r) => r.suhu_c)) : 0;
      const avgHumidity = records.length ? average(records.map((r) => r.kelembapan)) : 0;
      const risks = records.map((r) =>
        calculateFloodRisk(r.kondisi as WeatherCondition, r.kelembapan)
      );
      const avgRisk = risks.length ? average(risks) : 0;
      const maxRisk = risks.length ? Math.max(...risks) : 0;

      return {
        name: loc.kelurahan,
        fullName: loc.name,
        avgTemp: Math.round(avgTemp * 10) / 10,
        avgHumidity: Math.round(avgHumidity),
        avgRisk: Math.round(avgRisk),
        chartRisk: Math.round(avgRisk) || 0.1, // Prevent Recharts bug with radius on 0-value bars
        maxRisk,
        level: calculateRiskLabel(Math.round(avgRisk)),
      };
    }).sort((a, b) => b.avgRisk - a.avgRisk);
  }, [historicalRecords]);

  const conditionDist = useMemo(() => {
    const dist: Record<string, number> = {};
    historicalRecords.forEach((r) => {
      dist[r.kondisi] = (dist[r.kondisi] ?? 0) + 1;
    });
    const total = historicalRecords.length || 1;
    return Object.entries(dist)
      .map(([name, value]) => ({
        name,
        value,
        pct: Math.round((value / total) * 100),
        color: CONDITION_CHART_COLORS[name as WeatherCondition] ?? '#64748b',
      }))
      .sort((a, b) => b.value - a.value);
  }, [historicalRecords]);

  const riskDist = useMemo(() => {
    const dist = { AMAN: 0, WASPADA: 0, SIAGA: 0, BAHAYA: 0 };
    historicalRecords.forEach((r) => {
      const score = calculateFloodRisk(r.kondisi as WeatherCondition, r.kelembapan);
      const level = calculateRiskLabel(score);
      dist[level]++;
    });
    const total = historicalRecords.length || 1;
    return [
      { name: 'AMAN', value: dist.AMAN, color: '#22c55e', pct: Math.round((dist.AMAN / total) * 100) },
      { name: 'WASPADA', value: dist.WASPADA, color: '#eab308', pct: Math.round((dist.WASPADA / total) * 100) },
      { name: 'SIAGA', value: dist.SIAGA, color: '#f97316', pct: Math.round((dist.SIAGA / total) * 100) },
      { name: 'BAHAYA', value: dist.BAHAYA, color: '#ef4444', pct: Math.round((dist.BAHAYA / total) * 100) },
    ];
  }, [historicalRecords]);

  const riskTotal = riskDist.reduce((s, d) => s + d.value, 0);

  const tempStats = useMemo(() => {
    const all = historicalRecords.map((r) => r.suhu_c);
    const peak = findPeak(hourlyData, 'avgTemp');
    const low = findLow(hourlyData, 'avgTemp');
    return {
      avg: all.length ? (average(all)).toFixed(1) : '—',
      peak,
      low,
    };
  }, [historicalRecords, hourlyData]);

  const humidStats = useMemo(() => {
    const all = historicalRecords.map((r) => r.kelembapan);
    const peak = findPeak(hourlyData, 'avgHumidity');
    const low = findLow(hourlyData, 'avgHumidity');
    return {
      avg: all.length ? Math.round(average(all)).toString() : '—',
      peak,
      low,
    };
  }, [historicalRecords, hourlyData]);

  const riskStats = useMemo(() => {
    const all = historicalRecords.map((r) =>
      calculateFloodRisk(r.kondisi as WeatherCondition, r.kelembapan)
    );
    const peak = findPeak(hourlyData, 'avgRisk');
    const low = findLow(hourlyData, 'avgRisk');
    const highRiskCount = all.filter((s) => s >= 40).length;
    return {
      avg: all.length ? Math.round(average(all)).toString() : '—',
      peak,
      low,
      highRiskCount,
      highRiskPct: all.length ? Math.round((highRiskCount / all.length) * 100) : 0,
    };
  }, [historicalRecords, hourlyData]);

  const riskYDomain = useMemo((): [number, number] => {
    const values = hourlyData.map((d) => d.avgRisk);
    if (!values.length) return [0, 50];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      return [Math.max(0, min - 10), Math.min(100, max + 10)];
    }
    const pad = Math.max(3, (max - min) * 0.25);
    return [Math.max(0, Math.floor(min - pad)), Math.min(100, Math.ceil(max + pad))];
  }, [hourlyData]);

  const highestRiskLoc = locationData[0];
  const dominantCondition = conditionDist[0];

  if (isLoading && historicalRecords.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Memuat data analitik...
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Analisis Tren</h2>
          <p className="text-sm text-muted-foreground">
            {sourceLabel} · {historicalRecords.length} data · {MONITORING_LOCATIONS.length} lokasi
          </p>
        </div>
        {updateCount > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/40 rounded-full px-3 py-1">
            <RefreshCw size={10} className="text-primary" />
            Live · Update #{updateCount}
          </div>
        )}
      </div>

      {/* Tren suhu & kelembapan */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartSection
          title="Tren Suhu"
          icon={Thermometer}
          subtitle="Rata-rata suhu per jam (°C) · 10 lokasi"
          stats={[
            { label: 'Rata-rata', value: `${tempStats.avg}°C` },
            { label: 'Tertinggi', value: tempStats.peak ? `${tempStats.peak.value}°C` : '—' },
            { label: 'Terendah', value: tempStats.low ? `${tempStats.low.value}°C` : '—' },
          ]}
          delay={0.1}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CARD_COLORS.temperature} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CARD_COLORS.temperature} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Jam (WIB)', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                label={{ value: '°C', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip content={<CustomTooltip unit="°C" />} />
              <Area
                type="monotone"
                dataKey="avgTemp"
                name="Suhu"
                stroke={CARD_COLORS.temperature}
                strokeWidth={2.5}
                fill="url(#tempGrad)"
                dot={{ r: 3, fill: CARD_COLORS.temperature, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection
          title="Tren Kelembapan"
          icon={Droplets}
          subtitle="Rata-rata kelembapan per jam (%)"
          stats={[
            { label: 'Rata-rata', value: `${humidStats.avg}%` },
            { label: 'Tertinggi', value: humidStats.peak ? `${humidStats.peak.value}%` : '—' },
            { label: 'Terendah', value: humidStats.low ? `${humidStats.low.value}%` : '—' },
          ]}
          delay={0.15}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="humidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CARD_COLORS.humidity} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CARD_COLORS.humidity} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Jam (WIB)', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                domain={[50, 100]}
                label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip content={<CustomTooltip unit="%" />} />
              <Area
                type="monotone"
                dataKey="avgHumidity"
                name="Kelembapan"
                stroke={CARD_COLORS.humidity}
                strokeWidth={2.5}
                fill="url(#humidGrad)"
                dot={{ r: 3, fill: CARD_COLORS.humidity, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* Risiko & distribusi */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartSection
          title="Tren Risiko Banjir"
          icon={AlertTriangle}
          className="xl:col-span-2"
          subtitle="Skor 0–100 per jam · garis kuning=WASPADA, oranye=SIAGA"
          stats={[
            { label: 'Rata-rata', value: riskStats.avg },
            { label: 'Puncak', value: riskStats.peak ? `${riskStats.peak.value}` : '—' },
            { label: '≥ WASPADA', value: `${riskStats.highRiskPct}%` },
          ]}
          delay={0.2}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={hourlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CARD_COLORS.risk} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CARD_COLORS.risk} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Jam (WIB)', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                domain={riskYDomain}
                label={{ value: 'Skor', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <ReferenceLine y={40} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'WASPADA', fontSize: 9, fill: '#eab308' }} />
              <ReferenceLine y={70} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'SIAGA', fontSize: 9, fill: '#f97316' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="avgRisk"
                name="Skor Risiko"
                stroke={CARD_COLORS.risk}
                strokeWidth={2.5}
                fill="url(#riskGrad)"
                dot={{ r: 3, fill: CARD_COLORS.risk, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection
          title="Distribusi Risiko"
          icon={PieChartIcon}
          subtitle="Proporsi AMAN / WASPADA / SIAGA / BAHAYA"
          stats={[
            { label: 'Total', value: `${riskTotal}` },
            { label: 'Dominan', value: riskDist.reduce((a, b) => (b.value > a.value ? b : a), riskDist[0])?.name ?? '—' },
          ]}
          delay={0.25}
        >
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={riskDist}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
              >
                {riskDist.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip total={riskTotal} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-1">
            {riskDist.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs rounded-lg bg-muted/20 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">({item.pct}%)</span>
                </div>
                <span className="font-mono text-foreground">{item.value} data</span>
              </div>
            ))}
          </div>
        </ChartSection>
      </div>

      {/* Perbandingan lokasi */}
      <ChartSection
        title="Risiko per Lokasi"
        icon={MapPin}
        subtitle="Perbandingan skor rata-rata tiap kelurahan"
        stats={[
          { label: 'Tertinggi', value: highestRiskLoc ? `${highestRiskLoc.name} (${highestRiskLoc.avgRisk})` : '—' },
          { label: 'Titik', value: `${locationData.length}` },
        ]}
        delay={0.3}
      >
        <ResponsiveContainer width="100%" height={Math.max(300, locationData.length * 35 + 40)}>
          <BarChart data={locationData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              label={{ value: 'Skor Risiko (0–100)', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              width={90}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof locationData)[0];
                return (
                  <div className="fw-glass rounded-xl p-3 text-xs shadow-xl">
                    <p className="font-semibold text-foreground">{d.fullName}</p>
                    <p className="text-muted-foreground mt-1">Rata-rata risiko: <span className="font-mono text-foreground">{d.avgRisk}</span></p>
                    <p className="text-muted-foreground">Maksimum: <span className="font-mono text-foreground">{d.maxRisk}</span></p>
                    <p className="text-muted-foreground">Kategori: <span className="font-medium text-foreground">{d.level}</span></p>
                    <p className="text-muted-foreground mt-1">Suhu rata: {d.avgTemp}°C · Lembab: {d.avgHumidity}%</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="chartRisk" name="Rata-rata Risiko" radius={[0, 6, 6, 0]} barSize={14}>
              {locationData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.avgRisk >= 90 ? '#ef4444' :
                    entry.avgRisk >= 70 ? '#f97316' :
                    entry.avgRisk >= 40 ? '#eab308' : '#22c55e'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Distribusi kondisi cuaca */}
      <ChartSection
        title="Kondisi Cuaca"
        icon={Cloud}
        subtitle={`Frekuensi kondisi BMKG · dominan: ${dominantCondition?.name ?? '—'}`}
        stats={[
          { label: 'Dominan', value: dominantCondition ? `${dominantCondition.pct}%` : '—' },
          { label: 'Jenis', value: `${conditionDist.length}` },
        ]}
        delay={0.35}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={conditionDist} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              angle={-20}
              textAnchor="end"
              height={50}
              label={{ value: 'Kondisi Cuaca', position: 'insideBottom', offset: -18, fontSize: 10, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Frekuensi', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof conditionDist)[0];
                return (
                  <div className="fw-glass rounded-xl p-3 text-xs shadow-xl">
                    <p className="font-semibold text-foreground">{d.name}</p>
                    <p className="text-muted-foreground mt-1">
                      Muncul <span className="font-mono text-foreground">{d.value}x</span> ({d.pct}% dari total)
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" name="Frekuensi" radius={[6, 6, 0, 0]}>
              {conditionDist.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>
    </div>
  );
}
