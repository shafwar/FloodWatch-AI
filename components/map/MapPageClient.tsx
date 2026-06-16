'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Filter } from 'lucide-react';
import { useWeatherStore } from '@/store/weatherStore';
import { useMapStore } from '@/store/mapStore';
import { useChatFlowStore } from '@/store/chatFlowStore';
import { calculateFloodRisk, calculateRiskLabel, getFloodRiskResult, FLOOD_LEVELS } from '@/lib/floodRiskEngine';
import { MONITORING_LOCATIONS } from '@/lib/locations';
import { getConditionConfig } from '@/lib/weatherConditions';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WeatherCondition, FloodLevel } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapAnalysisOverlay } from './MapAnalysisOverlay';
import { MapAnalysisRunner } from './MapAnalysisRunner';

const FloodMap = dynamic(
  () => import('@/components/map/FloodMap').then((m) => ({ default: m.FloodMap })),
  { ssr: false, loading: () => <div className="h-full bg-muted/10 animate-pulse rounded-xl" /> }
);

export function MapPageClient() {
  const records = useWeatherStore((s) => s.records);
  const resetView = useMapStore((s) => s.resetView);
  const flyTo = useMapStore((s) => s.flyTo);
  const analysis = useChatFlowStore((s) => s.analysis);
  const isAnalysisMode = Boolean(analysis);

  // Selesaikan overlay dashboard begitu halaman peta siap
  useEffect(() => {
    if (isAnalysisMode) {
      useChatFlowStore.getState().setNavigatingToMap(false);
    }
  }, [isAnalysisMode]);

  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<FloodLevel | 'ALL'>('ALL');

  const locationData = useMemo(() => {
    return MONITORING_LOCATIONS.map((loc) => {
      const record =
        records.find((r) => r.keterangan === 'Saat Ini' && r.daerah === loc.name) ?? null;
      const score = record ? calculateFloodRisk(record.kondisi as WeatherCondition, record.kelembapan) : 0;
      const level = calculateRiskLabel(score);
      const risk = getFloodRiskResult(score);
      const cond = record ? getConditionConfig(record.kondisi) : null;
      return { loc, record, score, level, risk, cond };
    });
  }, [records]);

  const filteredData = useMemo(
    () => (riskFilter === 'ALL' ? locationData : locationData.filter((d) => d.level === riskFilter)),
    [locationData, riskFilter]
  );

  const handleLocClick = (locId: string) => {
    const data = locationData.find((d) => d.loc.id === locId);
    if (data) {
      flyTo([data.loc.lat, data.loc.lng], 15);
      setSelectedLocId(locId);
    }
  };

  if (isAnalysisMode && analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -my-4 lg:-my-6 bg-background"
      >
        <MapAnalysisRunner />
        <div className="absolute inset-0 overflow-hidden">
          <FloodMap
            height="100%"
            showLegend={false}
            showScanBanner={false}
            analysisMode
            analysisPhase={analysis.phase}
            instanceId="analysis"
            interactive
            className="rounded-none"
          />
          {analysis.phase !== 'scanning' && (
          <MapAnalysisOverlay
            phase={analysis.phase}
            locationName={analysis.locationName}
            riskLevel={analysis.riskLevel}
            riskScore={analysis.riskScore}
            kondisi={analysis.kondisi}
            suhu={analysis.suhu}
            kelembapan={analysis.kelembapan}
            slotLabel={analysis.slotLabel}
          />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      <div className="w-72 shrink-0 flex flex-col gap-3 overflow-hidden">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Filter size={12} />
            Filter Tingkat Risiko
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'AMAN', 'WASPADA', 'SIAGA', 'BAHAYA'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={cn(
                  'text-[10px] px-2.5 py-1 rounded-full border font-semibold transition-colors',
                  riskFilter === level
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {level === 'ALL' ? 'Semua' : level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b border-border shrink-0">
            <p className="text-xs font-semibold text-foreground">Titik Pantau</p>
            <p className="text-[10px] text-muted-foreground">{filteredData.length} lokasi</p>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1">
              {filteredData.map(({ loc, record, score, level, risk, cond }) => (
                <button
                  key={loc.id}
                  onClick={() => handleLocClick(loc.id)}
                  className={cn(
                    'w-full text-left p-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-muted/40 group',
                    selectedLocId === loc.id ? 'bg-primary/10 border border-primary/30' : 'border border-transparent'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: risk.color, boxShadow: `0 0 6px ${risk.color}88` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight truncate">{loc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px]">{cond?.icon ?? '🌤️'}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {record?.kondisi ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                    <RiskBadge level={level} size="sm" />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${score}%`, backgroundColor: risk.color }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground">{score}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={resetView} className="flex-1 h-8 gap-1.5 text-xs">
            <RotateCcw size={12} />
            Reset View
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-border relative min-h-0">
        <FloodMap height="100%" showLegend={true} className="rounded-2xl" instanceId="full" />

        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
          {FLOOD_LEVELS.slice().reverse().map((lvl) => {
            const count = locationData.filter((d) => d.level === lvl.level).length;
            return (
              <div key={lvl.level} className="fw-glass rounded-lg px-3 py-1.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lvl.color }} />
                <span className="text-xs font-semibold" style={{ color: lvl.color }}>{count}</span>
                <span className="text-[10px] text-muted-foreground">{lvl.level}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
