'use client';

import Link from 'next/link';
import { AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import { useAlertStore } from '@/store/alertStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AlertSource, FloodAlert } from '@/types';

const SOURCE_LABEL: Record<AlertSource, string> = {
  weather: 'BMKG',
  sensor: 'Sensor IoT',
  fusion: 'Data Fusion',
};

function AlertCard({
  alert,
  onRead,
}: {
  alert: FloodAlert;
  onRead: () => void;
}) {
  const isEmergency = alert.severity === 'emergency' || alert.severity === 'critical';

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        !alert.read
          ? isEmergency
            ? 'border-red-500/40 bg-red-500/10'
            : 'border-yellow-500/40 bg-yellow-500/10'
          : 'border-border/60 bg-muted/20'
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          size={16}
          className={cn(
            'shrink-0 mt-0.5',
            isEmergency ? 'text-red-400' : 'text-yellow-400'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Peringatan Dini · {SOURCE_LABEL[alert.source]}
            </p>
            {!alert.read && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="font-semibold text-sm mt-0.5">{alert.daerah}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-3">
            {alert.message}
          </p>
          {alert.preventionActions[0] && (
            <p className="text-[11px] text-primary mt-2 flex items-center gap-1">
              <Shield size={11} className="shrink-0" />
              {alert.preventionActions[0].title}
            </p>
          )}
          <button
            type="button"
            onClick={onRead}
            className="text-[11px] text-muted-foreground hover:text-primary mt-2"
          >
            Tandai dibaca
          </button>
        </div>
      </div>
    </div>
  );
}

interface AlertNavPanelProps {
  onClose?: () => void;
}

export function AlertNavPanel({ onClose }: AlertNavPanelProps) {
  const alerts = useAlertStore((s) => s.alerts);
  const markAsRead = useAlertStore((s) => s.markAsRead);
  const markAllAsRead = useAlertStore((s) => s.markAllAsRead);
  const unreadCount = useAlertStore((s) => s.getUnreadCount());
  const activeAlerts = alerts.filter((a) => a.status === 'active');

  return (
    <div className="flex flex-col max-h-[min(70vh,520px)]">
      <div className="flex items-center justify-between px-1 pb-3 border-b border-border/50 shrink-0">
        <div>
          <p className="font-semibold text-sm">Peringatan Dini</p>
          <p className="text-[11px] text-muted-foreground">
            {activeAlerts.length} alert aktif
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-[10px] h-5">
            {unreadCount} belum dibaca
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-3 space-y-2 min-h-0">
        {activeAlerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <AlertTriangle size={28} className="mx-auto mb-2 opacity-30" />
            Tidak ada alert aktif
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRead={() => markAsRead(alert.id)}
            />
          ))
        )}
      </div>

      <div className="pt-3 border-t border-border/50 flex flex-wrap gap-2 shrink-0">
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs flex-1"
            onClick={() => markAllAsRead()}
          >
            Tandai semua dibaca
          </Button>
        )}
        <Link href="/alerts" onClick={onClose}>
          <Button variant="default" size="sm" className="h-8 text-xs w-full gap-1.5">
            <ExternalLink size={12} />
            Alert Center
          </Button>
        </Link>
      </div>
    </div>
  );
}
