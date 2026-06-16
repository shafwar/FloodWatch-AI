// =============================================================================
// AQUA-SENSE — Virtual IoT Sensor Nodes (ESP32 simulation)
// 4 titik pantau fisik di lokasi rawan banjir Semarang
// =============================================================================

import type { IoTSensorNode } from '@/types';
import { LOCATION_MAP } from '@/lib/locations';

const NODE_SPECS: Array<{
  id: string;
  nodeId: string;
  locationId: string;
  protocol: 'MQTT' | 'HTTP';
}> = [
  { id: 'node-01', nodeId: 'AQUA-NODE-01', locationId: 'semarang-utara-bandarharjo', protocol: 'MQTT' },
  { id: 'node-02', nodeId: 'AQUA-NODE-02', locationId: 'gemah', protocol: 'MQTT' },
  { id: 'node-03', nodeId: 'AQUA-NODE-03', locationId: 'semarang-tengah-miroto', protocol: 'HTTP' },
  { id: 'node-04', nodeId: 'AQUA-NODE-04', locationId: 'wonodri', protocol: 'MQTT' },
];

export const IOT_SENSOR_NODES: IoTSensorNode[] = NODE_SPECS.map((spec) => {
  const loc = LOCATION_MAP[spec.locationId];
  return {
    id: spec.id,
    nodeId: spec.nodeId,
    locationId: spec.locationId,
    name: loc?.name ?? spec.locationId,
    lat: loc?.lat ?? -7.0,
    lng: loc?.lng ?? 110.42,
    status: 'online',
    batteryPercent: 88,
    signalStrength: 92,
    lastSeen: new Date().toISOString(),
    firmware: 'AQUA-SENSE v1.2.0',
    protocol: spec.protocol,
  };
});

export const SENSOR_NODE_MAP = Object.fromEntries(IOT_SENSOR_NODES.map((n) => [n.id, n]));
export const SENSOR_NODE_BY_LOCATION = Object.fromEntries(
  IOT_SENSOR_NODES.map((n) => [n.locationId, n])
);
