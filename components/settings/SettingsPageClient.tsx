'use client';

import { motion } from 'framer-motion';
import { Sun, Moon, Bell, Map, RefreshCw, Info, Shield } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useWeatherStore } from '@/store/weatherStore';
import { useAlertStore } from '@/store/alertStore';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'w-10 h-5 rounded-full transition-colors relative shrink-0',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <div
        className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function SettingsPageClient() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const meta = useWeatherStore((s) => s.meta);
  const activeSource = useWeatherStore((s) => s.activeSource);
  const activeAlertCount = useAlertStore(
    (s) => s.alerts.filter((a) => a.status === 'active').length
  );

  const sourceLabel =
    meta?.bmkgStatus === 'online'
      ? 'API BMKG'
      : meta?.bmkgStatus === 'degraded'
        ? 'Hybrid BMKG + CSV'
        : meta?.bmkgStatus === 'offline'
          ? 'CSV Fallback'
          : 'Menghubungkan...';

  return (
    <div className="space-y-5 max-w-3xl mx-auto w-full">
      <div>
        <h2 className="text-lg font-semibold">Pengaturan</h2>
        <p className="text-sm text-muted-foreground">Tampilan, monitoring, dan notifikasi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tampilan */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sun size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Tampilan</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                id={`theme-${t}-btn`}
                onClick={() => setTheme(t)}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-medium transition-all',
                  theme === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/40'
                )}
              >
                {t === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                {t === 'dark' ? 'Gelap' : 'Terang'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Status monitoring */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-green-400" />
            <h3 className="font-semibold text-sm">Status Monitoring</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sumber data</span>
              <span className="font-medium">{sourceLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BMKG status</span>
              <span className="font-medium uppercase">{meta?.bmkgStatus ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alert aktif</span>
              <span className="font-medium">{activeAlertCount} lokasi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sync BMKG</span>
              <span className="font-medium">Slot 3 jam WIB</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monitoring & Notifikasi */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw size={16} className="text-green-400" />
          <h3 className="font-semibold text-sm">Monitoring & Notifikasi</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Alert otomatis dari data fusion BMKG + sensor IoT virtual. Tindakan pencegahan disertakan
          per level risiko (WASPADA → BAHAYA).
        </p>

        <SettingRow
          label="Interval Pembaruan"
          description="Seberapa sering data & chart di-refresh (di samping sync slot BMKG)"
        >
          <Select
            value={String(settings.refreshInterval)}
            onValueChange={(v) => updateSettings({ refreshInterval: Number(v) })}
          >
            <SelectTrigger className="w-28 h-8 text-xs" id="refresh-interval-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 detik</SelectItem>
              <SelectItem value="60">1 menit</SelectItem>
              <SelectItem value="120">2 menit</SelectItem>
              <SelectItem value="300">5 menit</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label="Notifikasi Alert"
          description="Tampilkan peringatan di bell icon saat risiko tinggi / hujan"
        >
          <Toggle
            id="toggle-notifications"
            checked={settings.notifications}
            onChange={() => updateSettings({ notifications: !settings.notifications })}
          />
        </SettingRow>

        <SettingRow
          label="Notifikasi Browser"
          description="Pop-up sistem saat alert SIAGA/BAHAYA (perlu izin browser)"
        >
          <Toggle
            id="toggle-browserNotifications"
            checked={settings.browserNotifications}
            onChange={async () => {
              if (!settings.browserNotifications && typeof Notification !== 'undefined') {
                await Notification.requestPermission();
              }
              updateSettings({ browserNotifications: !settings.browserNotifications });
            }}
          />
        </SettingRow>

        <SettingRow
          label="Suara Alert"
          description="Bunyi saat alert darurat (SIAGA/BAHAYA)"
        >
          <Toggle
            id="toggle-soundAlerts"
            checked={settings.soundAlerts}
            onChange={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
          />
        </SettingRow>

        <SettingRow
          label="Auto Center Map"
          description="Pusatkan peta ke lokasi berisiko tinggi"
        >
          <Toggle
            id="toggle-autoCenter"
            checked={settings.autoCenter}
            onChange={() => updateSettings({ autoCenter: !settings.autoCenter })}
          />
        </SettingRow>
      </motion.div>

      {/* Info sistem */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-purple-400" />
          <h3 className="font-semibold text-sm">Informasi Sistem</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {[
            { label: 'Platform', value: 'FloodWatch Semarang v1.0' },
            { label: 'Framework', value: 'Next.js App Router' },
            { label: 'Sumber Aktif', value: sourceLabel },
            { label: 'Source Code', value: (activeSource ?? meta?.source ?? '—').toUpperCase() },
            { label: 'AI Assistant', value: 'AQUA (Gemini)' },
            { label: 'IoT Nodes', value: '4 Virtual (ESP32 sim)' },
            { label: 'Titik Pantau', value: '10 Kelurahan Semarang' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-3 py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
