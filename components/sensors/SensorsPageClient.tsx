'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  Droplets,
  CloudRain,
  Thermometer,
  Wifi,
  Battery,
  Radio,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useSensorStore } from '@/store/sensorStore';
import { useWeatherStore } from '@/store/weatherStore';
import { SensorCorrelationChart } from '@/components/sensors/SensorCorrelationChart';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateFusedRisk } from '@/lib/iot/dataFusion';
import { cn, formatDateTime } from '@/lib/utils';
import type { WeatherCondition } from '@/types';

export function SensorsPageClient() {
  const nodes = useSensorStore((s) => s.nodes);
  const readings = useSensorStore((s) => s.readings);
  const history = useSensorStore((s) => s.history);
  const isLoading = useSensorStore((s) => s.isLoading);
  const lastFetched = useSensorStore((s) => s.lastFetched);
  const records = useWeatherStore((s) => s.records);
  const fetchSensors = useSensorStore((s) => s.fetchSensors);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-01');

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  const weatherMap = useMemo(() => {
    const map: Record<string, { kondisi: WeatherCondition; kelembapan: number }> = {};
    const current = records.filter((r) => r.keterangan === 'Saat Ini');
    for (const r of current) {
      const node = nodes.find((n) => n.name === r.daerah);
      if (node) {
        map[node.locationId] = {
          kondisi: r.kondisi as WeatherCondition,
          kelembapan: r.kelembapan,
        };
      }
    }
    return map;
  }, [records, nodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];
  const selectedReading = readings.find((r) => r.nodeId === selectedNodeId);
  const selectedHistory = history[selectedNodeId] ?? [];

  const onlineCount = nodes.filter((n) => n.status === 'online').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Sensor IoT · AQUA-SENSE</h2>
            <Badge variant="outline" className="text-[10px]">
              Simulasi Virtual Node
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Lapisan perception IoT: ultrasonik (ketinggian air), raindrop (curah hujan), dan DHT
            (kelembapan). Data dikirim via MQTT/HTTP ke backend, lalu difusionkan dengan prakiraan
            BMKG.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSensors()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Telemetri
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Node Aktif', value: `${onlineCount}/${nodes.length}`, icon: Radio, color: 'text-green-400' },
          { label: 'Protokol', value: 'MQTT/HTTP', icon: Wifi, color: 'text-blue-400' },
          { label: 'Firmware', value: 'v1.2.0', icon: Cpu, color: 'text-purple-400' },
          {
            label: 'Last Sync',
            value: lastFetched ? formatDateTime(lastFetched).split(' ')[1] : '—',
            icon: Activity,
            color: 'text-primary',
          },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <Icon size={18} className={color} />
            <div>
              <p className={cn('text-lg font-bold', color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Node selector + chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {selectedNode && (
            <SensorCorrelationChart history={selectedHistory} nodeName={selectedNode.name} />
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Pilih Node Sensor</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {nodes.map((node) => {
              const reading = readings.find((r) => r.nodeId === node.id);
              const weather = weatherMap[node.locationId];
              const fusion =
                reading && weather
                  ? calculateFusedRisk({
                      kondisi: weather.kondisi,
                      kelembapan: weather.kelembapan,
                      channelCapacityPercent: reading.channelCapacityPercent,
                      rainfallMm: reading.rainfallMm,
                    })
                  : null;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={cn(
                    'w-full text-left rounded-lg border p-3 transition-colors',
                    selectedNodeId === node.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{node.nodeId}</span>
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        node.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                      )}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{node.name}</p>
                  {fusion && (
                    <div className="mt-2 flex items-center gap-2">
                      <RiskBadge level={fusion.level} size="sm" />
                      <span className="text-[10px] text-muted-foreground">
                        Fusion {fusion.fusedScore}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Node cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodes.map((node, idx) => {
          const reading = readings.find((r) => r.nodeId === node.id);
          const weather = weatherMap[node.locationId];
          const fusion =
            reading && weather
              ? calculateFusedRisk({
                  kondisi: weather.kondisi,
                  kelembapan: weather.kelembapan,
                  channelCapacityPercent: reading.channelCapacityPercent,
                  rainfallMm: reading.rainfallMm,
                })
              : null;

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-sm">{node.nodeId}</p>
                  <p className="text-xs text-muted-foreground">{node.name}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {node.protocol}
                </Badge>
              </div>

              {reading ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets size={14} className="text-blue-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ketinggian Air</p>
                      <p className="font-semibold">{reading.channelCapacityPercent}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CloudRain size={14} className="text-green-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Curah Hujan</p>
                      <p className="font-semibold">{reading.rainfallMm} mm/jam</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Thermometer size={14} className="text-orange-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Suhu</p>
                      <p className="font-semibold">{reading.temperature}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity size={14} className="text-purple-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Kelembapan</p>
                      <p className="font-semibold">{reading.humidity}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Menunggu telemetri...</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Battery size={11} />
                  {node.batteryPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <Wifi size={11} />
                  {node.signalStrength}%
                </span>
                <span
                  className={cn(
                    node.status === 'online' ? 'text-green-400' : 'text-yellow-400'
                  )}
                >
                  {node.status.toUpperCase()}
                </span>
                {fusion && (
                  <span className="ml-auto flex items-center gap-1">
                    <RiskBadge level={fusion.level} size="sm" />
                    {fusion.boostApplied && (
                      <Badge variant="outline" className="text-[9px] h-4">
                        Fusion Boost
                      </Badge>
                    )}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Architecture note */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Catatan IoT:</strong> Node sensor disimulasikan
        (Software-in-the-Loop) karena hardware ESP32 belum terpasang. Arsitektur tetap mengikuti
        proposal AQUA-SENSE: Perception Layer (sensor) → Network Layer (MQTT/HTTP) → Processing
        (data fusion + threshold dinamis) → Application (dashboard & alert).
      </div>
    </div>
  );
}
