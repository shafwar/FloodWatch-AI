'use client';

// =============================================================================
// FloodWatch Semarang — Alerts Page Client
// Full alert management with timeline, filters, and stats
// =============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bell, CheckCircle, Clock,
  AlertCircle, Zap, Eye, Download, BellRing
} from 'lucide-react';
import { useAlertStore } from '@/store/alertStore';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateTime, exportToCSV } from '@/lib/utils';
import { PreventionPanel } from '@/components/alerts/PreventionPanel';
import type { AlertSeverity, AlertStatus, AlertSource } from '@/types';

const SOURCE_LABEL: Record<AlertSource, string> = {
  weather: 'BMKG',
  sensor: 'Sensor IoT',
  fusion: 'Data Fusion',
};

const SEVERITY_CONFIG: Record<AlertSeverity, {
  label: string; color: string; bgColor: string; borderColor: string; icon: typeof AlertTriangle
}> = {
  emergency:   { label: 'Darurat',    color: 'text-red-400',    bgColor: 'bg-red-500/10',    borderColor: 'border-red-500/30',    icon: Zap },
  critical:    { label: 'Kritis',     color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', icon: AlertTriangle },
  warning:     { label: 'Peringatan', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', icon: AlertCircle },
  information: { label: 'Informasi',  color: 'text-blue-400',   bgColor: 'bg-blue-500/10',   borderColor: 'border-blue-500/30',   icon: Bell },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string }> = {
  active:       { label: 'Aktif',        color: 'text-green-400' },
  acknowledged: { label: 'Dikonfirmasi', color: 'text-yellow-400' },
  resolved:     { label: 'Selesai',      color: 'text-muted-foreground' },
};

export function AlertsPageClient() {
  const alerts = useAlertStore((s) => s.alerts);
  const markAllAsRead = useAlertStore((s) => s.markAllAsRead);
  const markAsRead = useAlertStore((s) => s.markAsRead);
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert);
  const resolveAlert = useAlertStore((s) => s.resolveAlert);
  const unreadCount = useAlertStore((s) => s.getUnreadCount());

  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filtered = useMemo(() => {
    let data = alerts;
    if (severityFilter !== 'ALL') data = data.filter((a) => a.severity === severityFilter);
    if (showUnreadOnly) data = data.filter((a) => !a.read);
    return data;
  }, [alerts, severityFilter, showUnreadOnly]);

  // Stats
  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter((a) => a.status === 'active').length,
    emergency: alerts.filter((a) => a.severity === 'emergency').length,
    unread: unreadCount,
  }), [alerts, unreadCount]);

  const handleExport = () => {
    exportToCSV(
      filtered.map((a) => ({
        ID: a.id,
        Lokasi: a.daerah,
        Kondisi: a.kondisi,
        Level: a.floodLevel,
        Skor: a.floodScore,
        Severity: a.severity,
        Status: a.status,
        Pesan: a.message,
        Waktu: a.timestamp,
      })),
      `floodwatch-alerts-${new Date().toISOString().slice(0, 10)}`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Alert', value: stats.total, color: 'text-foreground', icon: Bell },
          { label: 'Belum Dibaca', value: stats.unread, color: 'text-primary', icon: BellRing },
          { label: 'Aktif', value: stats.active, color: 'text-green-400', icon: AlertCircle },
          { label: 'Darurat', value: stats.emergency, color: 'text-red-400', icon: Zap },
        ].map(({ label, value, color, icon: Icon }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-muted/50">
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Severity filter */}
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'emergency', 'critical', 'warning', 'information'] as const).map((sev) => {
            const config = sev !== 'ALL' ? SEVERITY_CONFIG[sev] : null;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
                  severityFilter === sev
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {sev === 'ALL' ? 'Semua' : config!.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
              showUnreadOnly ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
            )}
          >
            Belum Dibaca
          </button>
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="h-8 gap-1.5">
            <CheckCircle size={13} />
            Tandai Semua Dibaca
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1.5">
            <Download size={13} />
            Export
          </Button>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-border bg-card p-12 text-center"
            >
              <Bell size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">Tidak ada alert ditemukan</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Coba ubah filter</p>
            </motion.div>
          ) : (
            filtered.slice(0, 50).map((alert, idx) => {
              const sevConfig = SEVERITY_CONFIG[alert.severity];
              const SevIcon = sevConfig.icon;
              const statusConf = STATUS_CONFIG[alert.status];

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  className={cn(
                    'rounded-xl border p-4 transition-all duration-200 group',
                    !alert.read
                      ? `${sevConfig.bgColor} ${sevConfig.borderColor}`
                      : 'border-border bg-card hover:bg-muted/10',
                    alert.severity === 'emergency' && alert.status === 'active' && 'pulse-red'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Severity icon */}
                    <div className={cn('p-2 rounded-xl mt-0.5 shrink-0', sevConfig.bgColor)}>
                      <SevIcon size={16} className={sevConfig.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-foreground">{alert.daerah}</p>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] h-5 px-1.5', sevConfig.color, sevConfig.borderColor)}
                        >
                          {sevConfig.label}
                        </Badge>
                        <RiskBadge level={alert.floodLevel} size="sm" />
                        {!alert.read && (
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">{alert.message}</p>
                      {alert.sensorSnapshot && (
                        <p className="text-[11px] text-muted-foreground/80 mt-1">
                          IoT: air {alert.sensorSnapshot.waterLevelPercent}% · hujan{' '}
                          {alert.sensorSnapshot.rainfallMm} mm/jam
                        </p>
                      )}
                      {alert.status === 'active' && alert.preventionActions.length > 0 && (
                        <div className="mt-3">
                          <PreventionPanel actions={alert.preventionActions} compact />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {SOURCE_LABEL[alert.source]}
                        </Badge>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                          <Clock size={10} />
                          {formatDateTime(alert.timestamp)}
                        </span>
                        <span className={cn('text-[11px] font-medium', statusConf.color)}>
                          {statusConf.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {!alert.read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1"
                        >
                          <Eye size={10} />
                          Baca
                        </button>
                      )}
                      {alert.status === 'active' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-[10px] text-yellow-400 hover:underline"
                        >
                          Konfirmasi
                        </button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="text-[10px] text-muted-foreground hover:underline"
                        >
                          Selesai
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
