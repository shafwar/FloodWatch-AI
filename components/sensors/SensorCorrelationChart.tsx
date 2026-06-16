'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SensorHistoryPoint } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface SensorCorrelationChartProps {
  history: SensorHistoryPoint[];
  nodeName: string;
}

export function SensorCorrelationChart({ history, nodeName }: SensorCorrelationChartProps) {
  const data = history.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    air: p.waterLevelPercent,
    hujan: p.rainfallMm,
    fullTime: p.timestamp,
  }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground rounded-xl border border-border bg-card">
        Menunggu data telemetri sensor...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">Korelasi Air vs Curah Hujan</h3>
        <p className="text-xs text-muted-foreground">{nodeName} · Virtual IoT Node</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#888" />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#60a5fa" unit="%" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#34d399" unit="mm" />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(_, payload) => {
              const ts = payload?.[0]?.payload?.fullTime;
              return ts ? formatDateTime(ts) : '';
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="air"
            name="Kapasitas Saluran (%)"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="hujan"
            name="Curah Hujan (mm/jam)"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
