import { AppShell } from '@/components/layout/AppShell';
import { SensorsPageClient } from '@/components/sensors/SensorsPageClient';

export const metadata = {
  title: 'Sensor IoT | FloodWatch Semarang',
  description: 'Telemetri virtual node AQUA-SENSE — ketinggian air, curah hujan, dan data fusion',
};

export default function SensorsPage() {
  return (
    <AppShell>
      <SensorsPageClient />
    </AppShell>
  );
}
